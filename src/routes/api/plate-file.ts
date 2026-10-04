import { createFileRoute } from "@tanstack/react-router";

const MAX_BYTES = 8_000_000;

const held = new Map<string, { bytes: Uint8Array; ext: string }>();

function remember(file: { bytes: Uint8Array; ext: string }): string {
  const id = crypto.randomUUID().replaceAll("-", "");
  held.set(id, file);
  while (held.size > 24) {
    const oldest = held.keys().next().value;
    if (!oldest) break;
    held.delete(oldest);
  }
  return id;
}

function allowedHttps(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase();
  const ok =
    host === "x.ai" ||
    host.endsWith(".x.ai") ||
    host.endsWith(".openai.com") ||
    host.endsWith(".oaiusercontent.com") ||
    host.endsWith(".blob.core.windows.net");
  return ok ? url.toString() : null;
}

function fromData(value: string): { bytes: Uint8Array; ext: string } | null {
  const match = /^data:(image\/(jpeg|png|webp));base64,([a-z0-9+/=\s]+)$/i.exec(value.trim());
  if (!match) return null;
  const bytes = new Uint8Array(Buffer.from(match[3].replace(/\s/g, ""), "base64"));
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) return null;
  const kind = match[2].toLowerCase();
  return { bytes, ext: kind === "jpeg" ? "jpg" : kind };
}

async function fromHttps(value: string): Promise<{ bytes: Uint8Array; ext: string } | null> {
  let current = allowedHttps(value);
  if (!current) return null;
  for (let hop = 0; hop < 3; hop++) {
    let res: Response;
    try {
      res = await fetch(current, { redirect: "manual" });
    } catch {
      return null;
    }
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return null;
      const next = new URL(loc, current).toString();
      if (!next.startsWith("https://")) return null;
      current = next;
      continue;
    }
    if (!res.ok) return null;
    const type = res.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
    if (!type.startsWith("image/")) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) return null;
    const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
    return { bytes, ext };
  }
  return null;
}

function attachment(file: { bytes: Uint8Array; ext: string }) {
  const name = `imaging-bay.${file.ext}`;
  const body = new ArrayBuffer(file.bytes.byteLength);
  new Uint8Array(body).set(file.bytes);
  return new Response(body, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Content-Length": String(file.bytes.byteLength),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function handoff(request: Request) {
  let source = "";
  let asLink = false;
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const body = (await request.json()) as { source?: unknown; asLink?: unknown };
    if (typeof body.source === "string") source = body.source;
    asLink = body.asLink === true;
  } else {
    const form = await request.formData();
    const field = form.get("source");
    if (typeof field === "string") source = field;
  }
  if (!source) return new Response("The plate is not a file.", { status: 400 });
  const file = source.startsWith("data:") ? fromData(source) : await fromHttps(source);
  if (!file) return new Response("The file did not leave the bay.", { status: 400 });
  if (!asLink) return attachment(file);
  const id = remember(file);
  const name = `imaging-bay.${file.ext}`;
  return Response.json({ href: `/api/plate-file?id=${id}`, name });
}

async function saved(request: Request) {
  const url = new URL(request.url);
  const src = url.searchParams.get("src");
  if (src) {
    const file = await fromHttps(src);
    if (!file) return new Response("The file did not leave the bay.", { status: 400 });
    return attachment(file);
  }
  const id = url.searchParams.get("id") ?? "";
  const file = held.get(id);
  if (!file) return new Response("The file did not leave the bay.", { status: 404 });
  return attachment(file);
}

export const Route = createFileRoute("/api/plate-file")({
  server: {
    handlers: {
      POST: ({ request }) => handoff(request),
      GET: ({ request }) => saved(request),
    },
  },
});
