import { createFileRoute } from "@tanstack/react-router";
import { Office } from "@/components/hermes/Office";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Prism · Office" },
      {
        name: "description",
        content:
          "3D isometric office scene — watch your Hermes Agent work in real time.",
      },
    ],
  }),
});

function Index() {
  return <Office />;
}
