import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";

export type PerfContext = {
  requestId: string;
  route: string;
};

type PerfMetadata = {
  cache?: "hit" | "miss" | "unknown";
};

export function createPerfContext(
  route: string,
  requestId: string | null | undefined = null
): PerfContext {
  return {
    route,
    requestId: safeIdentifier(requestId) ?? randomUUID()
  };
}

export async function withPerfTiming<T>(
  context: PerfContext,
  operation: string,
  task: () => Promise<T>,
  metadata: PerfMetadata = {}
): Promise<T> {
  if (!perfDiagnosticsEnabled()) {
    return task();
  }

  const start = performance.now();
  try {
    const result = await task();
    logPerfTiming(context, operation, start, true, metadata);
    return result;
  } catch (error) {
    logPerfTiming(context, operation, start, false, metadata);
    throw error;
  }
}

export function attachRequestId<T extends Response>(
  response: T,
  context: PerfContext
): T {
  response.headers.set("x-request-id", context.requestId);
  return response;
}

function perfDiagnosticsEnabled() {
  return process.env.PERF_DIAGNOSTICS === "1";
}

function logPerfTiming(
  context: PerfContext,
  operation: string,
  start: number,
  success: boolean,
  metadata: PerfMetadata
) {
  const durationMs = Math.round((performance.now() - start) * 10) / 10;
  console.info(
    JSON.stringify({
      event: "perf.operation",
      requestId: context.requestId,
      route: context.route,
      operation,
      durationMs,
      success,
      runtimeRegion:
        safeIdentifier(process.env.VERCEL_REGION) ??
        safeIdentifier(process.env.AWS_REGION) ??
        "local",
      ...metadata
    })
  );
}

function safeIdentifier(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.length > 120 || trimmed.includes("://")) {
    return null;
  }
  return trimmed;
}
