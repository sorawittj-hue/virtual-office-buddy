import { createFileRoute } from "@tanstack/react-router";
import { KanbanPage } from "@/components/pages/KanbanPage";

export const Route = createFileRoute("/kanban")({
  component: KanbanPage,
});
