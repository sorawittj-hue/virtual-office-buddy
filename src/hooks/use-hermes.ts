import { useEffect, useState } from "react";
import { hermesService } from "@/lib/hermes-service";
import type { HermesState, TaskLogEntry } from "@/lib/hermes-types";

const initialState: HermesState = {
  status: "idle",
  bossMessage: null,
  hermesMessage: "Ready for the next task ☕",
  connection: "online",
  channel: "Telegram",
  log: [],
  activeTask: null,
};

function patchStep(task: TaskLogEntry, step: TaskLogEntry["steps"][number]): TaskLogEntry {
  return {
    ...task,
    steps: task.steps.map((s) => (s.id === step.id ? { ...s, ...step } : s)),
  };
}

export function useHermes() {
  const [state, setState] = useState<HermesState>(initialState);

  useEffect(() => {
    const unsub = hermesService.subscribe((event) => {
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
            };
            return {
              ...prev,
              activeTask: completed,
              log: [completed, ...prev.log].slice(0, 8),
            };
          }
          case "log":
            // Legacy path — kept for compatibility with non-streaming sources.
            return { ...prev, log: [event.entry, ...prev.log].slice(0, 8) };
          default:
            return prev;
        }
      });
    });
    return () => {
      unsub();
    };
  }, []);

  return {
    ...state,
    simulate: (command: string) => hermesService.simulateTelegramWebhook(command),
  };
}
