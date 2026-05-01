import { createFileRoute } from "@tanstack/react-router";
import { PlatformsPage } from "@/components/pages/PlatformsPage";

export const Route = createFileRoute("/platforms")({
  component: PlatformsPage,
});
