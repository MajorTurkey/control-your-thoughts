export function readSessionCookies(header: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    if (!name.includes("session_token") && !name.includes("session_data")) continue;
    const value = part.slice(eq + 1).trim();
    if (!cookieValue(value)) continue;
    cookies[name] = value;
  }
  return cookies;
}

export function encodeHandoff(cookies: Record<string, string>): string {
  if (!Object.keys(cookies).length) return "";
  const bytes = new TextEncoder().encode(JSON.stringify(cookies));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export function decodeHandoff(value: string): Record<string, string> {
  if (!value) return {};
  const pad = (4 - (value.length % 4)) % 4;
  const binary = atob(value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat(pad));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const parsed = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  if (!parsed || typeof parsed !== "object") return {};
  const cookies: Record<string, string> = {};
  for (const [name, item] of Object.entries(parsed)) {
    if (typeof item === "string" && cookieValue(item)) cookies[name] = item;
  }
  return cookies;
}

function cookieValue(value: string): boolean {
  return value.length > 0 && value.length < 8000 && !/[\s;]/.test(value);
}
