import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { hermesService } from "./hermes-service";
import { WebSocketHermesService } from "./ws-hermes-service";
import type { HermesService } from "./ws-hermes-service";
import type { WsConnectionState } from "./ws-hermes-service";

interface HermesServiceContextValue {
  service: HermesService;
  wsState: WsConnectionState | null;
  connectWs: (url: string, token?: string) => void;
  disconnectWs: () => void;
}

const HermesServiceContext = createContext<HermesServiceContextValue>({
  service: hermesService,
  wsState: null,
  connectWs: () => {},
  disconnectWs: () => {},
});

export function HermesServiceProvider({ children }: { children: React.ReactNode }) {
  const [service, setService] = useState<HermesService>(hermesService);
  const [wsState, setWsState] = useState<WsConnectionState | null>(null);
  const wsRef = useRef<WebSocketHermesService | null>(null);

  // Auto-reconnect on mount if saved URL exists
  useEffect(() => {
    const savedUrl = localStorage.getItem("hermes-ws-url");
    const savedToken = localStorage.getItem("hermes-ws-token") ?? undefined;
    if (savedUrl) {
      const ws = new WebSocketHermesService(savedUrl, savedToken);
      ws.subscribeState(setWsState);
      ws.connect();
      wsRef.current = ws;
      setService(ws);
    }
  }, []);

  const connectWs = useCallback((url: string, token?: string) => {
    wsRef.current?.disconnect();
    const ws = new WebSocketHermesService(url, token);
    ws.subscribeState(setWsState);
    ws.connect();
    wsRef.current = ws;
    setService(ws);
    localStorage.setItem("hermes-ws-url", url);
    if (token) {
      localStorage.setItem("hermes-ws-token", token);
    } else {
      localStorage.removeItem("hermes-ws-token");
    }
  }, []);

  const disconnectWs = useCallback(() => {
    wsRef.current?.disconnect();
    wsRef.current = null;
    setWsState(null);
    setService(hermesService);
    localStorage.removeItem("hermes-ws-url");
    localStorage.removeItem("hermes-ws-token");
  }, []);

  return (
    <HermesServiceContext.Provider value={{ service, wsState, connectWs, disconnectWs }}>
      {children}
    </HermesServiceContext.Provider>
  );
}

export function useHermesService() {
  return useContext(HermesServiceContext);
}
