import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "validation_error"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "internal_error";

const STATUS: Record<ApiErrorCode, number> = {
  validation_error: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  internal_error: 500,
};

export function apiError(code: ApiErrorCode, message: string) {
  return NextResponse.json({ error: { code, message } }, { status: STATUS[code] });
}