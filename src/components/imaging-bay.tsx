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
  const [reference, setReference] = useState("");
  const [liked, setLiked] = useState<string[]>([]);

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
    try {
      const raw = localStorage.getItem("imaging-bay-liked");
      if (raw) {
        const saved = JSON.parse(raw) as unknown;
        if (Array.isArray(saved)) {
          setLiked(saved.filter((item) => typeof item === "string").slice(0, 4));
        }
      }
    } catch {
      /* no memory */
    }
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
    try {
      localStorage.setItem("imaging-bay-liked", JSON.stringify(liked.slice(0, 4)));
    } catch {
      /* the desk forgot */
    }
  }, [liked]);

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
    setStatus(reference ? "Engendering from the reference…" : "Exposing the plate…");
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
          reference,
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

  async function shrinkReference(file: File): Promise<string> {
    const bitmap = await createImageBitmap(file);
    const max = 768;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return "";
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", 0.82);
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
      <div className="mt-3 flex items-center gap-2 text-xs tracking-widest text-paper uppercase">
        <span className="lamp" aria-hidden="true" />
        <span className="bay-kicker">Bay live</span>
      </div>
      <h1 className="bay-title font-display mt-4 text-5xl leading-none font-medium text-balance">
        Imaging Bay
      </h1>
      <p className="font-display mt-4 max-w-xl text-lg leading-snug text-pretty text-paper">
        The plate is the manner. The sentence is only the subject.
      </p>
      <p className="font-display mt-3 max-w-xl text-lg leading-snug text-pretty text-phosphor">
        GPT Image 2.5 engenders the plate. Take a reference. Those desks also edit, take
        references, and remember what you liked.
      </p>
      <div className="mt-5">
        <p className="bay-label text-xs text-phosphor">{credits} credits</p>
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
            const tint = ["#e8d5a3", "#d4b056", "#f0e6c8", "#c9a35a"][index] ?? "#e8d5a3";
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

      <section className="mt-8" aria-labelledby="reference-label">
        <h2 id="reference-label" className="bay-kicker mb-3 text-xs text-phosphor uppercase">
          Reference
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="bay-press inline-flex min-h-12 cursor-pointer items-center px-4 text-xs uppercase">
            Take reference
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                void shrinkReference(file).then(setReference);
              }}
            />
          </label>
          {reference ? (
            <button type="button" className="bay-label text-xs text-phosphor" onClick={() => setReference("")}>
              Clear
            </button>
          ) : null}
        </div>
        {reference ? (
          <img src={reference} alt="Reference" className="mt-3 h-24 w-24 object-cover" />
        ) : null}
        {liked.length > 0 ? (
          <div className="mt-3 flex gap-2">
            {liked.map((item) => (
              <button key={item.slice(0, 48)} type="button" onClick={() => setReference(item)} aria-label="Use this memory">
                <img src={item} alt="" className="h-16 w-16 object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <form
        className="mt-8"
        onSubmit={(event) => {
          event.preventDefault();
          void expose();
        }}
      >
        <label htmlFor={subjectId} className="bay-label mb-2 block text-xs text-phosphor">
          What is in the frame
        </label>
        <textarea
          id={subjectId}
          required
          rows={4}
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="A wet street at dusk, one yellow window lit, a bicycle on the rail."
          className="bay-well w-full resize-y border border-line bg-hull px-4 py-3 text-base leading-relaxed text-paper outline-none placeholder:text-mute focus:border-phosphor"
        />
        <button
          type="submit"
          disabled={busy}
          className="bay-press mt-4 min-h-12 px-6 text-xs uppercase disabled:opacity-40"
        >
          {busy ? "Engendering" : reference ? "Engender" : "Expose"}
        </button>
      </form>

      {shown ? (
        <section className="mt-10" aria-live="polite">
          <div className="bay-box mb-0 border-phosphor p-3" style={{ "--tint": "#e8d5a3" } as CSSProperties}>
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
            setLiked((current) => [imageUrl, ...current.filter((item) => item !== imageUrl)].slice(0, 4));
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
        <section className="bay-box mt-8 px-5 py-6" style={{ "--tint": "#d4b056" } as CSSProperties}>
          <p className="bay-label text-xs text-phosphor">Mark the proof</p>
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
              <span className="bay-label mb-2 block text-xs text-phosphor">Your words</span>
              <textarea
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Keep the yellow window. Camera at waist height."
                className="w-full resize-y bay-well border border-line bg-void px-4 py-3 text-base leading-relaxed text-paper outline-none placeholder:text-mute focus:border-phosphor"
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
            className="text-phosphor underline decoration-line underline-offset-4"
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
      <span className="bay-label mb-2 block text-xs text-phosphor">{label}</span>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="bay-well w-full border border-line bg-void px-4 py-3 text-base text-paper outline-none placeholder:text-mute focus:border-phosphor"
      />
    </label>
  );
}
