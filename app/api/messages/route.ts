import {
  getDatabase,
  getRuntimeBindings,
  type MessageCursor,
} from "@/db";
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
const MESSAGE_PAGE_SIZE = 12;
const MESSAGE_PAGE_SIZE_MAX = 24;
const MESSAGE_CURSOR_MAX_LENGTH = 256;
const MESSAGE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const dynamic = "force-dynamic";

export function OPTIONS(request: Request): Response {
  return publicApiOptions(request, "GET, POST, OPTIONS");
}

function encodeCursor(cursor: MessageCursor): string {
  return btoa(JSON.stringify([cursor.createdAt, cursor.id]))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeCursor(value: string): MessageCursor | null {
  if (
    !value ||
    value.length > MESSAGE_CURSOR_MAX_LENGTH ||
    !/^[A-Za-z0-9_-]+$/.test(value)
  ) {
    return null;
  }

  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const decoded: unknown = JSON.parse(atob(base64 + padding));
    if (
      !Array.isArray(decoded) ||
      decoded.length !== 2 ||
      !Number.isSafeInteger(decoded[0]) ||
      decoded[0] < 0 ||
      typeof decoded[1] !== "string" ||
      !MESSAGE_ID_PATTERN.test(decoded[1])
    ) {
      return null;
    }
    return { createdAt: decoded[0], id: decoded[1] };
  } catch {
    return null;
  }
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const rawLimit = url.searchParams.get("limit");
  let limit = MESSAGE_PAGE_SIZE;
  if (rawLimit !== null) {
    if (!/^[1-9]\d*$/.test(rawLimit)) {
      return publicApiJson(
        request,
        { error: "Kích thước trang không hợp lệ.", field: "limit" },
        400,
      );
    }
    const parsedLimit = Number(rawLimit);
    if (!Number.isSafeInteger(parsedLimit)) {
      return publicApiJson(
        request,
        { error: "Kích thước trang không hợp lệ.", field: "limit" },
        400,
      );
    }
    limit = Math.min(MESSAGE_PAGE_SIZE_MAX, parsedLimit);
  }

  const rawCursor = url.searchParams.get("cursor");
  let cursor: MessageCursor | undefined;
  if (rawCursor !== null) {
    const decodedCursor = decodeCursor(rawCursor);
    if (!decodedCursor) {
      return publicApiJson(
        request,
        { error: "Con trỏ phân trang không hợp lệ.", field: "cursor" },
        400,
      );
    }
    cursor = decodedCursor;
  }

  try {
    const page = await getDatabase().listVisibleMessages(limit, cursor);
    return publicApiJson(request, {
      messages: page.messages,
      nextCursor: page.nextCursor ? encodeCursor(page.nextCursor) : null,
      hasMore: page.hasMore,
    });
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
