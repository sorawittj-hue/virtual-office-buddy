import { createFileRoute } from "@tanstack/react-router";
import { Office } from "@/components/hermes/Office";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Hermes · Virtual Office" },
      {
        name: "description",
        content:
          "A cozy virtual office where Hermes, your AI employee, takes commands from the Boss via Telegram.",
      },
    ],
  }),
});

function Index() {
  return <Office />;
}
