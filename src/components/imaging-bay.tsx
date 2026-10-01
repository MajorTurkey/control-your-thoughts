import { useEffect, useId, useState, type CSSProperties } from "react";
import {
  ASPECTS,
  LOG_LINES,
  STYLES,
  type AspectId,
  type StyleId,
} from "@/lib/imaging/catalog";
import { exposePlate, takePlate } from "@/lib/imaging/generate";
import { KEEP_COST, readCredits } from "@/lib/imaging/credits";
import { PackRow, PlateWindow } from "@/components/plate-window";

const PREF_KEY = "imaging-bay";

type Phase = "idle" | "exposing" | "ready" | "error";

function ratioClass(aspect: AspectId): string {
  if (aspect === "1:1") return "frame-ratio-1-1";
  if (aspect === "2:3") return "frame-ratio-2-3";
  if (aspect === "21:9") return "frame-ratio-21-9";
  return "frame-ratio-16-9";
}

export function ImagingBay() {
  const subjectId = useId();
  const [styleId, setStyleId] = useState<StyleId>("photograph");
  const [aspect, setAspect] = useState<AspectId>("16:9");
  const [prefsReady, setPrefsReady] = useState(false);
  const [subject, setSubject] = useState("");
  const [missing, setMissing] = useState("");
  const [different, setDifferent] = useState("");
  const [omit, setOmit] = useState("");
  const [note, setNote] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [plateLabel, setPlateLabel] = useState("");
  const [status, setStatus] = useState("");
  const [shown, setShown] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [credits, setCredits] = useState(0);
  const [creditsReady, setCreditsReady] = useState(false);
  const [windowOpen, setWindowOpen] = useState(false);
  const [keptUrl, setKeptUrl] = useState<string | null>(null);
  const [fileNote, setFileNote] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREF_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { styleId?: string; aspect?: string };
        if (STYLES.some((style) => style.id === saved.styleId)) {
          setStyleId(saved.styleId as StyleId);
        }
        if (ASPECTS.some((item) => item.id === saved.aspect)) {
          setAspect(saved.aspect as AspectId);
        }
      }
    } catch {
      /* keep defaults */
    }
    setPrefsReady(true);
    setCredits(readCredits());
    setCreditsReady(true);
  }, []);

  useEffect(() => {
    if (!prefsReady) return;
    localStorage.setItem(PREF_KEY, JSON.stringify({ styleId, aspect }));
  }, [prefsReady, styleId, aspect]);

  useEffect(() => {
    if (!creditsReady) return;
    localStorage.setItem("imaging-bay-credits", String(credits));
  }, [creditsReady, credits]);

  useEffect(() => {
    if (!windowOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setWindowOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [windowOpen]);

  async function expose() {
    const text = subject.trim();
    if (!text || phase === "exposing") return;
    setPhase("exposing");
    setShown(true);
    setStatus("Exposing the plate…");
    try {
      const result = await exposePlate({
        data: {
          subject: text,
          styleId,
          aspect,
          missing: missing.trim(),
          different: different.trim(),
          omit: omit.trim(),
          note: note.trim(),
        },
      });
      if (!result.ok) {
        setPhase("error");
        setStatus(result.error);
        setLogOpen(true);
        return;
      }
      setImageUrl(result.url);
      setPlateLabel(`${result.styleName} · ${result.aspectName}`);
      setPhase("ready");
      setStatus("");
      setFileNote("");
      setWindowOpen(true);
      setLogOpen(true);
    } catch (error) {
      setPhase("error");
      setStatus(error instanceof Error ? error.message : "The bay did not answer.");
    }
  }

  async function savePlate(kind: "download" | "copy") {
    if (!imageUrl || keptUrl !== imageUrl) return;
    setFileNote(kind === "copy" ? "Copying…" : "Filing…");
    try {
      let source = imageUrl;
      if (!source.startsWith("data:")) {
        const taken = await takePlate({ data: { url: source } });
        if (!taken.ok) {
          setFileNote(taken.error);
          return;
        }
        source = taken.dataUrl;
      }
      const blob = await (await fetch(source)).blob();
      if (kind === "download") {
        const href = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = href;
        link.download = "imaging-bay.jpg";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(href);
        setFileNote("Filed.");
        return;
      }
      const type = blob.type || "image/png";
      await navigator.clipboard.write([new ClipboardItem({ [type]: blob })]);
      setFileNote("Copied.");
    } catch {
      setFileNote(kind === "copy" ? "Copy did not leave the bay." : "The file did not leave the bay.");
    }
  }

  function resetLog() {
    setMissing("");
    setDifferent("");
    setOmit("");
    setNote("");
    setShown(false);
    setImageUrl(null);
    setPhase("idle");
    setStatus("");
    setLogOpen(false);
    setWindowOpen(false);
    setKeptUrl(null);
    setFileNote("");
  }

  const selected = STYLES.find((style) => style.id === styleId) ?? STYLES[0];
  const busy = phase === "exposing";

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pt-10 pb-20">
      <div className="reticle mb-5" aria-hidden="true" />
      <p className="bay-kicker text-xs uppercase">Survey vessel · Imaging bay</p>
      <div className="mt-3 flex items-center gap-2 text-xs tracking-widest text-lilac uppercase">
        <span className="lamp" aria-hidden="true" />
        <span className="bay-kicker">Bay live</span>
      </div>
      <h1 className="bay-title font-display mt-4 text-5xl leading-none font-medium text-balance">
        Imaging Bay
      </h1>
      <div className="mt-5">
        <p className="bay-label text-xs text-butter">{credits} credits</p>
        <PackRow onDraw={(pack) => setCredits((count) => count + pack.credits)} />
      </div>

      <section className="mt-10" aria-labelledby="plate-label">
        <h2 id="plate-label" className="bay-kicker mb-3 text-xs uppercase">
          Plate
        </h2>
        <div role="radiogroup" aria-label="Image plate" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STYLES.map((style) => {
            const on = style.id === styleId;
            return (
              <button
                key={style.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setStyleId(style.id)}
                className={"bay-box min-h-11 px-3 py-3 text-left " + (on ? "bay-box-on" : "")}
                style={{ "--tint": style.tint } as CSSProperties}
              >
                <span className="bay-index block text-xs">{style.index}</span>
                <span className="bay-name mt-1 block text-lg">{style.name}</span>
                <span className="bay-spare mt-1 block text-xs">{style.spare}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="frame-label">
        <h2 id="frame-label" className="bay-kicker mb-3 text-xs uppercase">
          Frame
        </h2>
        <div role="radiogroup" aria-label="Frame shape" className="grid grid-cols-4 gap-3">
          {ASPECTS.map((item, index) => {
            const on = item.id === aspect;
            const tint = ["#c5d9f5", "#f3cbb8", "#d7c6f2", "#c4eee6"][index] ?? "#d7c6f2";
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setAspect(item.id)}
                className={"bay-box min-h-11 px-2 py-2 text-center " + (on ? "bay-box-on" : "")}
                style={{ "--tint": tint } as CSSProperties}
              >
                <span className="bay-name block text-sm">{item.name}</span>
                <span className="bay-spare mt-1 block text-xs">{item.spare}</span>
              </button>
            );
          })}
        </div>
      </section>

      <form
        className="mt-8"
        onSubmit={(event) => {
          event.preventDefault();
          void expose();
        }}
      >
        <label htmlFor={subjectId} className="bay-label mb-2 block text-xs text-peach">
          What is in the frame
        </label>
        <textarea
          id={subjectId}
          required
          rows={4}
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="A wet street at dusk, one yellow window lit, a bicycle on the rail."
          className="bay-well w-full resize-y border border-line bg-hull px-4 py-3 text-base leading-relaxed text-paper outline-none placeholder:text-mute focus:border-blush"
        />
        <button
          type="submit"
          disabled={busy}
          className="bay-press mt-4 min-h-12 px-6 text-xs uppercase disabled:opacity-40"
        >
          {busy ? "Exposing" : "Expose"}
        </button>
      </form>

      {shown ? (
        <section className="mt-10" aria-live="polite">
          <div className="bay-box mb-0 border-lilac p-3" style={{ "--tint": "#d7c6f2" } as CSSProperties}>
            <div className="mb-3 flex items-center justify-between gap-3 text-xs tracking-widest text-mute uppercase">
              <span>Aperture</span>
              <span className="text-phosphor">{plateLabel || selected.name}</span>
            </div>
            <div className={`relative bg-void ${ratioClass(aspect)}`}>
              {imageUrl ? (
                <button
                  type="button"
                  className="absolute inset-0"
                  onClick={() => setWindowOpen(true)}
                  aria-label="Open the plate"
                >
                  <img
                    src={imageUrl}
                    alt={subject.trim() || "Exposed plate"}
                    className="h-full w-full object-contain"
                  />
                </button>
              ) : (
                <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-xs tracking-widest text-mute uppercase">
                  {busy ? "Exposing" : "No plate"}
                </p>
              )}
            </div>
          </div>
          <p className={`mt-3 text-sm ${phase === "error" ? "text-danger" : "text-mute"}`}>{status}</p>
        </section>
      ) : null}

      {windowOpen && imageUrl ? (
        <PlateWindow
          url={imageUrl}
          label={plateLabel || selected.name}
          credits={credits}
          kept={keptUrl === imageUrl}
          note={fileNote}
          onClose={() => setWindowOpen(false)}
          onKeep={() => {
            if (keptUrl === imageUrl) return;
            if (credits < KEEP_COST) {
              setFileNote("A keep costs 1 credit.");
              return;
            }
            setCredits((count) => count - KEEP_COST);
            setKeptUrl(imageUrl);
            setFileNote("Kept. Download the file, or copy it.");
          }}
          onDownload={() => void savePlate("download")}
          onCopy={() => void savePlate("copy")}
          onDraw={(pack) => {
            setCredits((count) => count + pack.credits);
            setFileNote(`${pack.name} added. ${pack.credits} credits.`);
          }}
        />
      ) : null}

      {logOpen ? (
        <section className="bay-box mt-8 px-5 py-6" style={{ "--tint": "#c4eee6" } as CSSProperties}>
          <p className="bay-label text-xs text-aqua">Mark the proof</p>
          <ul className="mt-4 space-y-3">
            {LOG_LINES.map((line) => (
              <li key={line} className="border-l border-phosphor pl-3">
                <p className="font-display text-lg leading-snug text-pretty italic">{line}</p>
                <button
                  type="button"
                  className="mt-1 min-h-11 text-xs tracking-widest text-phosphor uppercase"
                  onClick={() => setNote((current) => (current.trim() ? `${current.trim()} ${line}` : line))}
                >
                  Use this
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-5 grid gap-4">
            <Field
              label="Missing"
              value={missing}
              onChange={setMissing}
              placeholder="a figure under the window, rain on the glass"
            />
            <Field
              label="Different"
              value={different}
              onChange={setDifferent}
              placeholder="colder light, closer, earlier evening"
            />
            <Field
              label="Leave out"
              value={omit}
              onChange={setOmit}
              placeholder="cars, signs, extra people"
            />
            <label className="block">
              <span className="bay-label mb-2 block text-xs text-aqua">Your words</span>
              <textarea
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Keep the yellow window. Camera at waist height."
                className="w-full resize-y bay-well border border-line bg-void px-4 py-3 text-base leading-relaxed text-paper outline-none placeholder:text-mute focus:border-aqua"
              />
            </label>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void expose()}
              className="bay-press min-h-12 px-6 text-xs uppercase disabled:opacity-40"
            >
              {busy ? "Exposing" : "Expose again"}
            </button>
            <button
              type="button"
              onClick={resetLog}
              className="bay-box min-h-12 px-6 text-xs uppercase"
            >
              Start over
            </button>
          </div>
        </section>
      ) : null}

      <footer className="mt-12 border-t border-line pt-4 text-xs tracking-wide text-mute">
        <p>
          Created by{" "}
          <a
            href="https://majorturkey.org"
            className="text-blush underline decoration-line underline-offset-4"
          >
            MajorTurkey
          </a>
        </p>
      </footer>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="block">
      <span className="bay-label mb-2 block text-xs text-peach">{label}</span>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="bay-well w-full border border-line bg-void px-4 py-3 text-base text-paper outline-none placeholder:text-mute focus:border-peach"
      />
    </label>
  );
}
