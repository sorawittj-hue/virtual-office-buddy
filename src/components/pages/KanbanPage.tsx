import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Plus,
  X,
  RefreshCw,
  Cloud,
  HardDrive,
  ChevronRight,
  User,
  Tag,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Clock,
  Flag,
  Trash2,
  Check,
  Play,
  Lock,
  Unlock,
  Archive,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { useHermesService } from "@/lib/hermes-context";
import type { HermesApiService } from "@/lib/hermes-api-service";
import {
  loadTasks,
  saveTasks,
  createTask,
  fromApiTask,
  COLUMN_ORDER,
  COLUMN_LABEL,
  COLUMN_COLOR,
  PRIORITY_LABEL,
  PRIORITY_COLOR,
  type KanbanTask,
  type KanbanStatus,
  type KanbanPriority,
} from "@/lib/kanban";

const STORAGE_KEY = "prism-kanban-tasks";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(ts: number) {
  const d = Date.now() - ts;
  if (d < 60_000) return "just now";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return `${Math.floor(d / 86_400_000)}d ago`;
}

const VISIBLE_COLUMNS: KanbanStatus[] = ["triage", "todo", "ready", "running", "blocked", "done"];

const NEXT_STATUS: Partial<Record<KanbanStatus, KanbanStatus>> = {
  triage: "todo",
  todo: "ready",
  ready: "running",
  running: "done",
  blocked: "ready",
};

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, onClick }: { task: KanbanTask; onClick: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={onClick}
      className="bg-card border border-border rounded-xl px-3 py-2.5 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all space-y-1.5 group"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2">
          {task.title}
        </p>
        <span
          className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${PRIORITY_COLOR[task.priority]}`}
        >
          {PRIORITY_LABEL[task.priority]}
        </span>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
        {task.assignee && (
          <span className="flex items-center gap-0.5">
            <User className="w-2.5 h-2.5" />
            {task.assignee}
          </span>
        )}
        {task.comments.length > 0 && (
          <span className="flex items-center gap-0.5">
            <MessageSquare className="w-2.5 h-2.5" />
            {task.comments.length}
          </span>
        )}
        {task.blockReason && (
          <span className="flex items-center gap-0.5 text-yellow-400">
            <Lock className="w-2.5 h-2.5" />
            blocked
          </span>
        )}
        <span className="ml-auto">
          <Clock className="w-2.5 h-2.5 inline mr-0.5" />
          {timeAgo(task.updatedAt)}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Task Detail Panel ────────────────────────────────────────────────────────
function TaskDetail({
  task,
  onClose,
  onUpdate,
  apiService,
}: {
  task: KanbanTask;
  onClose: () => void;
  onUpdate: (t: KanbanTask) => void;
  apiService: HermesApiService | null;
}) {
  const [comment, setComment] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [result, setResult] = useState("");
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const patch = useCallback(
    (changes: Partial<KanbanTask>) => {
      const updated = { ...task, ...changes, updatedAt: Date.now() };
      onUpdate(updated);
    },
    [task, onUpdate],
  );

  const apiOrLocal = async (apiFn: () => Promise<unknown>, localFn: () => void) => {
    if (apiService) {
      setLoading(true);
      try {
        await apiFn();
      } catch {
        toast.error("API error — updated locally");
        localFn();
      } finally {
        setLoading(false);
      }
    } else {
      localFn();
    }
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    const newComment = {
      id: crypto.randomUUID(),
      author: "you",
      body: comment.trim(),
      createdAt: Date.now(),
    };
    await apiOrLocal(
      () => apiService!.commentKanbanTask(task.id, comment.trim()),
      () => {},
    );
    patch({ comments: [...task.comments, newComment] });
    setComment("");
    toast.success("Comment added");
  };

  const moveStatus = async (status: KanbanStatus) => {
    await apiOrLocal(
      () => apiService!.updateKanbanTask(task.id, { status }),
      () => {},
    );
    patch({ status });
    toast.success(`Moved to ${COLUMN_LABEL[status]}`);
  };

  const doBlock = async () => {
    if (!blockReason.trim()) return;
    await apiOrLocal(
      () => apiService!.blockKanbanTask(task.id, blockReason.trim()),
      () => {},
    );
    patch({ status: "blocked", blockReason: blockReason.trim() });
    setShowBlockForm(false);
    setBlockReason("");
    toast.success("Task blocked");
  };

  const doUnblock = async () => {
    await apiOrLocal(
      () => apiService!.unblockKanbanTask(task.id),
      () => {},
    );
    patch({ status: "ready", blockReason: undefined });
    toast.success("Task unblocked");
  };

  const doComplete = async () => {
    if (!result.trim()) return;
    await apiOrLocal(
      () => apiService!.completeKanbanTask(task.id, result.trim()),
      () => {},
    );
    patch({ status: "done", result: result.trim(), completedAt: Date.now() });
    setShowCompleteForm(false);
    setResult("");
    toast.success("Task completed!");
  };

  const doArchive = async () => {
    await apiOrLocal(
      () => apiService!.archiveKanbanTask(task.id),
      () => {},
    );
    patch({ status: "archived" });
    onClose();
    toast.success("Task archived");
  };

  const nextStatus = NEXT_STATUS[task.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className="w-full lg:w-[380px] shrink-0 flex flex-col bg-card border border-border rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted ${COLUMN_COLOR[task.status]}`}
            >
              {COLUMN_LABEL[task.status]}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_COLOR[task.priority]}`}
            >
              {PRIORITY_LABEL[task.priority]}
            </span>
          </div>
          <p className="font-bold text-sm text-foreground mt-1.5 leading-snug">{task.title}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {task.id} · {timeAgo(task.createdAt)}
          </p>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors shrink-0">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Meta */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {task.assignee && (
            <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground">
              <User className="w-3 h-3" />
              <span className="font-medium text-foreground">{task.assignee}</span>
            </div>
          )}
          {task.tenant && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Tag className="w-3 h-3" />
              {task.tenant}
            </div>
          )}
        </div>

        {/* Body */}
        {task.body && (
          <div className="text-xs text-muted-foreground bg-muted/30 rounded-xl p-3 leading-relaxed">
            {task.body}
          </div>
        )}

        {/* Block reason */}
        {task.blockReason && (
          <div className="text-xs bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-yellow-400">
            <span className="font-semibold">Blocked: </span>
            {task.blockReason}
          </div>
        )}

        {/* Result */}
        {task.result && (
          <div className="text-xs bg-status-success/10 border border-status-success/20 rounded-xl p-3 text-status-success">
            <span className="font-semibold">Result: </span>
            {task.result}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-1.5">
          {nextStatus && task.status !== "blocked" && (
            <button
              onClick={() => moveStatus(nextStatus)}
              disabled={loading}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-semibold transition-colors disabled:opacity-50"
            >
              <Play className="w-3 h-3" />
              Move to {COLUMN_LABEL[nextStatus]}
            </button>
          )}
          {task.status !== "blocked" && task.status !== "done" && task.status !== "archived" && (
            <button
              onClick={() => setShowBlockForm(!showBlockForm)}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 font-semibold transition-colors"
            >
              <Lock className="w-3 h-3" />
              Block
            </button>
          )}
          {task.status === "blocked" && (
            <button
              onClick={doUnblock}
              disabled={loading}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 font-semibold transition-colors"
            >
              <Unlock className="w-3 h-3" />
              Unblock
            </button>
          )}
          {task.status !== "done" && task.status !== "archived" && (
            <button
              onClick={() => setShowCompleteForm(!showCompleteForm)}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-status-success/10 text-status-success hover:bg-status-success/20 font-semibold transition-colors"
            >
              <Check className="w-3 h-3" />
              Complete
            </button>
          )}
          {task.status === "done" && (
            <button
              onClick={doArchive}
              disabled={loading}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground font-semibold transition-colors"
            >
              <Archive className="w-3 h-3" />
              Archive
            </button>
          )}
        </div>

        {/* Block form */}
        {showBlockForm && (
          <div className="space-y-2">
            <input
              autoFocus
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Reason for blocking…"
              className="w-full text-xs px-3 py-2 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-yellow-500/50"
            />
            <button
              onClick={doBlock}
              className="text-xs px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 font-semibold hover:bg-yellow-500/30 transition-colors"
            >
              Confirm Block
            </button>
          </div>
        )}

        {/* Complete form */}
        {showCompleteForm && (
          <div className="space-y-2">
            <textarea
              autoFocus
              value={result}
              onChange={(e) => setResult(e.target.value)}
              placeholder="Result / output summary…"
              rows={3}
              className="w-full text-xs px-3 py-2 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-status-success/50 resize-none"
            />
            <button
              onClick={doComplete}
              className="text-xs px-3 py-1.5 rounded-lg bg-status-success/20 text-status-success font-semibold hover:bg-status-success/30 transition-colors"
            >
              Mark Complete
            </button>
          </div>
        )}

        {/* Run history */}
        {task.runs.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Run History
            </p>
            <div className="space-y-1">
              {task.runs.map((r) => (
                <div key={r.id} className="flex items-center gap-2 text-xs">
                  {r.status === "done" ? (
                    <CheckCircle2 className="w-3 h-3 text-status-success shrink-0" />
                  ) : r.status === "running" ? (
                    <Loader2 className="w-3 h-3 text-status-working animate-spin shrink-0" />
                  ) : r.status === "blocked" ? (
                    <Lock className="w-3 h-3 text-yellow-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                  )}
                  <span className="text-muted-foreground">{timeAgo(r.startedAt)}</span>
                  {r.result && <span className="truncate text-foreground">{r.result}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Comments {task.comments.length > 0 && `(${task.comments.length})`}
          </p>
          {task.comments.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No comments yet</p>
          )}
          <div className="space-y-2 mb-3">
            {task.comments.map((c) => (
              <div key={c.id} className="bg-muted/40 rounded-xl px-3 py-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-semibold text-foreground">{c.author}</span>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-xs text-foreground">{c.body}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  addComment();
                }
              }}
              placeholder="Add a comment…"
              className="flex-1 text-xs px-3 py-2 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
            />
            <button
              onClick={addComment}
              disabled={!comment.trim()}
              className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Create Task Form ─────────────────────────────────────────────────────────
function CreateTaskForm({
  onSave,
  onClose,
}: {
  onSave: (t: KanbanTask) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState<KanbanPriority>(3);
  const [tenant, setTenant] = useState("");
  const [triage, setTriage] = useState(false);

  const save = () => {
    if (!title.trim()) return;
    onSave(
      createTask({
        title: title.trim(),
        body: body || undefined,
        assignee: assignee || undefined,
        priority,
        tenant: tenant || undefined,
        triage,
      }),
    );
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-card border border-border rounded-2xl p-4 space-y-3 mb-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-foreground">New Task</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
        }}
        placeholder="Task title…"
        className="w-full text-sm px-3 py-2 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Description (optional)…"
        rows={2}
        className="w-full text-xs px-3 py-2 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          placeholder="Assignee (e.g. researcher)"
          className="text-xs px-3 py-2 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
        />
        <input
          value={tenant}
          onChange={(e) => setTenant(e.target.value)}
          placeholder="Tenant / project (optional)"
          className="text-xs px-3 py-2 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
        />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Priority:</span>
        {([1, 2, 3, 4] as KanbanPriority[]).map((p) => (
          <button
            key={p}
            onClick={() => setPriority(p)}
            className={`text-[10px] px-2 py-1 rounded-full font-bold transition-colors ${priority === p ? PRIORITY_COLOR[p] : "bg-muted text-muted-foreground"}`}
          >
            {PRIORITY_LABEL[p]}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={triage}
            onChange={(e) => setTriage(e.target.checked)}
            className="rounded"
          />
          Triage first
        </label>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onClose}
          className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={!title.trim()}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Create
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function KanbanPage() {
  const { apiService, wsState } = useHermesService();
  const isApiConnected = wsState?.status === "connected" && !!apiService;

  const [tasks, setTasks] = useState<KanbanTask[]>(loadTasks);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<"local" | "api">("local");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const selectedTask = tasks.find((t) => t.id === selectedId) ?? null;

  // Persist to localStorage
  useEffect(() => {
    if (source === "local") saveTasks(tasks);
  }, [tasks, source]);

  const fetchFromApi = useCallback(async () => {
    if (!apiService) return;
    setLoading(true);
    try {
      const data = await apiService.fetchKanbanTasks();
      const converted = data.map(fromApiTask);
      setTasks(converted);
      setSource("api");
      toast.success(`Loaded ${converted.length} tasks from Hermes`);
    } catch {
      toast.error("Cannot reach Hermes Kanban API — using local mode");
      setSource("local");
    } finally {
      setLoading(false);
    }
  }, [apiService]);

  useEffect(() => {
    if (isApiConnected) fetchFromApi();
  }, [isApiConnected, fetchFromApi]);

  const updateTask = useCallback((updated: KanbanTask) => {
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === updated.id ? updated : t));
      saveTasks(next);
      return next;
    });
  }, []);

  const addTask = (t: KanbanTask) => {
    setTasks((prev) => {
      const next = [t, ...prev];
      saveTasks(next);
      return next;
    });
    setSelectedId(t.id);
    toast.success("Task created");
  };

  const deleteTask = (id: string) => {
    if (!confirm("Delete this task?")) return;
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveTasks(next);
      return next;
    });
    if (selectedId === id) setSelectedId(null);
    toast.success("Task deleted");
  };

  const visibleColumns = showArchived
    ? [...VISIBLE_COLUMNS, "archived" as KanbanStatus]
    : VISIBLE_COLUMNS;

  const filteredTasks = filterAssignee.trim()
    ? tasks.filter((t) => t.assignee?.toLowerCase().includes(filterAssignee.toLowerCase()))
    : tasks;

  const stats = {
    total: tasks.filter((t) => t.status !== "archived").length,
    running: tasks.filter((t) => t.status === "running").length,
    blocked: tasks.filter((t) => t.status === "blocked").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-card/50 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <LayoutDashboard className="w-5 h-5 text-primary shrink-0" />
            <div>
              <h1 className="font-black text-foreground text-sm leading-tight">Kanban Board</h1>
              <p className="text-[10px] text-muted-foreground">Multi-agent task orchestration</p>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">{stats.total} tasks</span>
            {stats.running > 0 && (
              <span className="flex items-center gap-1 text-status-working">
                <Loader2 className="w-3 h-3 animate-spin" />
                {stats.running} running
              </span>
            )}
            {stats.blocked > 0 && (
              <span className="flex items-center gap-1 text-yellow-400">
                <AlertCircle className="w-3 h-3" />
                {stats.blocked} blocked
              </span>
            )}
            <span className="flex items-center gap-1 text-status-success">
              <CheckCircle2 className="w-3 h-3" />
              {stats.done} done
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-semibold ${isApiConnected ? "bg-status-success/10 text-status-success" : "bg-muted text-muted-foreground"}`}
            >
              {isApiConnected ? (
                <Cloud className="w-2.5 h-2.5" />
              ) : (
                <HardDrive className="w-2.5 h-2.5" />
              )}
              {isApiConnected ? "Hermes API" : "Local"}
            </div>
            {isApiConnected && (
              <button
                onClick={fetchFromApi}
                disabled={loading}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`}
                />
              </button>
            )}
            <input
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              placeholder="Filter assignee…"
              className="text-xs px-2.5 py-1.5 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 w-32"
            />
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Task
            </button>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div
            className="flex gap-3 p-4 h-full"
            style={{ minWidth: `${visibleColumns.length * 220}px` }}
          >
            {visibleColumns.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col);
              return (
                <div key={col} className="flex flex-col w-52 shrink-0">
                  {/* Column header */}
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className={`text-xs font-bold ${COLUMN_COLOR[col]}`}>
                      {COLUMN_LABEL[col]}
                    </span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                      {colTasks.length}
                    </span>
                    {col === "blocked" && colTasks.length > 0 && (
                      <AlertCircle className="w-3 h-3 text-yellow-400 ml-auto" />
                    )}
                  </div>

                  {/* Create form only in first column */}
                  {col === "triage" && showCreate && (
                    <AnimatePresence>
                      <CreateTaskForm onSave={addTask} onClose={() => setShowCreate(false)} />
                    </AnimatePresence>
                  )}

                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                    <AnimatePresence>
                      {colTasks.map((t) => (
                        <div key={t.id} className="relative group/card">
                          <TaskCard
                            task={t}
                            onClick={() => setSelectedId(t.id === selectedId ? null : t.id)}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTask(t.id);
                            }}
                            className="absolute top-1.5 right-1.5 opacity-0 group-hover/card:opacity-100 p-0.5 rounded hover:bg-destructive/20 transition-all"
                          >
                            <Trash2 className="w-2.5 h-2.5 text-destructive" />
                          </button>
                        </div>
                      ))}
                    </AnimatePresence>
                    {colTasks.length === 0 && (
                      <div className="text-[10px] text-muted-foreground/50 text-center py-6 border border-dashed border-border/50 rounded-xl">
                        empty
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Toggle archived column */}
            <div className="flex flex-col justify-start pt-7 w-8 shrink-0">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="flex flex-col items-center gap-1 text-[9px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                title={showArchived ? "Hide archived" : "Show archived"}
              >
                <Archive className="w-3.5 h-3.5" />
                <ChevronRight
                  className={`w-3 h-3 transition-transform ${showArchived ? "rotate-180" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selectedTask && (
            <div className="shrink-0 w-full lg:w-[380px] border-l border-border overflow-hidden">
              <TaskDetail
                task={selectedTask}
                onClose={() => setSelectedId(null)}
                onUpdate={updateTask}
                apiService={isApiConnected ? apiService : null}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom hint */}
      <div className="px-4 py-2 border-t border-border bg-card/30 shrink-0 flex items-center gap-3 text-[10px] text-muted-foreground">
        <Flag className="w-3 h-3" />
        <span>
          CLI: <code className="font-mono">hermes kanban list</code> ·{" "}
          <code className="font-mono">hermes kanban create "title" --assignee researcher</code>
        </span>
        {!isApiConnected && (
          <span className="ml-auto">
            Connect via{" "}
            <a href="/gateway" className="text-primary hover:underline">
              Gateway
            </a>{" "}
            to sync with Hermes
          </span>
        )}
      </div>
    </div>
  );
}
