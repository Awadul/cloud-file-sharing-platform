"use client";
import Link from "next/link";
import { useEffect } from "react";
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN)
      void import("@sentry/nextjs").then((Sentry) =>
        Sentry.captureException(error),
      );
  }, [error]);
  return (
    <html lang="en">
      <body>
        <main>
          <h1>Plainpage could not open this page</h1>
          <p>
            Your saved documents remain in your workspace. Try again or contact
            awaisabdullahm79@gmail.com.
          </p>
          <button className="btn" onClick={reset}>
            Try again
          </button>
          <Link href="/">Return to Plainpage</Link>
        </main>
      </body>
    </html>
  );
}
