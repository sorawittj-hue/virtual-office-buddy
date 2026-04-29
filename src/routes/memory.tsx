import { createFileRoute } from "@tanstack/react-router";
import { MemoryPage } from "@/components/pages/MemoryPage";
export const Route = createFileRoute("/memory")({ component: MemoryPage });
