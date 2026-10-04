import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/start")({
  component: AuthStart,
});

function AuthStart() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6">
      <p className="text-base text-paper">Sign-in is not used.</p>
      <Link to="/" className="mt-6 text-base text-phosphor underline decoration-phosphor underline-offset-4">
        Back to the bay
      </Link>
    </main>
  );
}
