export function TitlePage({ onEnter }: { onEnter: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="reticle mb-6" aria-hidden="true" />
      <p className="bay-kicker text-xs uppercase">Survey vessel</p>
      <h1 className="bay-title font-display mt-4 text-6xl leading-none font-medium">Imaging Bay</h1>
      <p className="font-display mt-4 text-lg leading-snug text-pretty text-paper">
        The plate sets the look. In the box, write only what is in the frame.
      </p>
      <div className="mt-10 grid gap-2">
        <button
          type="button"
          className="bay-press min-h-12 px-4 text-xs uppercase"
          onClick={() => {
            sessionStorage.setItem("imaging-bay-entered", "guest");
            onEnter();
          }}
        >
          Enter
        </button>
        <a
          href="/imaging-bay-7.apk"
          download="imaging-bay-7.apk"
          className="inline-flex min-h-12 items-center text-base text-phosphor underline decoration-phosphor underline-offset-4"
        >
          imaging-bay-7.apk
        </a>
      </div>
      <p className="mt-10 text-xs tracking-wide text-mute">
        Created by{" "}
        <a href="https://majorturkey.org" className="text-phosphor underline decoration-line underline-offset-4">
          MajorTurkey
        </a>
      </p>
    </main>
  );
}
