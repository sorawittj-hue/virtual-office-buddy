export type KanbanStatus =
  | "triage"
  | "todo"
  | "ready"
  | "running"
  | "blocked"
  | "done"
  | "archived";

export type KanbanPriority = 1 | 2 | 3 | 4; // 1=urgent, 4=low

export interface KanbanComment {
  id: string;
  author: string;
  body: string;
  createdAt: number;
}

export interface KanbanRun {
  id: string;
  startedAt: number;
  completedAt?: number;
  result?: string;
  status: "running" | "done" | "error" | "blocked";
}

export interface KanbanTask {
  id: string;
  title: string;
  body?: string;
  status: KanbanStatus;
  assignee?: string;
  priority: KanbanPriority;
  tenant?: string;
  parentId?: string;
  tags?: string[];
  comments: KanbanComment[];
  runs: KanbanRun[];
  result?: string;
  summary?: string;
  blockReason?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

const STORAGE_KEY = "prism-kanban-tasks";

export function loadTasks(): KanbanTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: KanbanTask[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    /* ignore */
  }
}

export function createTask(
  fields: Pick<
    KanbanTask,
    "title" | "body" | "assignee" | "priority" | "tenant" | "parentId" | "tags"
  > & { triage?: boolean },
): KanbanTask {
  return {
    id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: fields.title,
    body: fields.body,
    status: fields.triage ? "triage" : fields.assignee ? "todo" : "triage",
    assignee: fields.assignee,
    priority: fields.priority ?? 3,
    tenant: fields.tenant,
    parentId: fields.parentId,
    tags: fields.tags ?? [],
    comments: [],
    runs: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export const COLUMN_ORDER: KanbanStatus[] = [
  "triage",
  "todo",
  "ready",
  "running",
  "blocked",
  "done",
  "archived",
];

export const COLUMN_LABEL: Record<KanbanStatus, string> = {
  triage: "Triage",
  todo: "To Do",
  ready: "Ready",
  running: "Running",
  blocked: "Blocked",
  done: "Done",
  archived: "Archived",
};

export const COLUMN_COLOR: Record<KanbanStatus, string> = {
  triage: "text-muted-foreground",
  todo: "text-blue-400",
  ready: "text-cyan-400",
  running: "text-status-working",
  blocked: "text-yellow-400",
  done: "text-status-success",
  archived: "text-muted-foreground/50",
};

export const PRIORITY_LABEL: Record<KanbanPriority, string> = {
  1: "Urgent",
  2: "High",
  3: "Medium",
  4: "Low",
};
export const PRIORITY_COLOR: Record<KanbanPriority, string> = {
  1: "bg-destructive/20 text-destructive",
  2: "bg-orange-500/20 text-orange-400",
  3: "bg-blue-500/20 text-blue-400",
  4: "bg-muted text-muted-foreground",
};

// ─── Hermes API shape (best-guess from CLI docs) ──────────────────────────────
export interface HermesKanbanTask {
  id: string;
  title: string;
  body?: string;
  status: KanbanStatus;
  assignee?: string;
  priority?: number;
  tenant?: string;
  parent_id?: string;
  result?: string;
  summary?: string;
  block_reason?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  comments?: Array<{ id: string; author: string; body: string; created_at: string }>;
  runs?: Array<{
    id: string;
    started_at: string;
    completed_at?: string;
    result?: string;
    status: string;
  }>;
}

export function fromApiTask(t: HermesKanbanTask): KanbanTask {
  return {
    id: t.id,
    title: t.title,
    body: t.body,
    status: t.status,
    assignee: t.assignee,
    priority: (t.priority ?? 3) as KanbanPriority,
    tenant: t.tenant,
    parentId: t.parent_id,
    result: t.result,
    summary: t.summary,
    blockReason: t.block_reason,
    tags: [],
    comments: (t.comments ?? []).map((c) => ({
      id: c.id,
      author: c.author,
      body: c.body,
      createdAt: new Date(c.created_at).getTime(),
    })),
    runs: (t.runs ?? []).map((r) => ({
      id: r.id,
      startedAt: new Date(r.started_at).getTime(),
      completedAt: r.completed_at ? new Date(r.completed_at).getTime() : undefined,
      result: r.result,
      status: r.status as KanbanRun["status"],
    })),
    createdAt: new Date(t.created_at).getTime(),
    updatedAt: new Date(t.updated_at).getTime(),
    completedAt: t.completed_at ? new Date(t.completed_at).getTime() : undefined,
  };
}
