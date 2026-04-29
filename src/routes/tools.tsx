import { createFileRoute } from "@tanstack/react-router";
import { ToolsPage } from "@/components/pages/ToolsPage";
export const Route = createFileRoute("/tools")({ component: ToolsPage });
