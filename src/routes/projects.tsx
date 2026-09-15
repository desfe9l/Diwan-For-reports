import { createFileRoute } from "@tanstack/react-router";
import { ProjectsPage } from "@/components/site/ProjectsPage";

export const Route = createFileRoute("/projects")({
  ssr: false,
  component: ProjectsPage,
});
