import { getRuntimeBindings } from "@/db";

export type AdminAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; message: string };

function bearerToken(request: Request): string {
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer[ \t]+(.+)$/i);
  return match?.[1]?.trim() ?? "";
}

async function sha256(value: string): Promise<Uint8Array> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return new Uint8Array(digest);
}

function equalDigest(left: Uint8Array, right: Uint8Array): boolean {
  let difference = left.length ^ right.length;
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }

  return difference === 0;
}

/**
 * Admin authentication deliberately uses an Authorization header rather than
 * cookies. That keeps the key out of URLs and avoids ambient browser
 * credentials on mutation requests.
 */
export async function verifyAdminRequest(
  request: Request,
): Promise<AdminAuthResult> {
  const configuredToken = getRuntimeBindings().ADMIN_TOKEN?.trim() ?? "";
  if (!configuredToken) {
    return {
      ok: false,
      status: 503,
      message: "ADMIN_TOKEN chưa được cấu hình trên máy chủ.",
    };
  }

  const suppliedToken = bearerToken(request);

  // Both inputs are reduced to fixed-size digests before comparison. This is
  // not a replacement for platform-native timingSafeEqual, but avoids early
  // exits based on a matching prefix or the original token length.
  const [suppliedDigest, configuredDigest] = await Promise.all([
    sha256(suppliedToken),
    sha256(configuredToken),
  ]);

  if (!suppliedToken || !equalDigest(suppliedDigest, configuredDigest)) {
    return {
      ok: false,
      status: 401,
      message: "Khóa truy cập không đúng hoặc đã hết hiệu lực.",
    };
  }

  return { ok: true };
}
