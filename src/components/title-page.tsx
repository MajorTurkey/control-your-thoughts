import { useState, type CSSProperties } from "react";
import { authEnabled, signIn } from "@/lib/auth/client";
import { GROK_PROVIDERS } from "@/lib/auth/providers";

export function TitlePage({ onEnter }: { onEnter: () => void }) {
  const [note, setNote] = useState("");

  async function enterSigned(providerId: string) {
    if (!authEnabled) {
      onEnter();
      return;
    }
    setNote("");
    try {
      sessionStorage.setItem("imaging-bay-entered", "signed");
      await signIn(providerId, { callbackURL: "/" });
      onEnter();
    } catch (error) {
      sessionStorage.removeItem("imaging-bay-entered");
      setNote(error instanceof Error ? error.message : "Sign-in did not open. Try again, or continue as a guest.");
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="reticle mb-6" aria-hidden="true" />
      <p className="bay-kicker text-xs uppercase">Survey vessel</p>
      <h1 className="bay-title font-display mt-4 text-6xl leading-none font-medium">Imaging Bay</h1>
      <p className="font-display mt-4 text-lg leading-snug text-pretty text-lilac">
        The plate sets the look. In the box, write only what is in the frame.
      </p>
      <div className="mt-10 grid gap-2">
        {GROK_PROVIDERS.map((provider) => (
          <button
            key={provider.providerId}
            type="button"
            className="bay-press min-h-12 px-4 text-xs uppercase"
            onClick={() => void enterSigned(provider.providerId)}
          >
            Sign in with {provider.label}
          </button>
        ))}
        <button
          type="button"
          className="bay-box min-h-12 px-4 text-xs uppercase"
          style={{ "--tint": "#3dff9a" } as CSSProperties}
          onClick={() => {
            sessionStorage.setItem("imaging-bay-entered", "guest");
            onEnter();
          }}
        >
          Continue as guest
        </button>
      </div>
      {note ? <p className="mt-4 text-sm text-danger">{note}</p> : null}
      <p className="mt-10 text-xs tracking-wide text-mute">
        Created by{" "}
        <a href="https://majorturkey.org" className="text-blush underline decoration-line underline-offset-4">
          MajorTurkey
        </a>
      </p>
    </main>
  );
}
