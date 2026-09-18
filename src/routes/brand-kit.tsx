import { createFileRoute } from "@tanstack/react-router";
import { BrandKitPage } from "@/components/site/BrandKitPage";

export const Route = createFileRoute("/brand-kit")({
  ssr: false,
  component: BrandKitPage,
});
