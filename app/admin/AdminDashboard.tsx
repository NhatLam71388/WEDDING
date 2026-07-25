"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

interface MessageStats {
  total: number;
  visible: number;
  hidden: number;
}

interface RsvpStats {
  totalResponses: number;
  attendingResponses: number;
  declinedResponses: number;
  attendingGuests: number;
  groomGuests: number;
  brideGuests: number;
}

interface AdminMessage {
  id: string;
  name: string;
  body: string;
  visible: boolean;
  createdAt: number;
}

interface AdminRsvp {
  id: string;
  name: string;
  guestCount: number;
  attend: "yes" | "no";
  side: "groom" | "bride";
  createdAt: number;
}

interface DashboardData {
  generatedAt: string;
  stats: {
    messages: MessageStats;
    rsvps: RsvpStats;
  };
  messages: AdminMessage[];
  rsvps: AdminRsvp[];
}

class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function readError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: unknown };
    if (typeof payload.error === "string") return payload.error;
  } catch {
    // The fallback below is intentionally generic.
  }
  return "Yêu cầu không thành công. Vui lòng thử lại.";
}

async function getDashboard(accessKey: string): Promise<DashboardData> {
  const response = await fetch("/api/admin/dashboard", {
    headers: { Authorization: `Bearer ${accessKey}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new ApiError(response.status, await readError(response));
  }
  return (await response.json()) as DashboardData;
}

function formatDate(value: number | string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

// toISOString() throws on an unparseable timestamp, which would take the whole
// dashboard down with it. Omitting the attribute degrades gracefully instead.
function isoDate(value: number | string): string | undefined {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

function StatCard({
  eyebrow,
  value,
  detail,
  tone = "paper",
}: {
  eyebrow: string;
  value: number;
  detail: string;
  tone?: "paper" | "rose" | "sage" | "ink";
}) {
  return (
    <article className={`admin-stat admin-stat--${tone}`}>
      <p>{eyebrow}</p>
      <strong>{new Intl.NumberFormat("vi-VN").format(value)}</strong>
      <span>{detail}</span>
    </article>
  );
}

export default function AdminDashboard() {
  const [accessKey, setAccessKey] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyRowId, setBusyRowId] = useState("");
  const [exporting, setExporting] = useState<"" | "rsvps" | "messages">("");

  async function load(accessToken: string, quiet = false) {
    if (!quiet) setLoading(true);
    setError("");
    try {
      const dashboard = await getDashboard(accessToken);
      setData(dashboard);
      return true;
    } catch (caught) {
      const apiError =
        caught instanceof ApiError
          ? caught
          : new ApiError(
              0,
              "Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.",
            );
      setError(apiError.message);
      if (apiError.status === 401) {
        setData(null);
      }
      return false;
    } finally {
      if (!quiet) setLoading(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = accessKey.trim();
    if (!normalized) {
      setError("Vui lòng nhập khóa truy cập quản trị.");
      return;
    }

    const success = await load(normalized);
    if (success) {
      setAccessKey(normalized);
    }
  }

  function signOut() {
    setAccessKey("");
    setData(null);
    setError("");
  }

  // Every row action posts one command and then refetches, so the request,
  // busy-state and error handling live in one place.
  async function mutateRow(
    rowId: string,
    body: Record<string, unknown>,
    fallbackError: string,
  ) {
    setBusyRowId(rowId);
    setError("");
    try {
      const response = await fetch("/api/admin/dashboard", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new ApiError(response.status, await readError(response));
      }
      await load(accessKey, true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : fallbackError);
    } finally {
      setBusyRowId("");
    }
  }

  async function setMessageVisibility(message: AdminMessage) {
    if (
      message.visible &&
      !window.confirm(
        `Ẩn lời chúc của “${message.name}” khỏi trang thiệp? Bạn có thể hiện lại sau.`,
      )
    ) {
      return;
    }

    await mutateRow(
      message.id,
      {
        action: "set-message-visibility",
        id: message.id,
        visible: !message.visible,
      },
      "Không thể cập nhật lời chúc.",
    );
  }

  async function deleteMessage(message: AdminMessage) {
    if (
      !window.confirm(
        `Xoá vĩnh viễn lời chúc của “${message.name}”?\n\n` +
          "Lời chúc sẽ bị xoá khỏi hệ thống và không thể khôi phục. " +
          "Nếu chỉ muốn tạm ẩn khỏi trang thiệp, hãy chọn “Ẩn lời chúc”.",
      )
    ) {
      return;
    }

    await mutateRow(
      message.id,
      { action: "delete-message", id: message.id },
      "Không thể xoá lời chúc.",
    );
  }

  async function deleteRsvp(rsvp: AdminRsvp) {
    const side = rsvp.side === "groom" ? "nhà trai" : "nhà gái";
    if (
      !window.confirm(
        `Xoá vĩnh viễn xác nhận của “${rsvp.name}” (${side}, ${rsvp.guestCount} khách)?\n\n` +
          "Dòng này sẽ bị xoá khỏi hệ thống và không thể khôi phục. " +
          "Số liệu thống kê sẽ được tính lại.",
      )
    ) {
      return;
    }

    await mutateRow(
      rsvp.id,
      { action: "delete-rsvp", id: rsvp.id },
      "Không thể xoá xác nhận.",
    );
  }

  async function downloadCsv(type: "rsvps" | "messages") {
    setExporting(type);
    setError("");
    try {
      const response = await fetch(`/api/admin/export?type=${type}`, {
        headers: { Authorization: `Bearer ${accessKey}` },
        cache: "no-store",
      });
      if (!response.ok) {
        throw new ApiError(response.status, await readError(response));
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download =
        type === "rsvps" ? "xac-nhan-tham-du.csv" : "loi-chuc.csv";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Không thể xuất dữ liệu.",
      );
    } finally {
      setExporting("");
    }
  }

  if (!data) {
    return (
      <main className="admin-page admin-login-page">
        <section className="admin-login-card">
          <div className="admin-login-art" aria-hidden="true">
            <span className="admin-art-date">07 · 08 · 2026</span>
            <div className="admin-monogram">N<span>&</span>M</div>
            <p>Ngô Nam & Nhật Mai</p>
          </div>
          <div className="admin-login-form">
            <p className="admin-kicker">Khu vực riêng tư</p>
            <h1>Quản lý ngày vui</h1>
            <p className="admin-login-copy">
              Theo dõi khách tham dự, đọc lời chúc và xuất danh sách chuẩn bị
              cho buổi lễ.
            </p>
            <form onSubmit={handleLogin}>
              <label htmlFor="admin-access-key">Khóa truy cập</label>
              <div className="admin-key-field">
                <input
                  id="admin-access-key"
                  name="access-key"
                  type="password"
                  autoComplete="current-password"
                  value={accessKey}
                  onChange={(event) => setAccessKey(event.target.value)}
                  placeholder="Nhập khóa quản trị"
                  disabled={loading}
                  required
                  autoFocus
                />
                <span aria-hidden="true">✦</span>
              </div>
              {error ? (
                <p className="admin-error" role="alert">
                  {error}
                </p>
              ) : null}
              <button className="admin-button admin-button--primary" disabled={loading}>
                {loading ? "Đang kiểm tra…" : "Mở bảng quản trị"}
              </button>
            </form>
            <p className="admin-privacy-note">
              Khóa chỉ được giữ trong bộ nhớ của trang và không được lưu vào
              trình duyệt.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const { rsvps, messages } = data.stats;

  return (
    <main className="admin-page admin-dashboard">
      <header className="admin-topbar">
        <Link className="admin-brand" href="/" aria-label="Về trang thiệp cưới">
          <span className="admin-brand-mark">N<span>&</span>M</span>
          <span>
            <strong>Wedding desk</strong>
            <small>07.08.2026</small>
          </span>
        </Link>
        <div className="admin-top-actions">
          <button
            className="admin-button admin-button--ghost"
            type="button"
            onClick={() => void load(accessKey)}
            disabled={loading}
          >
            <span aria-hidden="true">↻</span>
            {loading ? "Đang tải…" : "Làm mới"}
          </button>
          <button
            className="admin-button admin-button--quiet"
            type="button"
            onClick={signOut}
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="admin-content">
        <section className="admin-welcome">
          <div>
            <p className="admin-kicker">Tổng quan ngày cưới</p>
            <h1>Mọi điều quan trọng,<br />ở cùng một nơi.</h1>
          </div>
          <div className="admin-welcome-meta">
            <span className="admin-live-dot" />
            Dữ liệu lúc {formatDate(data.generatedAt)}
          </div>
        </section>

        {error ? (
          <div className="admin-error admin-error--banner" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} aria-label="Đóng">
              ×
            </button>
          </div>
        ) : null}

        <section className="admin-stats" aria-label="Thống kê">
          <StatCard
            eyebrow="Khách sẽ tham dự"
            value={rsvps.attendingGuests}
            detail={`${rsvps.attendingResponses} lượt xác nhận có mặt`}
            tone="ink"
          />
          <StatCard
            eyebrow="Tổng phản hồi"
            value={rsvps.totalResponses}
            detail={`${rsvps.declinedResponses} lượt báo không tham dự`}
            tone="rose"
          />
          <StatCard
            eyebrow="Lời chúc đang hiện"
            value={messages.visible}
            detail={`${messages.hidden} lời chúc đã được ẩn`}
            tone="sage"
          />
          <StatCard
            eyebrow="Tất cả lời chúc"
            value={messages.total}
            detail="Được lưu an toàn trên hệ thống"
          />
        </section>

        <section className="admin-side-summary">
          <div>
            <span className="admin-side-icon" aria-hidden="true">N</span>
            <p><small>Khách nhà trai</small><strong>{rsvps.groomGuests}</strong></p>
          </div>
          <span className="admin-side-divider" aria-hidden="true">✦</span>
          <div>
            <span className="admin-side-icon admin-side-icon--bride" aria-hidden="true">M</span>
            <p><small>Khách nhà gái</small><strong>{rsvps.brideGuests}</strong></p>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-kicker">Danh sách mới nhất</p>
              <h2>Xác nhận tham dự</h2>
            </div>
            <button
              className="admin-button admin-button--outline"
              type="button"
              onClick={() => void downloadCsv("rsvps")}
              disabled={exporting !== ""}
            >
              <span aria-hidden="true">↓</span>
              {exporting === "rsvps" ? "Đang xuất…" : "Xuất CSV"}
            </button>
          </div>
          {data.rsvps.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Khách mời</th>
                    <th>Phía gia đình</th>
                    <th>Phản hồi</th>
                    <th>Số khách</th>
                    <th>Thời gian</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rsvps.map((rsvp) => (
                    <tr key={rsvp.id}>
                      <td data-label="Khách mời"><strong>{rsvp.name}</strong></td>
                      <td data-label="Phía gia đình">
                        {rsvp.side === "groom" ? "Nhà trai" : "Nhà gái"}
                      </td>
                      <td data-label="Phản hồi">
                        <span
                          className={`admin-pill ${
                            rsvp.attend === "yes"
                              ? "admin-pill--yes"
                              : "admin-pill--no"
                          }`}
                        >
                          {rsvp.attend === "yes" ? "Tham dự" : "Không tham dự"}
                        </span>
                      </td>
                      <td data-label="Số khách">{rsvp.guestCount}</td>
                      <td data-label="Thời gian" className="admin-cell-time">
                        {formatDate(rsvp.createdAt)}
                      </td>
                      <td data-label="Thao tác" className="admin-cell-action">
                        <button
                          className="admin-row-delete"
                          type="button"
                          onClick={() => void deleteRsvp(rsvp)}
                          disabled={busyRowId === rsvp.id}
                          aria-label={`Xoá xác nhận của ${rsvp.name}`}
                        >
                          {busyRowId === rsvp.id ? "Đang xoá…" : "Xoá"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-empty">
              <span aria-hidden="true">✉</span>
              <h3>Chưa có xác nhận nào</h3>
              <p>Danh sách sẽ xuất hiện ngay khi khách gửi phản hồi.</p>
            </div>
          )}
        </section>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-kicker">Guestbook</p>
              <h2>Lời chúc gửi đến hai bạn</h2>
            </div>
            <button
              className="admin-button admin-button--outline"
              type="button"
              onClick={() => void downloadCsv("messages")}
              disabled={exporting !== ""}
            >
              <span aria-hidden="true">↓</span>
              {exporting === "messages" ? "Đang xuất…" : "Xuất CSV"}
            </button>
          </div>
          {data.messages.length ? (
            <div className="admin-message-list">
              {data.messages.map((message) => (
                <article
                  className={`admin-message ${
                    message.visible ? "" : "admin-message--hidden"
                  }`}
                  key={message.id}
                >
                  <div className="admin-message-avatar" aria-hidden="true">
                    {message.name.trim().charAt(0).toLocaleUpperCase("vi-VN")}
                  </div>
                  <div className="admin-message-content">
                    <div className="admin-message-meta">
                      <div>
                        <strong>{message.name}</strong>
                        <time dateTime={isoDate(message.createdAt)}>
                          {formatDate(message.createdAt)}
                        </time>
                      </div>
                      <span
                        className={`admin-pill ${
                          message.visible
                            ? "admin-pill--yes"
                            : "admin-pill--hidden"
                        }`}
                      >
                        {message.visible ? "Đang hiển thị" : "Đã ẩn"}
                      </span>
                    </div>
                    <p>{message.body}</p>
                  </div>
                  <div className="admin-message-actions">
                    <button
                      className="admin-message-action"
                      type="button"
                      onClick={() => void setMessageVisibility(message)}
                      disabled={busyRowId === message.id}
                    >
                      {busyRowId === message.id
                        ? "Đang lưu…"
                        : message.visible
                          ? "Ẩn lời chúc"
                          : "Hiện lại"}
                    </button>
                    <button
                      className="admin-row-delete"
                      type="button"
                      onClick={() => void deleteMessage(message)}
                      disabled={busyRowId === message.id}
                      aria-label={`Xoá lời chúc của ${message.name}`}
                    >
                      Xoá
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="admin-empty">
              <span aria-hidden="true">♡</span>
              <h3>Guestbook đang chờ lời chúc đầu tiên</h3>
              <p>Những lời nhắn của khách mời sẽ được lưu tại đây.</p>
            </div>
          )}
        </section>
      </div>

      <footer className="admin-footer">
        <span>Ngô Nam</span><i>♡</i><span>Nhật Mai</span>
      </footer>
    </main>
  );
}
