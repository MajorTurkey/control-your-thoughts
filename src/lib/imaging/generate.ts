import { createServerFn } from "@tanstack/react-start";
import {
  ASPECTS,
  compilePrompt,
  isAspectId,
  isStyleId,
  styleById,
  type AspectId,
  type StyleId,
} from "./catalog";

const MODELS = ["grok-imagine-image-2.0", "grok-imagine-image-quality"] as const;

export type ExposeInput = {
  subject: string;
  styleId: StyleId;
  aspect: AspectId;
  missing: string;
  different: string;
  omit: string;
  note: string;
  reference: string;
};

export type ExposeResult =
  | { ok: true; url: string; styleName: string; aspectName: string }
  | { ok: false; error: string };

function clip(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function readInput(data: unknown): ExposeInput {
  if (typeof data !== "object" || data === null) {
    throw new Error("Say what is in the frame.");
  }
  const record = data as Record<string, unknown>;
  const subject = clip(record.subject, 1200);
  if (!subject) throw new Error("Say what is in the frame.");
  const styleRaw = clip(record.styleId, 40);
  const aspectRaw = clip(record.aspect, 12);
  if (!isStyleId(styleRaw)) throw new Error("Pick a plate.");
  if (!isAspectId(aspectRaw)) throw new Error("Pick a frame.");
  return {
    subject,
    styleId: styleRaw,
    aspect: aspectRaw,
    missing: clip(record.missing, 400),
    different: clip(record.different, 400),
    omit: clip(record.omit, 400),
    note: clip(record.note, 800),
    reference: readReference(record.reference),
  };
}

function readReference(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed.startsWith("data:image/")) return "";
  if (trimmed.length > 1_800_000) return "";
  return trimmed;
}

function keyFromEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

/** Project-folder secret. Used only when the process has no key of its own. */
async function keyFromFile(name: string): Promise<string | undefined> {
  try {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const text = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    const prefix = `${name}=`;
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed.startsWith(prefix)) continue;
      let value = trimmed.slice(prefix.length).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      return value || undefined;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

async function imagingKey(): Promise<string | undefined> {
  return keyFromEnv("XAI_API_KEY") ?? (await keyFromFile("XAI_API_KEY"));
}

async function openaiKey(): Promise<string | undefined> {
  return keyFromEnv("OPENAI_API_KEY") ?? (await keyFromFile("OPENAI_API_KEY"));
}

type ImagePayload = {
  data?: { url?: string; b64_json?: string }[];
  error?: { message?: string };
};

function flareSize(aspect: AspectId): string {
  if (aspect === "1:1") return "1024x1024";
  if (aspect === "2:3") return "1024x1536";
  if (aspect === "21:9") return "1536x640";
  return "1536x864";
}

async function requestFlare(apiKey: string, prompt: string, aspect: AspectId) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-image-2.5-flare",
      prompt,
      n: 1,
      size: flareSize(aspect),
      quality: "auto",
    }),
  });
  const text = await res.text();
  let body: ImagePayload = {};
  try {
    body = JSON.parse(text) as ImagePayload;
  } catch {
    body = {};
  }
  return { res, body };
}
async function requestImage(
  apiKey: string,
  model: string,
  prompt: string,
  aspect: AspectId,
  reference: string,
) {
  const payload: Record<string, unknown> = {
    model,
    prompt,
    n: 1,
    aspect_ratio: aspect,
    resolution: "1k",
    quality: "auto",
    response_format: "b64_json",
  };
  if (reference) payload.image = { url: reference };
  const endpoint = reference
    ? "https://api.x.ai/v1/images/edits"
    : "https://api.x.ai/v1/images/generations";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let body: ImagePayload = {};
  try {
    body = JSON.parse(text) as ImagePayload;
  } catch {
    body = {};
  }
  if (!res.ok && reference && (res.status === 404 || res.status === 405)) {
    const again = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
    const againText = await again.text();
    let againBody: ImagePayload = {};
    try {
      againBody = JSON.parse(againText) as ImagePayload;
    } catch {
      againBody = {};
    }
    return { res: again, body: againBody };
  }
  return { res, body };
}

function imageUrl(body: ImagePayload): string | null {
  const item = body.data?.[0];
  if (!item) return null;
  if (item.url) return item.url;
  if (item.b64_json) {
    const raw = item.b64_json.startsWith("data:")
      ? item.b64_json
      : `data:image/jpeg;base64,${item.b64_json}`;
    return raw;
  }
  return null;
}

export const exposePlate = createServerFn({ method: "POST" })
  .validator(readInput)
  .handler(async ({ data }): Promise<ExposeResult> => {
    const prompt = compilePrompt(data);
    const flareKey = await openaiKey();
    if (flareKey && !data.reference) {
      try {
        const flare = await requestFlare(flareKey, prompt, data.aspect);
        const flareUrl = imageUrl(flare.body);
        if (flare.res.ok && flareUrl) {
          const style = styleById(data.styleId);
          const aspect = ASPECTS.find((item) => item.id === data.aspect);
          return {
            ok: true as const,
            url: flareUrl,
            styleName: style.name,
            aspectName: aspect?.name ?? data.aspect,
          };
        }
      } catch {
        /* fall through to the bay */
      }
    }

    const apiKey = await imagingKey();
    if (!apiKey) {
      return { ok: false, error: "Imaging is offline in this bay." };
    }

    let lastError = "The bay returned no plate.";

    for (let i = 0; i < MODELS.length; i++) {
      const model = MODELS[i];
      let result: { res: Response; body: ImagePayload };
      try {
        result = await requestImage(apiKey, model, prompt, data.aspect, data.reference);
      } catch {
        return { ok: false, error: "The bay could not be reached. Try once more." };
      }

      const url = imageUrl(result.body);
      if (result.res.ok && url) {
        const style = styleById(data.styleId);
        const aspect = ASPECTS.find((item) => item.id === data.aspect);
        return {
          ok: true,
          url,
          styleName: style.name,
          aspectName: aspect?.name ?? data.aspect,
        };
      }

      const message = result.body.error?.message?.slice(0, 180) ?? "";
      const modelIssue = result.res.status === 404 || /model/i.test(message);
      if (modelIssue && i < MODELS.length - 1) {
        lastError = message || lastError;
        continue;
      }
      if (result.res.status === 429) {
        return { ok: false, error: "The bay is busy. Wait a moment, then expose again." };
      }
      return {
        ok: false,
        error: message || `The bay refused the plate (${result.res.status}).`,
      };
    }

    return { ok: false, error: lastError };
  });

function plateFileUrl(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("https://")) {
    throw new Error("The plate is not a file.");
  }
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  if (host !== "x.ai" && !host.endsWith(".x.ai")) {
    throw new Error("The plate is not a file from this bay.");
  }
  return url.toString();
}

export const takePlate = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (typeof data !== "object" || data === null) throw new Error("The plate is not a file.");
    return { url: plateFileUrl((data as { url?: unknown }).url) };
  })
  .handler(async ({ data }) => {
    let res: Response;
    try {
      res = await fetch(data.url);
    } catch {
      return { ok: false as const, error: "The file did not leave the bay." };
    }
    if (!res.ok) return { ok: false as const, error: "The file did not leave the bay." };
    const type = res.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg";
    if (!type.startsWith("image/")) return { ok: false as const, error: "The file did not leave the bay." };
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length === 0 || bytes.length > 8_000_000) {
      return { ok: false as const, error: "The file did not leave the bay." };
    }
    return {
      ok: true as const,
      dataUrl: `data:${type};base64,${bytes.toString("base64")}`,
    };
  });
