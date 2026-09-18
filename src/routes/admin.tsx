import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/site/AdminPage";

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: AdminPage,
});