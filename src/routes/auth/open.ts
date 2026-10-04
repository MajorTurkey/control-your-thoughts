import { createFileRoute } from "@tanstack/react-router";
import { encodeHandoff, readSessionCookies } from "@/lib/auth/handoff";

const PACKAGE = "org.majorturkey.imagingbay";

export const Route = createFileRoute("/auth/open")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url);
        const handoff =
          url.searchParams.get("h") ||
          encodeHandoff(readSessionCookies(request.headers.get("cookie") ?? ""));
        const intent = handoff
          ? `intent://return/#Intent;scheme=imagingbay;package=${PACKAGE};S.handoff=${handoff};end`
          : `intent://return/#Intent;scheme=imagingbay;package=${PACKAGE};end`;
        const custom = handoff ? `imagingbay://return#${handoff}` : "imagingbay://return";
        const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="referrer" content="no-referrer">
  <title>Return to Imaging Bay</title>
  <style>
    html, body { margin: 0; height: 100%; background: #0a0f18; color: #e7e1d4; font: 18px/1.4 sans-serif; }
    a.return { display: flex; align-items: center; justify-content: center; min-height: 100%; padding: 2rem; color: #0a0f18; background: #e8d5a3; text-decoration: none; text-align: center; }
    a.alt { display: block; padding: 1rem; color: #c6f26d; text-align: center; }
  </style>
</head>
<body>
  <a id="go" class="return" href="${escapeAttr(intent)}">Return to Imaging Bay</a>
  <a class="alt" href="${escapeAttr(custom)}">Open the bay</a>
  <script>
    var go = document.getElementById("go");
    if (go) location.href = go.href;
  </script>
</body>
</html>`;
        return new Response(html, {
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-store",
            "referrer-policy": "no-referrer",
          },
        });
      },
    },
  },
});

function escapeAttr(value: string): string {
  return value
    .replaceAll("&", "\u0026amp;")
    .replaceAll('"', "\u0026quot;")
    .replaceAll("<", "\u0026lt;")
    .replaceAll(">", "\u0026gt;");
}
