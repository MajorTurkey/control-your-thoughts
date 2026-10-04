import { createFileRoute } from "@tanstack/react-router";
import { decodeHandoff } from "@/lib/auth/handoff";

export const Route = createFileRoute("/auth/claim")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const home = new URL("/", request.url).toString();
        const cookies = decodeHandoff(new URL(request.url).searchParams.get("h") ?? "");
        const headers: [string, string][] = [
          ["location", home],
          ["cache-control", "no-store"],
          ["referrer-policy", "no-referrer"],
        ];
        for (const [name, value] of Object.entries(cookies)) {
          if (!/^(__Host-grok-auth|better-auth)\.session_(token|data)(\.\d+)?$/.test(name)) continue;
          headers.push([
            "set-cookie",
            `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=604800`,
          ]);
        }
        return new Response(null, { status: 302, headers });
      },
    },
  },
});
