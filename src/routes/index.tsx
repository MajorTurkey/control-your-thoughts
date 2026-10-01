import { createFileRoute } from "@tanstack/react-router";
import { ImagingBay } from "@/components/imaging-bay";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <ImagingBay />;
}
