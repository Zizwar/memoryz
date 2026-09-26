/**
 * TypeSafe Jev AI Integration for MemoryZ
 * System One Decision & Quality Gate Engine
 */

import { SettingsService } from "./settings.ts";

const TYPESAFE_API_URL = "https://api.typesafe.ai/v1/systemone";
const VERCEL_AI_URL = "https://ai-gateway.vercel.sh/typesafe/v1/systemone";
const DEFAULT_MODEL = "jev-latest";

export class JevService {
  private static apiKey = Deno.env.get("JEV_AI_KEY") || "";

  static setApiKey(key: string) {
    this.apiKey = key;
  }

  static async isEnabled(): Promise<boolean> {
    if (Deno.env.get("JEV_DISABLED") === "true" || Deno.env.get("DISABLE_JEV") === "true") {
      return false;
    }
    const dbEnabled = await SettingsService.isJevEnabled();
    if (!dbEnabled) return false;
    const hasKey = Boolean(
      (Deno.env.get("VERCEL_AI_KEY") || this.apiKey || Deno.env.get("JEV_AI_KEY") || "").trim()
    );
    return hasKey;
  }

  static async evaluate(state: any, questions: Record<string, any>, model = DEFAULT_MODEL): Promise<any> {
    const enabled = await this.isEnabled();
    if (!enabled) {
      throw new Error("Jev AI is currently disabled in system settings to protect credits.");
    }

    const vercelKey = Deno.env.get("VERCEL_AI_KEY")?.trim();
    const directKey = (this.apiKey || Deno.env.get("JEV_AI_KEY") || "").trim();

    // Prefer Vercel AI Gateway if configured, fallback to direct TypeSafe API
    const isVercel = Boolean(vercelKey);
    const apiUrl = isVercel ? VERCEL_AI_URL : TYPESAFE_API_URL;
    const token = isVercel ? vercelKey : directKey;
    const effectiveModel = isVercel && (model === DEFAULT_MODEL || !model) ? "typesafe-ai/jev" : model;

    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        // Wait 1.5s before retry on transient errors
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }

      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            state,
            model: effectiveModel,
            questions,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          const isTransient = res.status === 429 || res.status === 503 || res.status === 502;
          if (isTransient && attempt < maxRetries) {
            console.warn(`[JevService] Transient ${res.status} upstream error, retrying (${attempt + 1}/${maxRetries})...`);
            continue;
          }
          throw new Error(`Jev AI evaluation failed via ${isVercel ? 'Vercel AI Gateway' : 'TypeSafe'} (${res.status}): ${errText}`);
        }

        return await res.json();
      } catch (err) {
        lastError = err as Error;
        if (attempt >= maxRetries) throw err;
      }
    }

    throw lastError || new Error("Jev AI evaluation failed after retries");
  }

  /**
   * Evaluates if a text chunk is worth persistent memory storage and determines its namespace
   */
  static async evaluateMemoryCandidate(content: string): Promise<{
    isWorthSaving: boolean;
    saveProbability: number;
    namespace: string;
    type: "note" | "skill" | "preference" | "env";
  }> {
    const res = await this.evaluate(content, {
      is_worth_saving: {
        type: "noul",
        instructions: "Is this information a valuable persistent rule, architectural decision, or reusable knowledge worth storing in long-term memory?",
        criteria: {
          true: "Architecture decision, pattern, persistent fact, key finding, or reusable skill.",
          false: "Transient conversational chatter, trivial log line, or ephemeral temporary text.",
        },
      },
      suggested_namespace: {
        type: "choice",
        instructions: "Select the most accurate project namespace for this memory atom.",
        criteria: {
          vibzcode: "VibzCode, AGYZ, orchestrator, agent engine, or multi-engine platform.",
          memoryz: "MemoryZ substrate, Turso vector DB, vault, tasks, webhooks, or Deno.",
          ferme: "Ferme Rêve d'Enfants, farm project, agriculture, nature, or eco-tourism.",
          default: "General programming, personal user preference, or cross-project knowledge.",
        },
      },
      memory_type: {
        type: "choice",
        instructions: "What type classification best fits this memory?",
        criteria: {
          note: "General factual note, summary, or knowledge record.",
          skill: "Procedural agent skill, instructions, or operational routine.",
          preference: "User preference, tone, or style guideline.",
          env: "Environment variables, ports, server address, or configuration spec.",
        },
      },
    });

    const prob = res.answers?.is_worth_saving?.noul ?? 0.5;
    return {
      isWorthSaving: prob >= 0.65,
      saveProbability: prob,
      namespace: res.answers?.suggested_namespace?.choice || "default",
      type: (res.answers?.memory_type?.choice as any) || "note",
    };
  }

  /**
   * Determine task priority and urgency
   */
  static async evaluateTaskUrgency(title: string, description?: string): Promise<{
    priority: "low" | "medium" | "high" | "urgent";
    confidence: number;
  }> {
    const state = description ? `Title: ${title}\nDescription: ${description}` : title;
    const res = await this.evaluate(state, {
      priority: {
        type: "choice",
        instructions: "Assign the appropriate operational priority level for this engineering task.",
        criteria: {
          urgent: "Blocking critical bug, security vulnerability, data loss, or server down.",
          high: "Core architectural feature, significant refactor, or important milestone.",
          medium: "Normal feature, routine test, standard enhancement, or documentation.",
          low: "Minor polish, non-blocking cosmetic detail, or future exploratory idea.",
        },
      },
    });

    return {
      priority: (res.answers?.priority?.choice as any) || "medium",
      confidence: res.answers?.priority?.confidence ?? 0.5,
    };
  }
}
