import type { CSSProperties } from "react";
import { PACKS } from "@/lib/imaging/credits";

type Pack = (typeof PACKS)[number];

export function PlateWindow({
  url,
  label,
  credits,
  kept,
  note,
  onClose,
  onKeep,
  onDownload,
  onCopy,
  onDraw,
}: {
  url: string;
  label: string;
  credits: number;
  kept: boolean;
  note: string;
  onClose: () => void;
  onKeep: () => void;
  onDownload: () => void;
  onCopy: () => void;
  onDraw: (pack: Pack) => void;
}) {
  const short = credits < 1 && !kept;

  return (
    <div className="bay-shade" role="presentation" onClick={onClose}>
      <div
        className="bay-window bay-box p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Plate window"
        style={{ "--tint": "#e8d5a3" } as CSSProperties}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="bay-label text-xs">{label}</p>
          <p className="bay-label text-xs text-phosphor">{credits} credits</p>
        </div>
        <img src={url} alt={label} className="max-h-[68vh] w-full bg-void object-contain" />
        {note ? <p className="mt-3 text-sm text-paper">{note}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {kept ? (
            <>
              <button type="button" className="bay-press min-h-12 px-6 text-xs uppercase" onClick={onDownload}>
                Download
              </button>
              <button type="button" className="bay-press min-h-12 px-6 text-xs uppercase" onClick={onCopy}>
                Copy
              </button>
            </>
          ) : (
            <button type="button" className="bay-press min-h-12 px-6 text-xs uppercase" onClick={onKeep}>
              Keep
            </button>
          )}
          <button type="button" className="bay-box min-h-12 px-6 text-xs uppercase" onClick={onClose}>
            {kept ? "Close" : "Re-think"}
          </button>
        </div>
        {short ? (
          <div className="mt-4">
            <p className="bay-label text-xs text-phosphor">Credit packs</p>
            <PackRow onDraw={onDraw} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function PackRow({ onDraw }: { onDraw: (pack: Pack) => void }) {
  return (
    <div className="mt-2 grid grid-cols-3 gap-2">
      {PACKS.map((pack) => (
        <button
          key={pack.id}
          type="button"
          className="bay-box px-2 py-2 text-left"
          style={{ "--tint": "#d4b056" } as CSSProperties}
          onClick={() => onDraw(pack)}
        >
          <span className="bay-name block text-base">{pack.name}</span>
          <span className="bay-spare mt-1 block text-xs">
            {pack.credits} · {pack.mark}
          </span>
        </button>
      ))}
    </div>
  );
}
