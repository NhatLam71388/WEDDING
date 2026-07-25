import { getDatabase, getRuntimeBindings } from "@/db";
import {
  createSafeUuid,
  hashClientIp,
  hasSupportedJsonContentType,
  readLimitedJson,
} from "@/lib/security";
import {
  publicApiJson,
  publicApiOptions,
} from "@/lib/public-api-cors";
import { validateRsvpInput } from "@/lib/validation";

const RSVP_RATE_LIMIT = 3;
const RSVP_RATE_WINDOW_MS = 10 * 60_000;

export const dynamic = "force-dynamic";

export function OPTIONS(request: Request): Response {
  return publicApiOptions(request, "POST, OPTIONS");
}

export async function POST(request: Request): Promise<Response> {
  if (!hasSupportedJsonContentType(request)) {
    return publicApiJson(
      request,
      { error: "Yêu cầu phải sử dụng định dạng JSON." },
      415,
      "POST, OPTIONS",
    );
  }
  const body = await readLimitedJson(request);
  if (!body.ok) {
    return publicApiJson(
      request,
      { error: body.error },
      body.status,
      "POST, OPTIONS",
    );
  }

  const validated = validateRsvpInput(body.value);
  if (!validated.ok) {
    return publicApiJson(
      request,
      { error: validated.error, field: validated.field },
      400,
      "POST, OPTIONS",
    );
  }

  try {
    const bindings = getRuntimeBindings();
    const ipHash = await hashClientIp(
      request,
      bindings.RATE_LIMIT_SALT ?? "",
      "rsvp",
    );
    const createdAt = Date.now();
    const rsvp = {
      id: createSafeUuid(),
      ...validated.value,
      ipHash,
      createdAt,
    };

    const inserted = await getDatabase().insertRsvpWithinLimit(
      rsvp,
      createdAt - RSVP_RATE_WINDOW_MS,
      RSVP_RATE_LIMIT,
    );

    if (!inserted) {
      return publicApiJson(
        request,
        {
          error:
            "Bạn đã gửi xác nhận quá nhiều lần. Vui lòng thử lại sau 10 phút.",
        },
        429,
        "POST, OPTIONS",
        { "Retry-After": "600" },
      );
    }

    return publicApiJson(
      request,
      {
        success: true,
        message: "Cảm ơn bạn đã xác nhận tham dự.",
        rsvp: getDatabase().toPublicRsvp(rsvp),
      },
      201,
      "POST, OPTIONS",
    );
  } catch {
    return publicApiJson(
      request,
      { error: "Không thể gửi xác nhận lúc này. Vui lòng thử lại sau." },
      503,
      "POST, OPTIONS",
    );
  }
}
