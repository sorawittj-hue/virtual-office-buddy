import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { hermesService } from "./hermes-service";
import { WebSocketHermesService } from "./ws-hermes-service";
import { HermesApiService } from "./hermes-api-service";
import type { HermesService } from "./ws-hermes-service";
import type { WsConnectionState } from "./ws-hermes-service";

interface HermesServiceContextValue {
  service: HermesService;
  wsState: WsConnectionState | null;
  apiService: HermesApiService | null;
  connectApi: (url: string, apiKey?: string) => void;
  connectWs: (url: string, token?: string) => void;
  disconnect: () => void;
}

const HermesServiceContext = createContext<HermesServiceContextValue>({
  service: hermesService,
  wsState: null,
  apiService: null,
  connectApi: () => {},
  connectWs: () => {},
  disconnect: () => {},
});

export function HermesServiceProvider({ children }: { children: React.ReactNode }) {
  const [service, setService] = useState<HermesService>(hermesService);
  const [wsState, setWsState] = useState<WsConnectionState | null>(null);
  const [apiService, setApiService] = useState<HermesApiService | null>(null);
  const activeRef = useRef<WebSocketHermesService | HermesApiService | null>(null);

  // Auto-reconnect on mount; first-launch falls back to VITE_ env vars
  useEffect(() => {
    const savedMode = localStorage.getItem("hermes-mode");
    if (savedMode === "api") {
      const url = localStorage.getItem("hermes-api-url");
      const key = localStorage.getItem("hermes-api-key") ?? undefined;
      if (url) startApi(url, key);
    } else if (savedMode === "ws") {
      const url = localStorage.getItem("hermes-ws-url");
      const token = localStorage.getItem("hermes-ws-token") ?? undefined;
      if (url) startWs(url, token);
    } else {
      const defaultUrl = import.meta.env.VITE_DEFAULT_API_URL as string | undefined;
      const defaultKey = import.meta.env.VITE_DEFAULT_API_KEY as string | undefined;
      if (defaultUrl) {
        startApi(defaultUrl, defaultKey || undefined);
        localStorage.setItem("hermes-mode", "api");
        localStorage.setItem("hermes-api-url", defaultUrl);
        if (defaultKey) localStorage.setItem("hermes-api-key", defaultKey);
      }
    }
  }, []);

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

  return (
    <HermesServiceContext.Provider
      value={{ service, wsState, apiService, connectApi, connectWs, disconnect }}
    >
      {children}
    </HermesServiceContext.Provider>
  );
}

export function useHermesService() {
  return useContext(HermesServiceContext);
}
