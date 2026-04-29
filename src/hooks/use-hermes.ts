import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useHermesService } from "@/lib/hermes-context";
import type { HermesState, TaskLogEntry } from "@/lib/hermes-types";

const initialState: HermesState = {
  status: "idle",
  bossMessage: null,
  hermesMessage: "พร้อมรับงานต่อไปแล้วครับ ☕",
  connection: "online",
  channel: "Telegram",
  log: [],
  activeTask: null,
  totalCompleted: 0,
};

function patchStep(task: TaskLogEntry, step: TaskLogEntry["steps"][number]): TaskLogEntry {
  return {
    ...task,
    steps: task.steps.map((s) => (s.id === step.id ? { ...s, ...step } : s)),
  };
}

export function useHermes() {
  const { service } = useHermesService();
  const [state, setState] = useState<HermesState>(initialState);

  useEffect(() => {
    setState(initialState);
    const unsub = service.subscribe((event) => {
      setState((prev) => {
        switch (event.type) {
          case "command":
            return { ...prev, bossMessage: event.command };
          case "status":
            return {
              ...prev,
              status: event.status,
              hermesMessage: event.message ?? prev.hermesMessage,
            };
          case "task-start":
            return { ...prev, activeTask: event.task };
          case "task-step": {
            if (!prev.activeTask || prev.activeTask.id !== event.taskId) return prev;
            return { ...prev, activeTask: patchStep(prev.activeTask, event.step) };
          }
          case "task-complete": {
            if (!prev.activeTask || prev.activeTask.id !== event.taskId) return prev;
            const completed: TaskLogEntry = {
              ...prev.activeTask,
              status: "success",
              result: event.result,
              timestamp: Date.now(),
              completedAt: Date.now(),
            };
            toast.success(`เสร็จแล้ว: ${completed.command}`, {
              description: event.result,
              duration: 4000,
            });
            return {
              ...prev,
              activeTask: completed,
              log: [completed, ...prev.log].slice(0, 20),
              totalCompleted: prev.totalCompleted + 1,
            };
          }
          case "task-error": {
            if (!prev.activeTask || prev.activeTask.id !== event.taskId) return prev;
            const failed: TaskLogEntry = {
              ...prev.activeTask,
              status: "error",
              result: event.error,
              timestamp: Date.now(),
              completedAt: Date.now(),
            };
            toast.error(`เกิดข้อผิดพลาด: ${failed.command}`, {
              description: event.error,
              duration: 5000,
            });
            return {
              ...prev,
              activeTask: failed,
              log: [failed, ...prev.log].slice(0, 20),
            };
          }
          case "log":
            return { ...prev, log: [event.entry, ...prev.log].slice(0, 20) };
          default:
            return prev;
        }
      });
    });
    return () => unsub();
  }, [service]);

  return {
    ...state,
    simulate: (command: string) => service.simulateTelegramWebhook(command),
    simulateError: (command: string) => service.simulateError(command),
  };
}
