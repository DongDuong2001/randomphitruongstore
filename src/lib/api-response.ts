import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import type { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

// ─── Response shape types ─────────────────────────────────────────────────────

export type ApiSuccess<T> = { success: true; data: T };

export type ApiError = {
  success: false;
  error: string;
  details?: Record<string, string[]>;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Response helpers ─────────────────────────────────────────────────────────

/** Wrap any payload in a standard success envelope. */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccess<T>>({ success: true, data }, { status });
}

/** Return a standard error envelope. */
export function err(message: string, status: number, details?: Record<string, string[]>) {
  const body: ApiError = { success: false, error: message, ...(details && { details }) };
  return NextResponse.json<ApiError>(body, { status });
}

/** Convert a Zod validation error into the details map shape. */
export function zodDetails(error: ZodError): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>;
}

// ─── Prisma error handler ─────────────────────────────────────────────────────

/**
 * Map known Prisma runtime errors to meaningful HTTP responses.
 *
 * P2002 — unique constraint violation (e.g. duplicate slug)
 * P2025 — record not found (e.g. update/delete on non-existent id)
 */
export function handlePrismaError(error: unknown) {
  const prismaError = error as PrismaClientKnownRequestError;

  if (prismaError?.code === "P2002") {
    const fields = (prismaError.meta?.target as string[]) ?? [];
    const fieldList = fields.join(", ");
    return err(
      fieldList ? `${fieldList} already exists` : "A unique constraint was violated",
      409
    );
  }

  if (prismaError?.code === "P2025") {
    return err("Record not found", 404);
  }

  // Unknown DB/server error — log it, return generic 500
  const e = error as { message?: string; code?: string; meta?: unknown; name?: string };
  console.error("[DB Error]", e?.name, e?.code, e?.message, JSON.stringify(e?.meta));
  return err("Internal server error", 500);
}
