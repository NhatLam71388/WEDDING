export const MESSAGE_NAME_MAX_LENGTH = 60;
export const MESSAGE_BODY_MAX_LENGTH = 400;
export const RSVP_NAME_MAX_LENGTH = 60;
export const RSVP_COUNT_MAX = 20;
export const RSVP_RESPONSE_ID_PATTERN =
  /^rsvp_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AttendChoice = "yes" | "no";
export type GuestSide = "groom" | "bride";

export interface MessageInput {
  name: string;
  body: string;
}

export interface RsvpInput {
  name: string;
  count: number;
  attend: AttendChoice;
  side: GuestSide;
  responseId?: string;
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; field?: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function containsControlCharacters(value: string, allowNewlines: boolean) {
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    if (
      code === 0x7f ||
      (code < 0x20 &&
        !(allowNewlines && (character === "\n" || character === "\t")))
    ) {
      return true;
    }
  }
  return false;
}

function normalizeSingleLine(value: string): string {
  return value.normalize("NFC").replace(/\s+/gu, " ").trim();
}

function normalizeMessageBody(value: string): string {
  return value
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[^\S\n]+/gu, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function characterLength(value: string): number {
  return Array.from(value).length;
}

/**
 * The hidden field is intentionally accepted under two common names so an
 * older cached invitation still gets bot protection after a frontend update.
 */
function honeypotWasFilled(payload: Record<string, unknown>): boolean {
  return ["website", "_honeypot"].some((key) => {
    const value = payload[key];
    return typeof value === "string" && value.trim().length > 0;
  });
}

export function validateMessageInput(
  payload: unknown,
): ValidationResult<MessageInput> {
  if (!isObject(payload)) {
    return { ok: false, error: "Dữ liệu gửi lên không hợp lệ." };
  }
  if (honeypotWasFilled(payload)) {
    return { ok: false, error: "Không thể gửi biểu mẫu này." };
  }
  if (typeof payload.name !== "string") {
    return {
      ok: false,
      error: "Vui lòng nhập tên của bạn.",
      field: "name",
    };
  }
  if (typeof payload.body !== "string") {
    return {
      ok: false,
      error: "Vui lòng nhập lời chúc.",
      field: "body",
    };
  }

  if (
    containsControlCharacters(payload.name, false) ||
    containsControlCharacters(payload.body, true)
  ) {
    return { ok: false, error: "Nội dung chứa ký tự không hợp lệ." };
  }

  const name = normalizeSingleLine(payload.name);
  const body = normalizeMessageBody(payload.body);

  if (!name) {
    return {
      ok: false,
      error: "Vui lòng nhập tên của bạn.",
      field: "name",
    };
  }
  if (characterLength(name) > MESSAGE_NAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `Tên không được dài quá ${MESSAGE_NAME_MAX_LENGTH} ký tự.`,
      field: "name",
    };
  }
  if (!body) {
    return {
      ok: false,
      error: "Vui lòng nhập lời chúc.",
      field: "body",
    };
  }
  if (characterLength(body) > MESSAGE_BODY_MAX_LENGTH) {
    return {
      ok: false,
      error: `Lời chúc không được dài quá ${MESSAGE_BODY_MAX_LENGTH} ký tự.`,
      field: "body",
    };
  }

  return { ok: true, value: { name, body } };
}

export function validateRsvpInput(
  payload: unknown,
): ValidationResult<RsvpInput> {
  if (!isObject(payload)) {
    return { ok: false, error: "Dữ liệu gửi lên không hợp lệ." };
  }
  if (honeypotWasFilled(payload)) {
    return { ok: false, error: "Không thể gửi biểu mẫu này." };
  }
  if (typeof payload.name !== "string") {
    return {
      ok: false,
      error: "Vui lòng nhập họ và tên.",
      field: "name",
    };
  }
  if (containsControlCharacters(payload.name, false)) {
    return {
      ok: false,
      error: "Họ và tên chứa ký tự không hợp lệ.",
      field: "name",
    };
  }

  const name = normalizeSingleLine(payload.name);
  if (!name) {
    return {
      ok: false,
      error: "Vui lòng nhập họ và tên.",
      field: "name",
    };
  }
  if (characterLength(name) > RSVP_NAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `Họ và tên không được dài quá ${RSVP_NAME_MAX_LENGTH} ký tự.`,
      field: "name",
    };
  }

  if (payload.attend !== "yes" && payload.attend !== "no") {
    return {
      ok: false,
      error: "Vui lòng chọn có hoặc không tham dự.",
      field: "attend",
    };
  }
  if (payload.side !== "groom" && payload.side !== "bride") {
    return {
      ok: false,
      error: "Vui lòng chọn bạn là khách của nhà trai hoặc nhà gái.",
      field: "side",
    };
  }

  let responseId: string | undefined;
  if ("responseId" in payload) {
    if (typeof payload.responseId !== "string") {
      return {
        ok: false,
        error: "Mã xác nhận tham dự không hợp lệ.",
        field: "responseId",
      };
    }

    responseId = payload.responseId.trim().toLowerCase();
    if (!RSVP_RESPONSE_ID_PATTERN.test(responseId)) {
      return {
        ok: false,
        error: "Mã xác nhận tham dự không hợp lệ.",
        field: "responseId",
      };
    }
  }

  const parsedCount =
    typeof payload.count === "number"
      ? payload.count
      : typeof payload.count === "string" && payload.count.trim() !== ""
        ? Number(payload.count)
        : Number.NaN;

  if (!Number.isInteger(parsedCount)) {
    return {
      ok: false,
      error: "Số lượng khách tham dự không hợp lệ.",
      field: "count",
    };
  }

  if (
    (payload.attend === "yes" &&
      (parsedCount < 1 || parsedCount > RSVP_COUNT_MAX)) ||
    (payload.attend === "no" &&
      (parsedCount < 0 || parsedCount > RSVP_COUNT_MAX))
  ) {
    return {
      ok: false,
      error:
        payload.attend === "yes"
          ? `Số lượng khách phải từ 1 đến ${RSVP_COUNT_MAX}.`
          : `Số lượng khách phải từ 0 đến ${RSVP_COUNT_MAX}.`,
      field: "count",
    };
  }

  return {
    ok: true,
    value: {
      name,
      count: payload.attend === "no" ? 0 : parsedCount,
      attend: payload.attend,
      side: payload.side,
      ...(responseId ? { responseId } : {}),
    },
  };
}
