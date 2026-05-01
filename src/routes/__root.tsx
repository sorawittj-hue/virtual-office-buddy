import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import "@/lib/polyfills";
import { HermesServiceProvider } from "@/lib/hermes-context";
import { AppLayout } from "@/components/layout/AppLayout";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Prism — Dashboard for Hermes Agent" },
      { name: "description", content: "Prism — The open-source dashboard for Hermes Agent. 17 LLM providers, 25 platform integrations, built-in Guardrails." },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <HermesServiceProvider>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </HermesServiceProvider>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">Page not found</p>
      </div>
    </div>
  );
}
