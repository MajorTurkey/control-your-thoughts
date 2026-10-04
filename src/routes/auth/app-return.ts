import { createFileRoute } from "@tanstack/react-router";
import { encodeHandoff, readSessionCookies } from "@/lib/auth/handoff";

export const Route = createFileRoute("/auth/app-return")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const handoff = encodeHandoff(readSessionCookies(request.headers.get("cookie") ?? ""));
        const dest = new URL("/auth/open", new URL(request.url).origin);
        if (handoff) dest.searchParams.set("h", handoff);
        return Response.redirect(dest.toString(), 302);
      },
    },
  },
});
