import { createFileRoute } from "@tanstack/react-router";
import { SchedulesPage } from "@/components/pages/SchedulesPage";

export const Route = createFileRoute("/schedules")({
  component: SchedulesPage,
});
