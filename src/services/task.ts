import { getDb } from "../db/client.ts";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface TaskItem {
  id: string;
  user_id: string;
  parent_id: string | null;
  title: string;
  description: string | null;
  status: string; // "todo" | "in_progress" | "done" | "blocked" or custom agent states
  priority: TaskPriority;
  assignee: string | null;
  metadata: Record<string, unknown>;
  order_index: number;
  created_at: number;
  updated_at: number;
  completed_at: number | null;
}

export interface TaskTreeNode extends TaskItem {
  children: TaskTreeNode[];
}

export interface CreateTaskParams {
  userId: string;
  title: string;
  parentId?: string | null;
  description?: string;
  status?: string;
  priority?: TaskPriority;
  assignee?: string;
  metadata?: Record<string, unknown>;
  orderIndex?: number;
}

export interface UpdateTaskParams {
  title?: string;
  parentId?: string | null;
  description?: string;
  status?: string;
  priority?: TaskPriority;
  assignee?: string | null;
  metadata?: Record<string, unknown>;
  orderIndex?: number;
}

export interface TaskFilterParams {
  status?: string;
  parentId?: string | null;
  assignee?: string;
  limit?: number;
}

export class TaskService {
  /**
   * Generate clean nanoid-style task identifier
   */
  private static generateTaskId(): string {
    const timestamp = Date.now().toString(36);
    const rand = Math.random().toString(36).substring(2, 7);
    return `task_${timestamp}_${rand}`;
  }

  /**
   * Create a new task or nested subtask
   */
  static async create(params: CreateTaskParams): Promise<TaskItem> {
    const db = getDb();
    const id = this.generateTaskId();
    const now = Math.floor(Date.now() / 1000);
    const title = params.title.trim();
    if (!title) throw new Error("Task title cannot be empty");

    const parentId = params.parentId ? params.parentId.trim() : null;
    const status = (params.status || "todo").trim();
    const priority = params.priority || "medium";
    const assignee = params.assignee ? params.assignee.trim() : null;
    const description = params.description ? params.description.trim() : null;
    const metadataStr = JSON.stringify(params.metadata || {});
    const orderIndex = typeof params.orderIndex === "number" ? params.orderIndex : 0;
    const completedAt = status.toLowerCase() === "done" || status.toLowerCase() === "completed" ? now : null;

    // Verify parent exists if given
    if (parentId) {
      const parentCheck = await db.execute({
        sql: "SELECT id FROM tasks WHERE id = ? AND user_id = ? LIMIT 1;",
        args: [parentId, params.userId],
      });
      if (parentCheck.rows.length === 0) {
        throw new Error(`Parent task '${parentId}' not found`);
      }
    }

    await db.execute({
      sql: `
        INSERT INTO tasks (
          id, user_id, parent_id, title, description,
          status, priority, assignee, metadata, order_index,
          created_at, updated_at, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      args: [
        id,
        params.userId,
        parentId,
        title,
        description,
        status,
        priority,
        assignee,
        metadataStr,
        orderIndex,
        now,
        now,
        completedAt,
      ],
    });

    return {
      id,
      user_id: params.userId,
      parent_id: parentId,
      title,
      description,
      status,
      priority,
      assignee,
      metadata: params.metadata || {},
      order_index: orderIndex,
      created_at: now,
      updated_at: now,
      completed_at: completedAt,
    };
  }

  /**
   * Update an existing task
   */
  static async update(userId: string, id: string, updates: UpdateTaskParams): Promise<TaskItem> {
    const db = getDb();
    const current = await this.get(userId, id);
    if (!current) throw new Error(`Task '${id}' not found`);

    const now = Math.floor(Date.now() / 1000);
    const newTitle = updates.title !== undefined ? updates.title.trim() : current.title;
    if (!newTitle) throw new Error("Task title cannot be empty");

    const newParentId = updates.parentId !== undefined ? (updates.parentId ? updates.parentId.trim() : null) : current.parent_id;
    if (newParentId === id) throw new Error("A task cannot be its own parent");

    const newDescription = updates.description !== undefined ? (updates.description ? updates.description.trim() : null) : current.description;
    const newStatus = updates.status !== undefined ? updates.status.trim() : current.status;
    const newPriority = updates.priority !== undefined ? updates.priority : current.priority;
    const newAssignee = updates.assignee !== undefined ? (updates.assignee ? updates.assignee.trim() : null) : current.assignee;
    const newMetadata = updates.metadata !== undefined ? updates.metadata : current.metadata;
    const newOrderIndex = updates.orderIndex !== undefined ? updates.orderIndex : current.order_index;

    // Handle completed_at timestamp transitions
    let newCompletedAt = current.completed_at;
    const isDone = newStatus.toLowerCase() === "done" || newStatus.toLowerCase() === "completed";
    const wasDone = current.status.toLowerCase() === "done" || current.status.toLowerCase() === "completed";
    if (isDone && !wasDone) {
      newCompletedAt = now;
    } else if (!isDone && wasDone) {
      newCompletedAt = null;
    }

    await db.execute({
      sql: `
        UPDATE tasks
        SET title = ?, parent_id = ?, description = ?, status = ?,
            priority = ?, assignee = ?, metadata = ?, order_index = ?,
            updated_at = ?, completed_at = ?
        WHERE id = ? AND user_id = ?;
      `,
      args: [
        newTitle,
        newParentId,
        newDescription,
        newStatus,
        newPriority,
        newAssignee,
        JSON.stringify(newMetadata),
        newOrderIndex,
        now,
        newCompletedAt,
        id,
        userId,
      ],
    });

    return {
      id,
      user_id: userId,
      parent_id: newParentId,
      title: newTitle,
      description: newDescription,
      status: newStatus,
      priority: newPriority,
      assignee: newAssignee,
      metadata: newMetadata,
      order_index: newOrderIndex,
      created_at: current.created_at,
      updated_at: now,
      completed_at: newCompletedAt,
    };
  }

  /**
   * Delete a task (with optional recursive child cascade)
   */
  static async delete(userId: string, id: string, cascade = true): Promise<boolean> {
    const db = getDb();
    const task = await this.get(userId, id);
    if (!task) return false;

    if (cascade) {
      // Find all descendant IDs recursively
      const allDescendants = await this.getAllDescendantIds(userId, id);
      const targetIds = [id, ...allDescendants];
      const placeholders = targetIds.map(() => "?").join(",");
      await db.execute({
        sql: `DELETE FROM tasks WHERE user_id = ? AND id IN (${placeholders});`,
        args: [userId, ...targetIds],
      });
    } else {
      // Reparent children to this task's parent
      await db.execute({
        sql: "UPDATE tasks SET parent_id = ? WHERE user_id = ? AND parent_id = ?;",
        args: [task.parent_id, userId, id],
      });
      await db.execute({
        sql: "DELETE FROM tasks WHERE user_id = ? AND id = ?;",
        args: [userId, id],
      });
    }

    return true;
  }

  private static async getAllDescendantIds(userId: string, parentId: string): Promise<string[]> {
    const db = getDb();
    const res = await db.execute({
      sql: "SELECT id FROM tasks WHERE user_id = ? AND parent_id = ?;",
      args: [userId, parentId],
    });
    const childrenIds = res.rows.map((r) => r.id as string);
    const all = [...childrenIds];
    for (const childId of childrenIds) {
      const sub = await this.getAllDescendantIds(userId, childId);
      all.push(...sub);
    }
    return all;
  }

  /**
   * Get a single task by ID
   */
  static async get(userId: string, id: string): Promise<TaskItem | null> {
    const db = getDb();
    const res = await db.execute({
      sql: "SELECT * FROM tasks WHERE user_id = ? AND id = ? LIMIT 1;",
      args: [userId, id],
    });
    if (res.rows.length === 0) return null;
    return this.mapRow(res.rows[0]);
  }

  /**
   * List tasks with filters
   */
  static async list(userId: string, filter: TaskFilterParams = {}): Promise<TaskItem[]> {
    const db = getDb();
    let sql = "SELECT * FROM tasks WHERE user_id = ?";
    const args: any[] = [userId];

    if (filter.status) {
      if (filter.status === "active") {
        sql += " AND LOWER(status) NOT IN ('done', 'completed', 'cancelled')";
      } else {
        sql += " AND LOWER(status) = LOWER(?)";
        args.push(filter.status);
      }
    }

    if (filter.parentId !== undefined) {
      if (filter.parentId === null || filter.parentId === "root") {
        sql += " AND (parent_id IS NULL OR parent_id = '')";
      } else {
        sql += " AND parent_id = ?";
        args.push(filter.parentId);
      }
    }

    if (filter.assignee) {
      sql += " AND assignee = ?";
      args.push(filter.assignee);
    }

    sql += " ORDER BY order_index ASC, created_at ASC";

    if (filter.limit) {
      sql += " LIMIT ?";
      args.push(filter.limit);
    }

    const res = await db.execute({ sql, args });
    return res.rows.map((row) => this.mapRow(row));
  }

  /**
   * Retrieve hierarchical nested task tree
   */
  static async getTree(userId: string, filter: { status?: string } = {}): Promise<TaskTreeNode[]> {
    const allTasks = await this.list(userId, { status: filter.status });
    return this.buildTree(allTasks);
  }

  /**
   * Convert flat task list into a nested tree structure
   */
  static buildTree(tasks: TaskItem[]): TaskTreeNode[] {
    const map = new Map<string, TaskTreeNode>();
    const roots: TaskTreeNode[] = [];

    // Initialize nodes
    for (const t of tasks) {
      map.set(t.id, { ...t, children: [] });
    }

    // Connect parents and children
    for (const t of tasks) {
      const node = map.get(t.id)!;
      if (t.parent_id && map.has(t.parent_id)) {
        map.get(t.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  /**
   * Format task tree into ultra-compact, token-efficient text for AI context injection
   * Only ~15-20 tokens per item instead of 150 tokens of JSON!
   */
  static formatTreeAscii(nodes: TaskTreeNode[], indent = 0): string {
    let out = "";
    const prefix = "  ".repeat(indent);

    for (const node of nodes) {
      const isDone = node.status.toLowerCase() === "done" || node.status.toLowerCase() === "completed";
      const icon = isDone ? "[✓]" : node.status.toLowerCase() === "in_progress" ? "[⏳]" : node.status.toLowerCase() === "blocked" ? "[✕]" : "[ ]";
      const assigneeTag = node.assignee ? ` (@${node.assignee})` : "";
      const priorityTag = node.priority !== "medium" ? ` [${node.priority.toUpperCase()}]` : "";
      const statusTag = !isDone && node.status !== "todo" ? ` <${node.status}>` : "";

      out += `${prefix}${icon} ${node.title} (ID: ${node.id})${statusTag}${priorityTag}${assigneeTag}\n`;

      if (node.description) {
        out += `${prefix}    ↳ ${node.description.replace(/\n/g, " ")}\n`;
      }

      if (node.children && node.children.length > 0) {
        out += this.formatTreeAscii(node.children, indent + 1);
      }
    }
    return out;
  }

  /**
   * Format flat tasks list into compact one-line strings
   */
  static formatCompactList(tasks: TaskItem[]): string {
    return tasks
      .map((t) => {
        const check = t.status === "done" || t.status === "completed" ? "✓" : "○";
        const meta = [t.status, t.priority, t.assignee ? `@${t.assignee}` : null].filter(Boolean).join("|");
        return `[${check}] ${t.id}: ${t.title} (${meta})`;
      })
      .join("\n");
  }

  private static mapRow(row: any): TaskItem {
    let metadata: Record<string, unknown> = {};
    try {
      metadata = JSON.parse((row.metadata as string) || "{}");
    } catch (_e) {
      metadata = {};
    }

    return {
      id: row.id as string,
      user_id: row.user_id as string,
      parent_id: (row.parent_id as string) || null,
      title: row.title as string,
      description: (row.description as string) || null,
      status: (row.status as string) || "todo",
      priority: (row.priority as TaskPriority) || "medium",
      assignee: (row.assignee as string) || null,
      metadata,
      order_index: Number(row.order_index || 0),
      created_at: Number(row.created_at),
      updated_at: Number(row.updated_at),
      completed_at: row.completed_at ? Number(row.completed_at) : null,
    };
  }
}
