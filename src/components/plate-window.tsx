import type { CSSProperties } from "react";

export function PlateWindow({
  url,
  label,
  note,
  saveHref,
  folder,
  folders,
  onFolder,
  onClose,
  onSave,
}: {
  url: string;
  label: string;
  note: string;
  saveHref: string;
  folder: string;
  folders: { id: string; label: string }[];
  onFolder: (folder: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
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
        <p className="bay-label mb-3 text-xs">{label}</p>
        <img src={url} alt={label} className="max-h-[68vh] w-full bg-void object-contain" />
        {note ? <p className="mt-3 text-sm text-paper">{note}</p> : null}
        <label className="mt-4 block max-w-xs">
          <span className="bay-label mb-2 block text-xs text-phosphor">Save folder</span>
          <select
            value={folder}
            onChange={(event) => onFolder(event.target.value)}
            className="bay-well min-h-12 w-full border border-line bg-hull px-3 text-base text-paper"
          >
            {folders.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={saveHref || undefined}
            className="bay-press inline-flex min-h-12 items-center px-6 text-xs uppercase"
            onClick={(event) => {
              if (!saveHref) event.preventDefault();
              onSave();
            }}
          >
            Save
          </a>
          <button type="button" className="bay-box min-h-12 px-6 text-xs uppercase" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
