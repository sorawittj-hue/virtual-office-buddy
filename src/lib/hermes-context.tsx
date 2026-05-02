import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { hermesService } from "./hermes-service";
import { WebSocketHermesService } from "./ws-hermes-service";
import { HermesApiService } from "./hermes-api-service";
import { ProxyChatService } from "./proxy-chat-service";
import { HermesPtyService } from "./hermes-pty-service";
import { loadConnectionMode, saveConnectionMode, type ConnectionMode } from "./connection-mode";
import type { HermesService } from "./ws-hermes-service";
import type { WsConnectionState } from "./ws-hermes-service";

interface HermesServiceContextValue {
  service: HermesService;
  wsState: WsConnectionState | null;
  apiService: HermesApiService | null;
  connectionMode: ConnectionMode;
  setConnectionMode: (mode: ConnectionMode) => void;
  connectApi: (url: string, apiKey?: string) => void;
  connectWs: (url: string, token?: string) => void;
  disconnect: () => void;
}

const HermesServiceContext = createContext<HermesServiceContextValue>({
  service: hermesService,
  wsState: null,
  apiService: null,
  connectionMode: "standalone",
  setConnectionMode: () => {},
  connectApi: () => {},
  connectWs: () => {},
  disconnect: () => {},
});

export function HermesServiceProvider({ children }: { children: React.ReactNode }) {
  const [service, setService] = useState<HermesService>(hermesService);
  const [wsState, setWsState] = useState<WsConnectionState | null>(null);
  const [apiService, setApiService] = useState<HermesApiService | null>(null);
  const [connectionMode, setConnectionModeState] = useState<ConnectionMode>(loadConnectionMode);
  const activeRef = useRef<
    WebSocketHermesService | HermesApiService | ProxyChatService | HermesPtyService | null
  >(null);

  useEffect(() => {
    if (connectionMode === "hermes") {
      startHermesPty();
    } else {
      startStandalone();
    }
    return () => activeRef.current?.disconnect();
  }, [connectionMode]);

  function startStandalone() {
    activeRef.current?.disconnect();
    const svc = new ProxyChatService();
    svc.subscribeState(setWsState);
    svc.connect();
    activeRef.current = svc;
    setService(svc);
    setApiService(null);
  }

  function startHermesPty() {
    activeRef.current?.disconnect();
    const svc = new HermesPtyService();
    svc.subscribeState(setWsState);
    svc.connect();
    activeRef.current = svc;
    setService(svc);
    setApiService(null);
  }

  function startApi(url: string, apiKey?: string) {
    activeRef.current?.disconnect();
    const svc = new HermesApiService(url, apiKey);
    svc.subscribeState(setWsState);
    svc.connect();
    activeRef.current = svc;
    setService(svc);
    setApiService(svc);
  }

  function startWs(url: string, token?: string) {
    activeRef.current?.disconnect();
    const svc = new WebSocketHermesService(url, token);
    svc.subscribeState(setWsState);
    svc.connect();
    activeRef.current = svc;
    setService(svc);
    setApiService(null);
  }

  const connectApi = useCallback((url: string, apiKey?: string) => {
    startApi(url, apiKey);
    localStorage.setItem("hermes-mode", "api");
    localStorage.setItem("hermes-api-url", url);
    if (apiKey) localStorage.setItem("hermes-api-key", apiKey);
    else localStorage.removeItem("hermes-api-key");
    localStorage.removeItem("hermes-ws-url");
    localStorage.removeItem("hermes-ws-token");
  }, []);

  const connectWs = useCallback((url: string, token?: string) => {
    startWs(url, token);
    localStorage.setItem("hermes-mode", "ws");
    localStorage.setItem("hermes-ws-url", url);
    if (token) localStorage.setItem("hermes-ws-token", token);
    else localStorage.removeItem("hermes-ws-token");
    localStorage.removeItem("hermes-api-url");
    localStorage.removeItem("hermes-api-key");
  }, []);

  const disconnect = useCallback(() => {
    activeRef.current?.disconnect();
    activeRef.current = null;
    setWsState(null);
    setApiService(null);
    setService(hermesService);
    localStorage.removeItem("hermes-mode");
    localStorage.removeItem("hermes-api-url");
    localStorage.removeItem("hermes-api-key");
    localStorage.removeItem("hermes-ws-url");
    localStorage.removeItem("hermes-ws-token");
  }, []);

  const setConnectionMode = useCallback((mode: ConnectionMode) => {
    saveConnectionMode(mode);
    setConnectionModeState(mode);
  }, []);

  return (
    <HermesServiceContext.Provider
      value={{
        service,
        wsState,
        apiService,
        connectionMode,
        setConnectionMode,
        connectApi,
        connectWs,
        disconnect,
      }}
    >
      {children}
    </HermesServiceContext.Provider>
  );
}

export function useHermesService() {
  return useContext(HermesServiceContext);
}
