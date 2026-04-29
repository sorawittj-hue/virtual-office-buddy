import { createFileRoute } from "@tanstack/react-router";
import { PersonaPage } from "@/components/pages/PersonaPage";
export const Route = createFileRoute("/persona")({ component: PersonaPage });
