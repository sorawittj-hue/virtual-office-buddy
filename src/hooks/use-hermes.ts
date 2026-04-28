import { useEffect, useState } from "react";
import { hermesService } from "@/lib/hermes-service";
import type { HermesState } from "@/lib/hermes-types";

const initialState: HermesState = {
  status: "idle",
  bossMessage: null,
  hermesMessage: "Ready for the next task ☕",
  connection: "online",
  channel: "Telegram",
  log: [],
};

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
          case "log":
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
