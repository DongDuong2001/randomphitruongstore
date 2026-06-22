"use client";

import { useEffect } from "react";

export default function AdminPanelError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin panel error", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <p className="eyebrow text-zinc-500">Admin error</p>
      <h2 className="mt-4 text-3xl font-black">Something went wrong.</h2>
      <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-600">
        An unexpected error occurred. Please try again.
      </p>
      <button
        className="button-primary mt-7"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </div>
  );
}
