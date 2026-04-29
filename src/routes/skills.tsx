import { createFileRoute } from "@tanstack/react-router";
import { SkillsPage } from "@/components/pages/SkillsPage";
export const Route = createFileRoute("/skills")({ component: SkillsPage });
