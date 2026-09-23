import { getDb } from "../db/client.ts";
import { config } from "../config.ts";
import { JevService } from "./jev.ts";
import { dispatchWebhookEvent } from "./webhook.ts";

export interface CronMaintenanceResult {
  unlockedTasksCount: number;
  decayedMemoriesCount: number;
  expiredMemoriesCount: number;
  cleanedLogsCount: number;
  compactedMemoriesCount: number;
  durationMs: number;
  details: string[];
}

/**
 * MemoryZ Autonomous Lifecycle Maintenance Job
 * Runs via Deno.cron on Deno Deploy or manual API trigger
 */
export async function runMemoryMaintenance(): Promise<CronMaintenanceResult> {
  const startTime = Date.now();
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const details: string[] = [];

  // ==============================================================
  // 1. Zombie Task Lock Sweeper
  // Releases locks held for more than 1 hour (3600 seconds)
  // ==============================================================
  const oneHourAgo = now - 3600;
  const zombieCheck = await db.execute({
    sql: "SELECT id, user_id, title, locked_by, namespace FROM tasks WHERE locked_by IS NOT NULL AND locked_at < ?",
    args: [oneHourAgo],
  });

  let unlockedTasksCount = 0;
  for (const row of zombieCheck.rows) {
    const taskId = String(row.id);
    const userId = String(row.user_id);
    const agentId = String(row.locked_by);
    const namespace = String(row.namespace || "default");

    await db.execute({
      sql: "UPDATE tasks SET locked_by = NULL, locked_at = NULL, updated_at = ? WHERE id = ?",
      args: [now, taskId],
    });
    unlockedTasksCount++;

    dispatchWebhookEvent({
      userId,
      event: "task.released",
      namespace,
      payload: { taskId, agentId, reason: "zombie_lock_timeout" },
    });
  }
  if (unlockedTasksCount > 0) {
    details.push(`Unlocked ${unlockedTasksCount} stale task lock(s).`);
  }

  // ==============================================================
  // 2. Memory Time Decay Calculation
  // ==============================================================
  const memoriesRes = await db.execute({
    sql: "SELECT hash, recall_count, last_recalled_at FROM memories WHERE is_deleted = 0 AND last_recalled_at IS NOT NULL AND recall_count > 0",
    args: [],
  });

  let decayedMemoriesCount = 0;
  for (const row of memoriesRes.rows) {
    const hash = String(row.hash);
    const recallCount = Number(row.recall_count);
    const lastRecalledAt = Number(row.last_recalled_at);

    const daysSince = Math.max(0, (now - lastRecalledAt) / 86400);
    const decayedScore = parseFloat((recallCount * Math.exp(-config.decayLambda * daysSince)).toFixed(4));

    await db.execute({
      sql: "UPDATE memories SET recall_score = ?, updated_at = ? WHERE hash = ?",
      args: [decayedScore, now, hash],
    });
    decayedMemoriesCount++;
  }
  details.push(`Updated decay scores for ${decayedMemoriesCount} active memory atom(s).`);

  // ==============================================================
  // 3. Expire Ephemeral Memories (TTL from metadata.expires_at)
  // ==============================================================
  let expiredMemoriesCount = 0;
  const ttlCheck = await db.execute({
    sql: "SELECT hash, metadata FROM memories WHERE is_deleted = 0 AND metadata LIKE '%expires_at%'",
    args: [],
  });

  for (const row of ttlCheck.rows) {
    try {
      const meta = JSON.parse(String(row.metadata || "{}"));
      if (meta.expires_at && typeof meta.expires_at === "number" && meta.expires_at < now) {
        await db.execute({
          sql: "UPDATE memories SET is_deleted = 1, updated_at = ? WHERE hash = ?",
          args: [now, String(row.hash)],
        });
        expiredMemoriesCount++;
      }
    } catch (_e) {}
  }
  if (expiredMemoriesCount > 0) {
    details.push(`Archived ${expiredMemoriesCount} expired ephemeral memory atom(s).`);
  }

  // ==============================================================
  // 4. Clean Ephemeral Logs (older than 7 days)
  // ==============================================================
  const sevenDaysAgo = now - 7 * 86400;
  const logDeleteRes = await db.execute({
    sql: "DELETE FROM logs WHERE created_at < ?",
    args: [sevenDaysAgo],
  });
  const cleanedLogsCount = logDeleteRes.rowsAffected ?? 0;
  if (cleanedLogsCount > 0) {
    details.push(`Purged ${cleanedLogsCount} ephemeral log record(s) older than 7 days.`);
  }

  // ==============================================================
  // 5. Jev AI Memory Compaction & Redundancy Detection
  // Evaluates pairs of memories in the same namespace with matching types
  // ==============================================================
  let compactedMemoriesCount = 0;
  try {
    const candidatesRes = await db.execute({
      sql: `
        SELECT hash, title, substr(content, 1, 400) as snippet, type, namespace, created_at
        FROM memories
        WHERE is_deleted = 0 AND type IN ('note', 'preference')
        ORDER BY created_at DESC
        LIMIT 15
      `,
      args: [],
    });

    const candidates = candidatesRes.rows;
    if (candidates.length >= 2) {
      // Compare top recent pair
      for (let i = 0; i < candidates.length - 1 && compactedMemoriesCount < 2; i++) {
        const memA = candidates[i];
        const memB = candidates[i + 1];

        if (memA.namespace === memB.namespace && memA.hash !== memB.hash) {
          const stateToCompare = `Memory A (${memA.title || 'Untitled'}):\n${memA.snippet}\n\nMemory B (${memB.title || 'Untitled'}):\n${memB.snippet}`;
          
          const evalRes = await JevService.evaluate(stateToCompare, {
            is_redundant: {
              type: "noul",
              instructions: "Do Memory A and Memory B state the exact same technical rule, decision, or fact, making one redundant?",
              criteria: {
                true: "Substantially identical decision or superseded duplicate.",
                false: "Distinct, complementary, or different topics.",
              },
            },
          });

          const redundancyProb = evalRes.answers?.is_redundant?.noul ?? 0;
          if (redundancyProb >= 0.85) {
            // Older memory is superseded by newer memory
            const newerHash = Number(memA.created_at) > Number(memB.created_at) ? String(memA.hash) : String(memB.hash);
            const olderHash = newerHash === String(memA.hash) ? String(memB.hash) : String(memA.hash);

            await db.execute({
              sql: `
                INSERT OR REPLACE INTO memory_links (source_hash, target_hash, relation_type, weight, created_at)
                VALUES (?, ?, 'supersedes', 1.0, ?)
              `,
              args: [newerHash, olderHash, now],
            });

            // Soft-deprecate older memory
            await db.execute({
              sql: "UPDATE memories SET recall_score = recall_score * 0.2, updated_at = ? WHERE hash = ?",
              args: [now, olderHash],
            });

            compactedMemoriesCount++;
            details.push(`Jev AI compacted redundant memories: [${newerHash.slice(0, 8)}] supersedes [${olderHash.slice(0, 8)}] (confidence: ${(redundancyProb * 100).toFixed(0)}%).`);
          }
        }
      }
    }
  } catch (jevErr) {
    console.warn("[Cron] Jev AI compaction skipped:", (jevErr as Error).message);
  }

  const durationMs = Date.now() - startTime;
  console.log(`[Cron] Memory maintenance completed in ${durationMs}ms:`, details.join(" | "));

  return {
    unlockedTasksCount,
    decayedMemoriesCount,
    expiredMemoriesCount,
    cleanedLogsCount,
    compactedMemoriesCount,
    durationMs,
    details,
  };
}
