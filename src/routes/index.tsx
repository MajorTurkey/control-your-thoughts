import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ImagingBay } from "@/components/imaging-bay";
import { TitlePage } from "@/components/title-page";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("imaging-bay-entered")) setOpen(true);
  }, []);

  if (!open) return <TitlePage onEnter={() => setOpen(true)} />;
  return <ImagingBay />;
}
