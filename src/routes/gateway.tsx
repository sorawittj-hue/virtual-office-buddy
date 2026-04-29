import { createFileRoute } from "@tanstack/react-router";
import { GatewayPage } from "@/components/pages/GatewayPage";
export const Route = createFileRoute("/gateway")({ component: GatewayPage });
