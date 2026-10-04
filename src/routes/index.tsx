import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ImagingBay } from "@/components/imaging-bay";
import { TitlePage } from "@/components/title-page";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { user, isPending } = useCurrentUserState();
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("imaging-bay-entered")) setEntered(true);
  }, []);

  if (user || entered) return <ImagingBay />;
  if (isPending) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-16">
        <p className="bay-kicker text-xs uppercase">Survey vessel</p>
        <h1 className="bay-title font-display mt-4 text-6xl leading-none font-medium">Imaging Bay</h1>
      </main>
    );
  }
  return <TitlePage onEnter={() => setEntered(true)} />;
}
