import { useEffect, useId, useState } from "react";
import {
  ASPECTS,
  LOG_LINES,
  STYLES,
  type AspectId,
  type StyleId,
} from "@/lib/imaging/catalog";
import { exposePlate } from "@/lib/imaging/generate";

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
  }, []);

  useEffect(() => {
    if (!prefsReady) return;
    localStorage.setItem(PREF_KEY, JSON.stringify({ styleId, aspect }));
  }, [prefsReady, styleId, aspect]);

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
      setStatus("Mark what is missing or wrong.");
      setLogOpen(true);
    } catch (error) {
      setPhase("error");
      setStatus(error instanceof Error ? error.message : "The bay did not answer.");
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
  }

  const selected = STYLES.find((style) => style.id === styleId) ?? STYLES[0];
  const busy = phase === "exposing";

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pt-10 pb-20">
      <div className="reticle mb-5" aria-hidden="true" />
      <p className="text-xs tracking-widest text-phosphor uppercase">Survey vessel · Imaging bay</p>
      <div className="mt-3 flex items-center gap-2 text-xs tracking-widest text-mute uppercase">
        <span className="lamp" aria-hidden="true" />
        <span>Bay live</span>
      </div>
      <h1 className="font-display mt-4 text-5xl leading-none font-medium text-balance text-paper">
        Imaging Bay
      </h1>
      <p className="font-display mt-4 max-w-xl text-xl leading-snug text-pretty text-mute italic">
        Choose a plate. Write only what is in the frame. The manner is already on file.
      </p>

      <section className="mt-10" aria-labelledby="plate-label">
        <h2 id="plate-label" className="mb-3 text-xs tracking-widest text-mute uppercase">
          Plate
        </h2>
        <div role="radiogroup" aria-label="Image plate" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STYLES.map((style) => {
            const on = style.id === styleId;
            return (
              <button
                key={style.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setStyleId(style.id)}
                className={
                  "min-h-11 border px-3 py-3 text-left transition-colors duration-200 " +
                  (on
                    ? "border-phosphor bg-hull text-paper"
                    : "border-line bg-void text-mute hover:border-phosphor hover:text-paper")
                }
              >
                <span className="block text-xs tracking-widest text-phosphor">{style.index}</span>
                <span className="font-display mt-1 block text-lg leading-tight text-paper">
                  {style.name}
                </span>
                <span className="mt-1 block text-xs leading-snug text-pretty">{style.spare}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="frame-label">
        <h2 id="frame-label" className="mb-3 text-xs tracking-widest text-mute uppercase">
          Frame
        </h2>
        <div role="radiogroup" aria-label="Frame shape" className="grid grid-cols-4 gap-2">
          {ASPECTS.map((item) => {
            const on = item.id === aspect;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setAspect(item.id)}
                className={
                  "min-h-11 border px-2 py-2 text-center transition-colors duration-200 " +
                  (on
                    ? "border-phosphor bg-hull text-paper"
                    : "border-line bg-void text-mute hover:border-phosphor hover:text-paper")
                }
              >
                <span className="block text-sm text-paper">{item.name}</span>
                <span className="mt-1 block text-xs tracking-wide text-mute uppercase">
                  {item.spare}
                </span>
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
        <label htmlFor={subjectId} className="mb-2 block text-xs tracking-widest text-mute uppercase">
          What is in the frame
        </label>
        <textarea
          id={subjectId}
          required
          rows={4}
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="A wet street at dusk, one yellow window lit, a bicycle on the rail."
          className="w-full resize-y border border-line bg-hull px-4 py-3 text-base leading-relaxed text-paper outline-none placeholder:text-mute focus:border-phosphor"
        />
        <p className="mt-2 text-sm leading-relaxed text-mute">
          The subject only. Light and medium are already chosen.
        </p>
        <button
          type="submit"
          disabled={busy}
          className="mt-4 min-h-12 bg-phosphor px-6 text-xs tracking-widest text-void uppercase disabled:opacity-40"
        >
          {busy ? "Exposing" : "Expose"}
        </button>
      </form>

      {shown ? (
        <section className="mt-10" aria-live="polite">
          <div className="border border-phosphor bg-hull p-3">
            <div className="mb-3 flex items-center justify-between gap-3 text-xs tracking-widest text-mute uppercase">
              <span>Aperture</span>
              <span className="text-phosphor">{plateLabel || selected.name}</span>
            </div>
            <div className={`relative bg-void ${ratioClass(aspect)}`}>
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={subject.trim() || "Exposed plate"}
                  className="absolute inset-0 h-full w-full object-contain"
                />
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

      {logOpen ? (
        <section className="mt-8 border border-line bg-panel px-5 py-6">
          <p className="text-xs tracking-widest text-phosphor uppercase">Mark the proof</p>
          <h2 className="font-display mt-2 text-3xl leading-tight font-medium text-balance">
            What is missing. What should change.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-mute">
            Say what is missing, what should change, and what to leave out. The next plate keeps
            this manner unless you change it.
          </p>
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
              <span className="mb-2 block text-xs tracking-widest text-mute uppercase">Your words</span>
              <textarea
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Keep the yellow window. Camera at waist height."
                className="w-full resize-y border border-line bg-void px-4 py-3 text-base leading-relaxed text-paper outline-none placeholder:text-mute focus:border-phosphor"
              />
            </label>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void expose()}
              className="min-h-12 bg-phosphor px-6 text-xs tracking-widest text-void uppercase disabled:opacity-40"
            >
              {busy ? "Exposing" : "Expose again"}
            </button>
            <button
              type="button"
              onClick={resetLog}
              className="min-h-12 border border-line px-6 text-xs tracking-widest text-paper uppercase"
            >
              Start over
            </button>
          </div>
        </section>
      ) : null}

      <footer className="mt-12 border-t border-line pt-4 text-xs tracking-wide text-mute">
        <p>You speak. The bay exposes. You correct the record.</p>
        <p className="mt-2">
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
      <span className="mb-2 block text-xs tracking-widest text-mute uppercase">{label}</span>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-line bg-void px-4 py-3 text-base text-paper outline-none placeholder:text-mute focus:border-phosphor"
      />
    </label>
  );
}
