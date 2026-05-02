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
  Triangle,
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
      className="hidden lg:flex w-[224px] shrink-0 flex-col h-screen overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
      style={{
        background:
          "linear-gradient(180deg, color-mix(in oklab, var(--sidebar) 94%, black), var(--sidebar))",
      }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border/70">
        <div className="flex items-center gap-2.5">
          <div className="brand-mark relative flex h-9 w-9 items-center justify-center rounded-xl text-sidebar-primary-foreground">
            <Triangle className="h-[18px] w-[18px] fill-current" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
          </div>
          <div>
            <div className="brand-wordmark text-[15px] leading-tight text-white">Prism</div>
            <div className="text-[10px] font-medium leading-tight text-white/45">
              Hermes Office OS
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-150 ${
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_12px_28px_-18px_var(--primary)]"
                  : "text-white/54 hover:bg-sidebar-accent hover:text-white"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  active
                    ? "text-sidebar-primary-foreground"
                    : "text-white/38 group-hover:text-white/75"
                }`}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Connection status footer */}
      <div className="border-t border-sidebar-border/70 px-4 py-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-[11px]">
          {isConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-green-400 shrink-0" />
              <span className="text-green-400 font-medium truncate">
                {wsState?.url
                  ?.replace("ws://", "")
                  .replace("wss://", "")
                  .replace("http://", "")
                  .replace("https://", "")}
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
              <span className="font-medium text-white/34">Mock Mode</span>
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
        body: isError ? event.error : event.result.slice(0, 100) || "Done",
        icon: "/favicon.svg",
      });
    });
  }, [service]);
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  useBrowserNotifications();
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-auto pb-16 lg:pb-0">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/92 shadow-[0_-18px_50px_-30px_oklch(0.2_0.08_245_/_0.45)] backdrop-blur-xl lg:hidden">
        <div className="flex overflow-x-auto scrollbar-none px-1 py-2 gap-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              activeProps={{ className: "text-primary bg-primary/12" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex min-w-[56px] shrink-0 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition-colors"
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
