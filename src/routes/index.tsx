import { createFileRoute } from "@tanstack/react-router";
import { EditorApp } from "@/components/editor/EditorApp";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Home,
});

function Home() {
  return <EditorApp />;
}
