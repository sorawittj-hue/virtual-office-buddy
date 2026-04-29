import { createFileRoute } from "@tanstack/react-router";
import { SessionsPage } from "@/components/pages/SessionsPage";
export const Route = createFileRoute("/sessions")({ component: SessionsPage });
