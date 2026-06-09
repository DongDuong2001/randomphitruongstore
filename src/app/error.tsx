"use client";

export default function GlobalError({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-[70vh] place-items-center p-5">
      <div className="max-w-lg text-center">
        <p className="eyebrow text-zinc-500">Application error</p>
        <h1 className="mt-4 text-4xl font-black">Something went wrong.</h1>
        <p className="mt-4 text-sm leading-6 text-zinc-600">
          The request could not be completed. Check the database connection or
          try again.
        </p>
        <button className="button-primary mt-7" onClick={reset} type="button">
          Try again
        </button>
      </div>
    </main>
  );
}
