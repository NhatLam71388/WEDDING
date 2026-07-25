import { getRuntimeBindings } from "@/db";
import { verifyAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const JSON_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
  Expires: "0",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
};

interface MessageStatsRow {
  total: number;
  visible: number;
  hidden: number;
}

interface RsvpStatsRow {
  total_responses: number;
  attending_responses: number;
  declined_responses: number;
  attending_guests: number;
  groom_guests: number;
  bride_guests: number;
}

interface AdminMessageRow {
  id: string;
  name: string;
  body: string;
  is_visible: number;
  created_at: number;
}

interface AdminRsvpRow {
  id: string;
  name: string;
  guest_count: number;
  attend: "yes" | "no";
  side: "groom" | "bride";
  created_at: number;
}

function json(payload: unknown, status = 200, headers?: HeadersInit): Response {
  const responseHeaders = new Headers(headers);
  for (const [name, value] of Object.entries(JSON_HEADERS)) {
    responseHeaders.set(name, value);
  }
  return new Response(JSON.stringify(payload), {
    status,
    headers: responseHeaders,
  });
}

function asNumber(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function isAdminId(value: unknown): value is string {
  return typeof value === "string" && value.length >= 1 && value.length <= 100;
}

// Every admin mutation targets exactly one row, so they share the same shape:
// run the statement, treat "no rows changed" as a 404 rather than a silent
// success, and never leak the underlying database error to the client.
async function runWrite({
  statement,
  bindings,
  missing,
  failure,
  result,
}: {
  statement: string;
  bindings: (string | number)[];
  missing: string;
  failure: string;
  result: Record<string, unknown>;
}): Promise<Response> {
  try {
    const outcome = await getRuntimeBindings()
      .DB.prepare(statement)
      .bind(...bindings)
      .run();

    if (Number(outcome.meta?.changes ?? 0) !== 1) {
      return json({ error: missing }, 404);
    }

    return json({ success: true, ...result });
  } catch {
    return json({ error: failure }, 503);
  }
}

async function authError(request: Request): Promise<Response | null> {
  try {
    const auth = await verifyAdminRequest(request);
    if (auth.ok) return null;

    return json(
      { error: auth.message },
      auth.status,
      auth.status === 401
        ? { "WWW-Authenticate": 'Bearer realm="Wedding admin"' }
        : undefined,
    );
  } catch {
    return json(
      { error: "Không thể kiểm tra quyền quản trị lúc này." },
      503,
    );
  }
}

export async function GET(request: Request): Promise<Response> {
  const denied = await authError(request);
  if (denied) return denied;

  try {
    const database = getRuntimeBindings().DB;
    const [
      messageStatsResult,
      rsvpStatsResult,
      latestMessagesResult,
      latestRsvpsResult,
    ] = await Promise.all([
      database
        .prepare(
          `SELECT
             COUNT(*) AS total,
             COALESCE(SUM(CASE WHEN is_visible = 1 THEN 1 ELSE 0 END), 0) AS visible,
             COALESCE(SUM(CASE WHEN is_visible = 0 THEN 1 ELSE 0 END), 0) AS hidden
           FROM messages`,
        )
        .first<MessageStatsRow>(),
      database
        .prepare(
          `WITH latest_rsvps AS (
             SELECT response.*
             FROM rsvps AS response
             WHERE substr(response.id, 1, 5) = 'rsvp_'
                OR NOT EXISTS (
                  SELECT 1
                  FROM rsvps AS newer
                  WHERE substr(newer.id, 1, 5) <> 'rsvp_'
                    AND newer.ip_hash = response.ip_hash
                    AND lower(trim(newer.name)) = lower(trim(response.name))
                    AND newer.side = response.side
                    AND (
                      newer.created_at > response.created_at
                      OR (
                        newer.created_at = response.created_at
                        AND newer.id > response.id
                      )
                    )
                )
           )
           SELECT
             COUNT(*) AS total_responses,
             COALESCE(SUM(CASE WHEN attend = 'yes' THEN 1 ELSE 0 END), 0)
               AS attending_responses,
             COALESCE(SUM(CASE WHEN attend = 'no' THEN 1 ELSE 0 END), 0)
               AS declined_responses,
             COALESCE(SUM(CASE WHEN attend = 'yes' THEN guest_count ELSE 0 END), 0)
               AS attending_guests,
             COALESCE(SUM(
               CASE WHEN attend = 'yes' AND side = 'groom' THEN guest_count ELSE 0 END
             ), 0) AS groom_guests,
             COALESCE(SUM(
               CASE WHEN attend = 'yes' AND side = 'bride' THEN guest_count ELSE 0 END
             ), 0) AS bride_guests
           FROM latest_rsvps`,
        )
        .first<RsvpStatsRow>(),
      database
        .prepare(
          `SELECT id, name, body, is_visible, created_at
           FROM messages
           ORDER BY created_at DESC, id DESC
           LIMIT 40`,
        )
        .all<AdminMessageRow>(),
      database
        .prepare(
          `WITH latest_rsvps AS (
             SELECT response.*
             FROM rsvps AS response
             WHERE substr(response.id, 1, 5) = 'rsvp_'
                OR NOT EXISTS (
                  SELECT 1
                  FROM rsvps AS newer
                  WHERE substr(newer.id, 1, 5) <> 'rsvp_'
                    AND newer.ip_hash = response.ip_hash
                    AND lower(trim(newer.name)) = lower(trim(response.name))
                    AND newer.side = response.side
                    AND (
                      newer.created_at > response.created_at
                      OR (
                        newer.created_at = response.created_at
                        AND newer.id > response.id
                      )
                    )
                )
           )
           SELECT id, name, guest_count, attend, side, created_at
           FROM latest_rsvps
           ORDER BY created_at DESC, id DESC
           LIMIT 40`,
        )
        .all<AdminRsvpRow>(),
    ]);

    const messageStats = messageStatsResult ?? {
      total: 0,
      visible: 0,
      hidden: 0,
    };
    const rsvpStats = rsvpStatsResult ?? {
      total_responses: 0,
      attending_responses: 0,
      declined_responses: 0,
      attending_guests: 0,
      groom_guests: 0,
      bride_guests: 0,
    };

    return json({
      generatedAt: new Date().toISOString(),
      stats: {
        messages: {
          total: asNumber(messageStats.total),
          visible: asNumber(messageStats.visible),
          hidden: asNumber(messageStats.hidden),
        },
        rsvps: {
          totalResponses: asNumber(rsvpStats.total_responses),
          attendingResponses: asNumber(rsvpStats.attending_responses),
          declinedResponses: asNumber(rsvpStats.declined_responses),
          attendingGuests: asNumber(rsvpStats.attending_guests),
          groomGuests: asNumber(rsvpStats.groom_guests),
          brideGuests: asNumber(rsvpStats.bride_guests),
        },
      },
      messages: latestMessagesResult.results.map((row: AdminMessageRow) => ({
        id: row.id,
        name: row.name,
        body: row.body,
        visible: asNumber(row.is_visible) === 1,
        createdAt: asNumber(row.created_at),
      })),
      rsvps: latestRsvpsResult.results.map((row: AdminRsvpRow) => ({
        id: row.id,
        name: row.name,
        guestCount: asNumber(row.guest_count),
        attend: row.attend,
        side: row.side,
        createdAt: asNumber(row.created_at),
      })),
    });
  } catch {
    return json(
      { error: "Không thể tải dữ liệu quản trị. Vui lòng thử lại sau." },
      503,
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  const denied = await authError(request);
  if (denied) return denied;

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    return json({ error: "Yêu cầu phải sử dụng định dạng JSON." }, 415);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 1_024) {
    return json({ error: "Dữ liệu gửi lên quá lớn." }, 413);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Dữ liệu JSON không hợp lệ." }, 400);
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    !("action" in payload) ||
    !("id" in payload) ||
    !isAdminId(payload.id)
  ) {
    return json({ error: "Yêu cầu cập nhật không hợp lệ." }, 400);
  }

  const { action, id } = payload;

  if (action === "set-message-visibility") {
    if (!("visible" in payload) || typeof payload.visible !== "boolean") {
      return json({ error: "Yêu cầu cập nhật không hợp lệ." }, 400);
    }

    return runWrite({
      statement: "UPDATE messages SET is_visible = ? WHERE id = ?",
      bindings: [payload.visible ? 1 : 0, id],
      missing: "Không tìm thấy lời chúc cần cập nhật.",
      failure: "Không thể cập nhật lời chúc. Vui lòng thử lại sau.",
      result: { id, visible: payload.visible },
    });
  }

  if (action === "delete-message") {
    return runWrite({
      statement: "DELETE FROM messages WHERE id = ?",
      bindings: [id],
      missing: "Không tìm thấy lời chúc cần xoá.",
      failure: "Không thể xoá lời chúc. Vui lòng thử lại sau.",
      result: { id, deleted: true },
    });
  }

  if (action === "delete-rsvp") {
    return runWrite({
      statement: "DELETE FROM rsvps WHERE id = ?",
      bindings: [id],
      missing: "Không tìm thấy xác nhận cần xoá.",
      failure: "Không thể xoá xác nhận. Vui lòng thử lại sau.",
      result: { id, deleted: true },
    });
  }

  return json({ error: "Yêu cầu cập nhật không hợp lệ." }, 400);
}
