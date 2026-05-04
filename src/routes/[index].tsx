import { createFileRoute } from "@tanstack/react-router";
import { Office } from "@/components/hermes/Office";

export const Route = createFileRoute("/index")({
  component: IndexAlias,
  head: () => ({
    meta: [
      { title: "Virtual Office Buddy | Office" },
      {
        name: "description",
        content: "3D isometric office scene — watch your Hermes Agent work in real time.",
      },
    ],
  }),
});

function IndexAlias() {
  return <Office />;
}