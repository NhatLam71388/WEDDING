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
import { validateMessageInput } from "@/lib/validation";

const MESSAGE_RATE_LIMIT = 5;
const MESSAGE_RATE_WINDOW_MS = 60_000;

export const dynamic = "force-dynamic";

export function OPTIONS(request: Request): Response {
  return publicApiOptions(request, "GET, POST, OPTIONS");
}

export async function GET(request: Request): Promise<Response> {
  try {
    const messages = await getDatabase().listVisibleMessages(12);
    return publicApiJson(request, { messages });
  } catch {
    return publicApiJson(
      request,
      { error: "Không thể tải lời chúc lúc này. Vui lòng thử lại sau." },
      503,
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!hasSupportedJsonContentType(request)) {
    return publicApiJson(
      request,
      { error: "Yêu cầu phải sử dụng định dạng JSON." },
      415,
    );
  }
  const body = await readLimitedJson(request);
  if (!body.ok) {
    return publicApiJson(request, { error: body.error }, body.status);
  }

  const validated = validateMessageInput(body.value);
  if (!validated.ok) {
    return publicApiJson(
      request,
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
      return publicApiJson(
        request,
        {
          error:
            "Bạn đã gửi quá nhiều lời chúc. Vui lòng đợi một phút rồi thử lại.",
        },
        429,
        "GET, POST, OPTIONS",
        { "Retry-After": "60" },
      );
    }

    return publicApiJson(
      request,
      {
        success: true,
        message: getDatabase().toPublicMessage(message),
      },
      201,
    );
  } catch {
    return publicApiJson(
      request,
      { error: "Không thể gửi lời chúc lúc này. Vui lòng thử lại sau." },
      503,
    );
  }
}
