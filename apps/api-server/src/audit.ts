import { useDatabase } from "@nawadi/core";
import { schema as s } from "@nawadi/db";

export interface AuditLogInput {
  oauthClientId: string | null;
  vaarschoolId: string | null;
  requestId: string | null;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  requestBody?: unknown;
  responseBody?: unknown;
  errorCode?: string | null;
}

const MAX_BODY_BYTES = 10_000;

function truncate(value: unknown): unknown {
  if (value == null) return null;
  try {
    const json = JSON.stringify(value);
    if (json.length <= MAX_BODY_BYTES) {
      return value;
    }
    return { __truncated: true, preview: json.slice(0, MAX_BODY_BYTES) };
  } catch {
    return null;
  }
}

export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  try {
    const db = useDatabase();
    await db.insert(s.apiAuditLog).values({
      oauthClientId: input.oauthClientId,
      vaarschoolId: input.vaarschoolId,
      requestId: input.requestId,
      method: input.method,
      path: input.path,
      status: input.status,
      durationMs: input.durationMs,
      requestBody: truncate(input.requestBody),
      responseBody:
        input.status >= 400 ? truncate(input.responseBody) : null,
      errorCode: input.errorCode ?? null,
    });
  } catch (err) {
    // Never let audit failure break the request
    console.error("Failed to write audit log:", err);
  }
}
