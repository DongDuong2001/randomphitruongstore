type ErrorLike = {
  name?: unknown;
  code?: unknown;
  status?: unknown;
  digest?: unknown;
  clientVersion?: unknown;
};

export function logServerError(context: string, error: unknown) {
  console.error(context, summarizeError(error));
}

export function logServerWarning(context: string, error: unknown) {
  console.warn(context, summarizeError(error));
}

export function summarizeError(error: unknown): Record<string, string | number> {
  if (!error || typeof error !== "object") {
    return { type: typeof error };
  }

  const errorLike = error as ErrorLike;
  return Object.fromEntries(
    [
      ["name", safeMetadata(errorLike.name)],
      ["code", safeMetadata(errorLike.code)],
      ["status", safeMetadata(errorLike.status)],
      ["digest", safeMetadata(errorLike.digest)],
      ["clientVersion", safeMetadata(errorLike.clientVersion)]
    ].filter((entry): entry is [string, string | number] => entry[1] !== null)
  );
}

function safeMetadata(value: unknown): string | number | null {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("://")) return null;
  return trimmed.length > 80 ? `${trimmed.slice(0, 80)}...` : trimmed;
}
