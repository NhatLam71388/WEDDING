import { getRuntimeBindings } from "@/db";
import { verifyAdminRequest } from "@/lib/admin-auth";
import {
  createSpreadsheet,
  spreadsheetDate,
  type SpreadsheetCell,
  type SpreadsheetColumn,
  type SpreadsheetDateCell,
} from "@/lib/xlsx";

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

function dateForSpreadsheet(timestamp: number): SpreadsheetDateCell | string {
  const date = new Date(Number(timestamp));
  if (!Number.isFinite(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";
  const display =
    `${value("day")}/${value("month")}/${value("year")} ` +
    `${value("hour")}:${value("minute")}:${value("second")}`;
  return spreadsheetDate(Number(timestamp), display);
}

const CSV_DELIMITER = ";";
const MAX_CSV_ROWS = 10_000;
const MAX_XLSX_ROWS = 250;

function protectCsvCell(value: SpreadsheetCell): string {
  let text = String(
    value && typeof value === "object" && value.kind === "date"
      ? value.display
      : (value ?? ""),
  );
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replaceAll('"', '""')}"`;
}

function csvRow(values: SpreadsheetCell[]): string {
  return values.map(protectCsvCell).join(CSV_DELIMITER);
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
  const format = url.searchParams.get("format") || "csv";
  if (type !== "rsvps" && type !== "messages") {
    return json(
      { error: "Loại dữ liệu xuất phải là rsvps hoặc messages." },
      400,
    );
  }
  if (format !== "csv" && format !== "xlsx") {
    return json(
      { error: "Định dạng xuất phải là csv hoặc xlsx." },
      400,
    );
  }

  try {
    const database = getRuntimeBindings().DB;
    const exportLimit =
      format === "xlsx" ? MAX_XLSX_ROWS : MAX_CSV_ROWS;
    let sheetName: string;
    let columns: SpreadsheetColumn[];
    let rows: SpreadsheetCell[][];
    let filenameBase: string;

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
           LIMIT ?`,
        )
        .bind(exportLimit)
        .all<ExportRsvpRow>();

      rows = result.results.map((row: ExportRsvpRow) => [
        row.id,
        row.name,
        row.attend === "yes" ? "Tham dự" : "Không tham dự",
        row.guest_count,
        row.side === "groom" ? "Nhà trai" : "Nhà gái",
        dateForSpreadsheet(row.created_at),
      ]);
      sheetName = "Xác nhận tham dự";
      columns = [
        { header: "Mã phản hồi", width: 42 },
        { header: "Họ tên", width: 28 },
        { header: "Trạng thái", width: 20 },
        { header: "Số khách", width: 12 },
        { header: "Phía gia đình", width: 18 },
        { header: "Thời gian gửi", width: 24 },
      ];
      filenameBase = "xac-nhan-tham-du";
    } else {
      const result = await database
        .prepare(
          `SELECT id, name, body, is_visible, created_at
           FROM messages
           ORDER BY created_at DESC, id DESC
           LIMIT ?`,
        )
        .bind(exportLimit)
        .all<ExportMessageRow>();

      rows = result.results.map((row: ExportMessageRow) => [
        row.id,
        row.name,
        row.body,
        Number(row.is_visible) === 1 ? "Có" : "Đã ẩn",
        dateForSpreadsheet(row.created_at),
      ]);
      sheetName = "Lời chúc";
      columns = [
        { header: "Mã lời chúc", width: 42 },
        { header: "Họ tên", width: 28 },
        { header: "Lời chúc", width: 60 },
        { header: "Đang hiển thị", width: 18 },
        { header: "Thời gian gửi", width: 24 },
      ];
      filenameBase = "loi-chuc";
    }

    if (format === "csv") {
      const csv = [
        csvRow(columns.map((column) => column.header)),
        ...rows.map(csvRow),
      ].join("\r\n");
      return new Response(`\uFEFF${csv}`, {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          "Content-Disposition": `attachment; filename="${filenameBase}.csv"`,
          "Content-Type": "text/csv; charset=utf-8",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const workbook = createSpreadsheet({ sheetName, columns, rows });
    return new Response(workbook, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Content-Disposition": `attachment; filename="${filenameBase}.xlsx"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
