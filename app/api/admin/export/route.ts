import { getRuntimeBindings } from "@/db";
import { verifyAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

interface ExportMessageRow {
  id: string;
  name: string;
  body: string;
  is_visible: number;
  created_at: number;
}

interface ExportRsvpRow {
  id: string;
  name: string;
  guest_count: number;
  attend: "yes" | "no";
  side: "groom" | "bride";
  created_at: number;
}

function json(payload: unknown, status = 200, headers?: HeadersInit): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, max-age=0",
  );
  responseHeaders.set("Content-Type", "application/json; charset=utf-8");
  responseHeaders.set("X-Content-Type-Options", "nosniff");
  return new Response(JSON.stringify(payload), {
    status,
    headers: responseHeaders,
  });
}

function protectSpreadsheetCell(value: unknown): string {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replaceAll('"', '""')}"`;
}

const DELIMITER = ",";

// Excel splits a CSV using the list separator from the operating system locale,
// which is ";" on Vietnamese (and most European) Windows installs. A
// comma-delimited file therefore lands entirely in column A. The "sep=" line is
// a spreadsheet directive that pins the delimiter regardless of locale, so the
// export opens as real columns on any machine.
const SEPARATOR_HINT = `sep=${DELIMITER}`;

function csvRow(values: unknown[]): string {
  return values.map(protectSpreadsheetCell).join(DELIMITER);
}

function dateForCsv(timestamp: number): string {
  const date = new Date(Number(timestamp));
  if (!Number.isFinite(date.getTime())) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export async function GET(request: Request): Promise<Response> {
  let auth;
  try {
    auth = await verifyAdminRequest(request);
  } catch {
    return json(
      { error: "Không thể kiểm tra quyền quản trị lúc này." },
      503,
    );
  }

  if (!auth.ok) {
    return json(
      { error: auth.message },
      auth.status,
      auth.status === 401
        ? { "WWW-Authenticate": 'Bearer realm="Wedding admin"' }
        : undefined,
    );
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  if (type !== "rsvps" && type !== "messages") {
    return json(
      { error: "Loại dữ liệu xuất phải là rsvps hoặc messages." },
      400,
    );
  }

  try {
    const database = getRuntimeBindings().DB;
    let csv: string;
    let filename: string;

    if (type === "rsvps") {
      const result = await database
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
           LIMIT 10000`,
        )
        .all<ExportRsvpRow>();

      const rows = [
        csvRow([
          "Mã",
          "Họ tên",
          "Trạng thái",
          "Số khách",
          "Phía gia đình",
          "Thời gian gửi",
        ]),
        ...result.results.map((row: ExportRsvpRow) =>
          csvRow([
            row.id,
            row.name,
            row.attend === "yes" ? "Tham dự" : "Không tham dự",
            row.guest_count,
            row.side === "groom" ? "Nhà trai" : "Nhà gái",
            dateForCsv(row.created_at),
          ]),
        ),
      ];

      csv = rows.join("\r\n");
      filename = "xac-nhan-tham-du.csv";
    } else {
      const result = await database
        .prepare(
          `SELECT id, name, body, is_visible, created_at
           FROM messages
           ORDER BY created_at DESC, id DESC
           LIMIT 10000`,
        )
        .all<ExportMessageRow>();

      const rows = [
        csvRow([
          "Mã",
          "Họ tên",
          "Lời chúc",
          "Hiển thị",
          "Thời gian gửi",
        ]),
        ...result.results.map((row: ExportMessageRow) =>
          csvRow([
            row.id,
            row.name,
            row.body,
            Number(row.is_visible) === 1 ? "Có" : "Đã ẩn",
            dateForCsv(row.created_at),
          ]),
        ),
      ];

      csv = rows.join("\r\n");
      filename = "loi-chuc.csv";
    }

    return new Response(`\uFEFF${SEPARATOR_HINT}\r\n${csv}`, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "text/csv; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return json(
      { error: "Không thể xuất dữ liệu. Vui lòng thử lại sau." },
      503,
    );
  }
}
