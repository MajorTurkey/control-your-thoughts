export const CREDIT_KEY = "imaging-bay-credits";
export const OPENING_CREDITS = 4;
export const KEEP_COST = 1;

export const PACKS = [
  { id: "slip", name: "Slip", credits: 8, mark: "$4", spare: "A short run" },
  { id: "case", name: "Case", credits: 30, mark: "$12", spare: "The usual hold" },
  { id: "hold", name: "Hold", credits: 80, mark: "$28", spare: "A long watch" },
] as const;

export type PackId = (typeof PACKS)[number]["id"];

export function readCredits(): number {
  try {
    const raw = localStorage.getItem(CREDIT_KEY);
    if (raw == null) return OPENING_CREDITS;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) return OPENING_CREDITS;
    return Math.floor(value);
  } catch {
    return OPENING_CREDITS;
  }
}
