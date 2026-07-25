import { getDatabase, getRuntimeBindings } from "@/db";
import {
  createSafeUuid,
  hashClientIp,
  hasSupportedJsonContentType,
  noStoreJson,
  readLimitedJson,
} from "@/lib/security";
import { validateRsvpInput } from "@/lib/validation";

const RSVP_RATE_LIMIT = 3;
const RSVP_RATE_WINDOW_MS = 10 * 60_000;

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  if (!hasSupportedJsonContentType(request)) {
    return noStoreJson(
      { error: "Yêu cầu phải sử dụng định dạng JSON." },
      415,
    );
  }
  const body = await readLimitedJson(request);
  if (!body.ok) {
    return noStoreJson({ error: body.error }, body.status);
  }

  const validated = validateRsvpInput(body.value);
  if (!validated.ok) {
    return noStoreJson(
      { error: validated.error, field: validated.field },
      400,
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
      return noStoreJson(
        {
          error:
            "Bạn đã gửi xác nhận quá nhiều lần. Vui lòng thử lại sau 10 phút.",
        },
        429,
        { "Retry-After": "600" },
      );
    }

    return noStoreJson(
      {
        success: true,
        message: "Cảm ơn bạn đã xác nhận tham dự.",
        rsvp: getDatabase().toPublicRsvp(rsvp),
      },
      201,
    );
  } catch {
    return noStoreJson(
      { error: "Không thể gửi xác nhận lúc này. Vui lòng thử lại sau." },
      503,
    );
  }
}
