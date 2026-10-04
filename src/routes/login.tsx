import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-16">
      <p className="bay-kicker text-xs uppercase">Survey vessel</p>
      <h1 className="bay-title font-display mt-4 text-5xl leading-none font-medium">Imaging Bay</h1>
      <p className="font-display mt-4 text-lg leading-snug text-paper">
        No account. The bay keeps descriptions on this device.
      </p>
      <Link to="/" className="bay-press mt-10 inline-flex min-h-12 items-center px-4 text-xs uppercase">
        Enter
      </Link>
    </main>
  );
}
