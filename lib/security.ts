const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const NO_STORE_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
  Expires: "0",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
};

function getClientAddress(request: Request): string {
  // Cloudflare sets this header at the edge. The fallbacks only make local
  // development and tests usable.
  const cloudflareAddress = request.headers.get("cf-connecting-ip")?.trim();
  if (cloudflareAddress) {
    return cloudflareAddress.slice(0, 128);
  }

  const forwardedAddress = request.headers
    .get("x-forwarded-for")
    ?.split(",", 1)[0]
    ?.trim();
  if (forwardedAddress) {
    return forwardedAddress.slice(0, 128);
  }

  const realAddress = request.headers.get("x-real-ip")?.trim();
  return realAddress ? realAddress.slice(0, 128) : "unknown";
}

function bytesToHex(bytes: Uint8Array): string {
  let output = "";
  for (const byte of bytes) {
    output += byte.toString(16).padStart(2, "0");
  }
  return output;
}

/**
 * Produces a one-way, endpoint-scoped IP identifier. The raw address is never
 * persisted or returned to a caller.
 */
export async function hashClientIp(
  request: Request,
  salt: string,
  scope: "messages" | "rsvp",
): Promise<string> {
  if (!salt.trim()) {
    throw new Error("RATE_LIMIT_SALT is not configured");
  }

  const address = getClientAddress(request);
  const encoded = new TextEncoder().encode(
    `${salt}\u0000${scope}\u0000${address}`,
  );
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return bytesToHex(new Uint8Array(digest));
}

export function createSafeUuid(): string {
  const id = crypto.randomUUID();
  if (!UUID_V4_PATTERN.test(id)) {
    throw new Error("The runtime returned an invalid UUID");
  }
  return id;
}

export function hasSupportedJsonContentType(request: Request): boolean {
  const contentType = request.headers.get("content-type");
  return Boolean(
    contentType &&
      (contentType.toLowerCase().startsWith("application/json") ||
        contentType.toLowerCase().includes("+json")),
  );
}

export function isRequestBodyTooLarge(
  request: Request,
  maximumBytes = 4_096,
): boolean {
  const value = request.headers.get("content-length");
  if (!value) return false;
  const length = Number(value);
  return Number.isFinite(length) && length > maximumBytes;
}

export type LimitedJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413; error: string };

/**
 * Reads JSON with an actual streamed byte ceiling instead of trusting the
 * optional Content-Length header supplied by the caller.
 */
export async function readLimitedJson(
  request: Request,
  maximumBytes = 4_096,
): Promise<LimitedJsonResult> {
  if (isRequestBodyTooLarge(request, maximumBytes)) {
    return {
      ok: false,
      status: 413,
      error: "Dữ liệu gửi lên quá lớn.",
    };
  }

  if (!request.body) {
    return {
      ok: false,
      status: 400,
      error: "Dữ liệu JSON không hợp lệ.",
    };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maximumBytes) {
        await reader.cancel();
        return {
          ok: false,
          status: 413,
          error: "Dữ liệu gửi lên quá lớn.",
        };
      }
      chunks.push(value);
    }

    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { ok: true, value: JSON.parse(source) as unknown };
  } catch {
    return {
      ok: false,
      status: 400,
      error: "Dữ liệu JSON không hợp lệ.",
    };
  } finally {
    reader.releaseLock();
  }
}

export function noStoreJson(
  payload: unknown,
  status = 200,
  extraHeaders?: HeadersInit,
): Response {
  const headers = new Headers(extraHeaders);
  for (const [name, value] of Object.entries(NO_STORE_HEADERS)) {
    headers.set(name, value);
  }
  return new Response(JSON.stringify(payload), { status, headers });
}
