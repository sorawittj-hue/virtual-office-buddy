import { createContext, useContext, useState, useCallback, useRef } from "react";
import { hermesService } from "./hermes-service";
import { WebSocketHermesService } from "./ws-hermes-service";
import type { HermesService } from "./ws-hermes-service";
import type { WsConnectionState } from "./ws-hermes-service";

interface HermesServiceContextValue {
  service: HermesService;
  wsState: WsConnectionState | null;
  connectWs: (url: string) => void;
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

  const connectWs = useCallback((url: string) => {
    wsRef.current?.disconnect();
    const ws = new WebSocketHermesService(url);
    ws.subscribeState(setWsState);
    ws.connect();
    wsRef.current = ws;
    setService(ws);
    localStorage.setItem("hermes-ws-url", url);
  }, []);

  const disconnectWs = useCallback(() => {
    wsRef.current?.disconnect();
    wsRef.current = null;
    setWsState(null);
    setService(hermesService);
    localStorage.removeItem("hermes-ws-url");
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
