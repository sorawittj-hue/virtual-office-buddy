import { createFileRoute } from "@tanstack/react-router";
import { ModelsPage } from "@/components/pages/ModelsPage";

export const Route = createFileRoute("/models")({
  component: ModelsPage,
});
