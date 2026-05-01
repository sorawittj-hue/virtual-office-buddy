import { Link, useRouterState } from "@tanstack/react-router";
import {
  MessageSquare,
  Clock,
  Users,
  Building2,
  Sparkles,
  User,
  Brain,
  Wrench,
  Network,
  Settings,
  Wifi,
  WifiOff,
  Cpu,
  CalendarClock,
  Layers,
  LayoutDashboard,
} from "lucide-react";
import { useEffect } from "react";
import { useHermesService } from "@/lib/hermes-context";

const navItems = [
  { to: "/chat", icon: MessageSquare, label: "Chat" },
  { to: "/sessions", icon: Clock, label: "Sessions" },
  { to: "/agents", icon: Users, label: "Agents" },
  { to: "/", icon: Building2, label: "Office" },
  { to: "/skills", icon: Sparkles, label: "Skills" },
  { to: "/persona", icon: User, label: "Soul" },
  { to: "/models", icon: Cpu, label: "Models" },
  { to: "/platforms", icon: Layers, label: "Platforms" },
  { to: "/kanban", icon: LayoutDashboard, label: "Kanban" },
  { to: "/schedules", icon: CalendarClock, label: "Schedules" },
  { to: "/memory", icon: Brain, label: "Memory" },
  { to: "/tools", icon: Wrench, label: "Tools" },
  { to: "/gateway", icon: Network, label: "Gateway" },
  { to: "/settings", icon: Settings, label: "Settings" },
] as const;

function Sidebar() {
  const { pathname } = useRouterState({ select: (s) => s.location });
  const { wsState } = useHermesService();

  const isConnected = wsState?.status === "connected";

  return (
    <aside
      className="hidden lg:flex w-[210px] shrink-0 flex-col h-screen overflow-hidden border-r border-white/5"
      style={{ background: "#0d0d18" }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm shadow"
            style={{ background: "linear-gradient(135deg, #5b8dee, #a855f7)" }}
          >
            P
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">Prism</div>
            <div className="text-white/40 text-[10px] leading-tight">for Hermes Agent</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group ${
                active
                  ? "bg-primary/20 text-primary"
                  : "text-white/50 hover:text-white/90 hover:bg-white/5"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  active ? "text-primary" : "text-white/40 group-hover:text-white/70"
                }`}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Connection status footer */}
      <div className="px-4 py-3 border-t border-white/5">
        <div className="flex items-center gap-2 text-[11px]">
          {isConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-green-400 shrink-0" />
              <span className="text-green-400 font-medium truncate">
                {wsState?.url?.replace("ws://", "").replace("wss://", "").replace("http://", "").replace("https://", "")}
              </span>
            </>
          ) : wsState?.status === "connecting" ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-yellow-400 animate-pulse shrink-0" />
              <span className="text-yellow-400">กำลังเชื่อมต่อ…</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-white/25 shrink-0" />
              <span className="text-white/25">Mock Mode</span>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

function useBrowserNotifications() {
  const { service } = useHermesService();
  useEffect(() => {
    return service.subscribe((event) => {
      if (event.type !== "task-complete" && event.type !== "task-error") return;
      if (localStorage.getItem("prism-browser-notifs") !== "1") return;
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      if (document.visibilityState === "visible") return;
      const isError = event.type === "task-error";
      new Notification(isError ? "Prism — Task Failed" : "Prism — Task Complete", {
        body: isError ? (event as any).error : (event as any).result?.slice(0, 100) ?? "Done",
        icon: "/favicon.ico",
      });
    });
  }, [service]);
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  useBrowserNotifications();
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-auto pb-16 lg:pb-0">
        {children}
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur lg:hidden">
        <div className="flex overflow-x-auto scrollbar-none px-1 py-2 gap-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              activeProps={{ className: "text-primary bg-primary/10" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex min-w-[56px] shrink-0 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold transition-colors"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
