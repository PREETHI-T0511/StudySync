import { NextResponse } from "next/server";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
  }
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, "Request body must be a JSON object.");
  }

  return value as Record<string, unknown>;
}

export function requiredString(
  body: Record<string, unknown>,
  key: string,
  maxLength: number,
  options: { optional?: boolean } = {},
): string | null {
  const value = body[key];
  if (value === undefined || value === null || value === "") {
    if (options.optional) return null;
    throw new HttpError(400, `${key} is required.`);
  }
  if (typeof value !== "string" || value.trim().length === 0 || value.length > maxLength) {
    throw new HttpError(400, `${key} must be a non-empty string of at most ${maxLength} characters.`);
  }
  return value.trim();
}

export function optionalString(
  body: Record<string, unknown>,
  key: string,
  maxLength: number,
): string | null {
  return requiredString(body, key, maxLength, { optional: true });
}

export function positiveInteger(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, `${label} must be a positive integer.`);
  }
  return parsed;
}

export function positiveNumber(value: unknown, label: string): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new HttpError(400, `${label} must be greater than zero.`);
  }
  return parsed;
}

export function validDate(value: unknown, label: string, optional = false): string | null {
  if ((value === undefined || value === null || value === "") && optional) return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new HttpError(400, `${label} must be a date in YYYY-MM-DD format.`);
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
    throw new HttpError(400, `${label} is not a valid date.`);
  }
  return value;
}

export function validTime(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value)) {
    throw new HttpError(400, `${label} must be a valid 24-hour time.`);
  }
  return value.length === 5 ? `${value}:00` : value;
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { error: error.message, ...(error.code ? { code: error.code } : {}) },
      { status: error.status },
    );
  }

  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "ER_DUP_ENTRY"
  ) {
    return NextResponse.json({ error: "That record already exists." }, { status: 409 });
  }

  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    ["ER_CHECK_CONSTRAINT_VIOLATED", "ER_NO_REFERENCED_ROW_2"].includes(String(error.code))
  ) {
    return NextResponse.json(
      { error: "The requested data violates a database constraint." },
      { status: 400 },
    );
  }

  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "ER_SIGNAL_EXCEPTION"
  ) {
    const message =
      "message" in error && typeof error.message === "string"
        ? error.message
        : "The requested data violates a database rule.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  console.error("API request failed:", error);
  return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
}
