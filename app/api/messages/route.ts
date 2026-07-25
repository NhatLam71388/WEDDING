import { getDatabase, getRuntimeBindings } from "@/db";
import {
  createSafeUuid,
  hashClientIp,
  hasSupportedJsonContentType,
  noStoreJson,
  readLimitedJson,
} from "@/lib/security";
import { validateMessageInput } from "@/lib/validation";

const MESSAGE_RATE_LIMIT = 5;
const MESSAGE_RATE_WINDOW_MS = 60_000;

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const messages = await getDatabase().listVisibleMessages(12);
    return noStoreJson({ messages });
  } catch {
    return noStoreJson(
      { error: "Không thể tải lời chúc lúc này. Vui lòng thử lại sau." },
      503,
    );
  }
}

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

  const validated = validateMessageInput(body.value);
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
      "messages",
    );
    const createdAt = Date.now();
    const message = {
      id: createSafeUuid(),
      ...validated.value,
      ipHash,
      createdAt,
    };

    const inserted = await getDatabase().insertMessageWithinLimit(
      message,
      createdAt - MESSAGE_RATE_WINDOW_MS,
      MESSAGE_RATE_LIMIT,
    );

    if (!inserted) {
      return noStoreJson(
        {
          error:
            "Bạn đã gửi quá nhiều lời chúc. Vui lòng đợi một phút rồi thử lại.",
        },
        429,
        { "Retry-After": "60" },
      );
    }

    return noStoreJson(
      {
        success: true,
        message: getDatabase().toPublicMessage(message),
      },
      201,
    );
  } catch {
    return noStoreJson(
      { error: "Không thể gửi lời chúc lúc này. Vui lòng thử lại sau." },
      503,
    );
  }
}
