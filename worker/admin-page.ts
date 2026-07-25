const ADMIN_PAGE = String.raw`<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Quản trị thiệp cưới · Ngô Nam & Nhật Mai</title>
  <style>
    :root{color-scheme:light;--paper:#f8f3eb;--card:#fffdf9;--ink:#32251f;--muted:#806e64;--rose:#a96f68;--line:#dfd3c7;--sage:#7f8e7a;--danger:#9b4f4f;--shadow:0 24px 70px rgba(72,48,37,.12)}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 10% 0,#fff 0,transparent 35%),linear-gradient(145deg,#f9f5ef,#eee4d8);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
    button,input{font:inherit}button{cursor:pointer}.shell{width:min(1120px,calc(100% - 28px));margin:auto;padding:28px 0 52px}.top{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:22px}.brand small,.eyebrow{display:block;color:var(--rose);font-size:11px;font-weight:800;letter-spacing:.22em;text-transform:uppercase}.brand h1{margin:5px 0 0;font-family:Georgia,serif;font-size:clamp(25px,4vw,38px);font-weight:500}.actions{display:flex;flex-wrap:wrap;gap:8px}
    .btn{min-height:42px;border:1px solid var(--line);border-radius:999px;background:rgba(255,253,249,.72);color:var(--ink);padding:0 17px;font-weight:750;transition:.2s ease}.btn:hover{transform:translateY(-1px);border-color:#bca99a;background:#fff}.btn:disabled{cursor:wait;opacity:.55;transform:none}.btn.primary{background:var(--ink);border-color:var(--ink);color:#fff}.btn.danger{color:var(--danger)}.btn.small{min-height:34px;padding:0 12px;font-size:12px}
    .login{min-height:calc(100vh - 90px);display:grid;place-items:center}.login-card{width:min(820px,100%);display:grid;grid-template-columns:.85fr 1.15fr;overflow:hidden;border:1px solid rgba(170,143,125,.3);border-radius:32px;background:var(--card);box-shadow:var(--shadow)}.login-art{min-height:440px;padding:38px;display:flex;flex-direction:column;justify-content:space-between;background:linear-gradient(160deg,rgba(45,31,25,.96),rgba(94,66,52,.93));color:#fff}.monogram{display:grid;place-items:center;width:112px;height:112px;border:1px solid rgba(255,255,255,.45);border-radius:50%;font:italic 42px Georgia,serif}.login-art p{font:italic 30px Georgia,serif;line-height:1.25}.login-form{padding:clamp(30px,6vw,62px);align-self:center}.login-form h2{margin:8px 0 12px;font:500 clamp(32px,5vw,48px) Georgia,serif}.copy{color:var(--muted);line-height:1.65}.field{display:block;margin:26px 0 10px;font-size:13px;font-weight:800}.input{width:100%;height:52px;border:1px solid var(--line);border-radius:15px;background:#fff;padding:0 16px;color:var(--ink);outline:none}.input:focus{border-color:var(--rose);box-shadow:0 0 0 4px rgba(169,111,104,.12)}.login-form .primary{width:100%;margin-top:13px}.privacy{font-size:12px;color:var(--muted);line-height:1.5;margin-top:17px}
    .notice{display:none;margin:0 0 18px;padding:13px 16px;border:1px solid #e2bcbc;border-radius:14px;background:#fff4f3;color:#814747;font-size:14px}.notice.show{display:block}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.stat{min-height:145px;padding:20px;border:1px solid rgba(170,143,125,.28);border-radius:22px;background:rgba(255,253,249,.88);box-shadow:0 10px 34px rgba(72,48,37,.06)}.stat span{color:var(--muted);font-size:12px;font-weight:750}.stat strong{display:block;margin:9px 0 5px;font:500 36px Georgia,serif}.stat small{color:var(--muted)}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}.panel{min-width:0;border:1px solid rgba(170,143,125,.3);border-radius:24px;background:rgba(255,253,249,.9);box-shadow:0 14px 42px rgba(72,48,37,.06);overflow:hidden}.panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:20px;border-bottom:1px solid var(--line)}.panel-head h2{margin:0;font:500 24px Georgia,serif}.list{display:grid;gap:0;max-height:650px;overflow:auto}.empty{padding:42px 20px;text-align:center;color:var(--muted)}.row{padding:18px 20px;border-bottom:1px solid #eadfd5}.row:last-child{border:0}.row-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.row h3{margin:0;font-size:15px}.meta{margin:5px 0 0;color:var(--muted);font-size:12px}.wish{white-space:pre-wrap;margin:11px 0 0;color:#59483f;line-height:1.55}.row-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:13px}.pill{display:inline-flex;align-items:center;min-height:27px;padding:0 9px;border-radius:999px;background:#eee4dc;color:#6d574c;font-size:11px;font-weight:800}.pill.yes{background:#e5eee3;color:#52634f}.pill.no{background:#f3e2df;color:#864e4b}.hidden-wish{opacity:.58}
    [hidden]{display:none!important}@media(max-width:820px){.login-card{grid-template-columns:1fr}.login-art{min-height:210px}.login-art p{font-size:24px}.stats{grid-template-columns:1fr 1fr}.grid{grid-template-columns:1fr}.top{align-items:flex-start;flex-direction:column}}@media(max-width:480px){.shell{width:min(100% - 18px,1120px);padding-top:15px}.login-card{border-radius:22px}.login-art{padding:26px}.login-form{padding:28px 22px}.stats{gap:8px}.stat{padding:16px;min-height:126px}.actions{width:100%}.actions .btn{flex:1}.panel{border-radius:19px}}
  </style>
</head>
<body>
  <main id="login" class="login shell">
    <section class="login-card">
      <div class="login-art"><div><span class="eyebrow">Thiệp cưới · 2026</span><div class="monogram">N&M</div></div><p>Ngô Nam<br>& Nhật Mai</p></div>
      <form id="loginForm" class="login-form">
        <span class="eyebrow">Khu vực riêng tư</span><h2>Quản lý ngày vui</h2>
        <p class="copy">Theo dõi khách tham dự, đọc lời chúc và xuất danh sách chuẩn bị cho buổi lễ.</p>
        <label class="field" for="key">Khóa truy cập quản trị</label>
        <input id="key" class="input" type="password" autocomplete="current-password" required autofocus placeholder="Nhập khóa quản trị">
        <p id="loginError" class="notice" role="alert"></p>
        <button id="loginButton" class="btn primary" type="submit">Mở bảng quản trị</button>
        <p class="privacy">Khóa chỉ được giữ trong bộ nhớ của trang và sẽ mất khi bạn đóng hoặc tải lại tab.</p>
      </form>
    </section>
  </main>
  <main id="dashboard" class="shell" hidden>
    <header class="top"><div class="brand"><small>07 · 08 · 2026</small><h1>Quản lý ngày vui</h1></div><div class="actions"><button id="refresh" class="btn">Làm mới</button><button id="exportRsvp" class="btn">Xuất RSVP</button><button id="exportMessages" class="btn">Xuất lời chúc</button><button id="logout" class="btn danger">Đăng xuất</button></div></header>
    <p id="dashboardError" class="notice" role="alert"></p>
    <section id="stats" class="stats" aria-label="Thống kê"></section>
    <section class="grid">
      <article class="panel"><header class="panel-head"><h2>Xác nhận tham dự</h2><span id="rsvpCount" class="pill"></span></header><div id="rsvps" class="list"></div></article>
      <article class="panel"><header class="panel-head"><h2>Lời chúc</h2><span id="messageCount" class="pill"></span></header><div id="messages" class="list"></div></article>
    </section>
  </main>
  <script>
    (() => {
      let token = "";
      let data = null;
      const $ = (id) => document.getElementById(id);
      const text = (tag, className, value) => { const node = document.createElement(tag); if (className) node.className = className; node.textContent = value; return node; };
      const formatNumber = (value) => new Intl.NumberFormat("vi-VN").format(Number(value || 0));
      const formatDate = (value) => { const date = new Date(value); return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("vi-VN",{timeZone:"Asia/Ho_Chi_Minh",dateStyle:"short",timeStyle:"short"}).format(date) : "—"; };
      const showError = (target, message) => { target.textContent = message || ""; target.classList.toggle("show", Boolean(message)); };
      const readError = async (response) => { try { const value = await response.json(); if (typeof value.error === "string") return value.error; } catch {} return "Yêu cầu không thành công. Vui lòng thử lại."; };
      const request = async (path, options = {}) => {
        const headers = new Headers(options.headers || {});
        headers.set("Authorization", "Bearer " + token);
        const response = await fetch(path, { ...options, headers, cache: "no-store" });
        if (!response.ok) throw new Error(await readError(response));
        return response;
      };
      const stat = (label, value, detail) => { const card = text("article","stat",""); card.append(text("span","",label),text("strong","",formatNumber(value)),text("small","",detail)); return card; };
      const button = (label, className, action) => { const node = text("button","btn small " + (className || ""),label); node.type = "button"; node.addEventListener("click",action); return node; };
      async function load() {
        showError($("dashboardError"), "");
        const response = await request("/api/admin/dashboard");
        data = await response.json();
        render();
      }
      function render() {
        const s = data.stats;
        $("stats").replaceChildren(
          stat("Khách tham dự",s.rsvps.attendingGuests,s.rsvps.attendingResponses + " lượt xác nhận"),
          stat("Nhà trai",s.rsvps.groomGuests,"khách tham dự"),
          stat("Nhà gái",s.rsvps.brideGuests,"khách tham dự"),
          stat("Lời chúc",s.messages.visible,s.messages.hidden + " lời chúc đang ẩn")
        );
        $("rsvpCount").textContent = formatNumber(data.rsvps.length) + " gần nhất";
        $("messageCount").textContent = formatNumber(data.messages.length) + " gần nhất";
        renderRsvps(); renderMessages();
      }
      function renderRsvps() {
        const list = $("rsvps"); list.replaceChildren();
        if (!data.rsvps.length) { list.append(text("p","empty","Chưa có xác nhận tham dự.")); return; }
        data.rsvps.forEach((item) => {
          const row = text("section","row",""), top = text("div","row-top",""), info = text("div","",""), status = text("span","pill " + (item.attend === "yes" ? "yes" : "no"),item.attend === "yes" ? "Tham dự" : "Không tham dự");
          info.append(text("h3","",item.name),text("p","meta",(item.side === "groom" ? "Nhà trai" : "Nhà gái") + " · " + item.guestCount + " khách · " + formatDate(item.createdAt)));
          top.append(info,status);
          const actions = text("div","row-actions","");
          actions.append(button("Xóa xác nhận","danger",async () => { if (!confirm("Xóa vĩnh viễn xác nhận của “" + item.name + "”?")) return; await mutate({action:"delete-rsvp",id:item.id}); }));
          row.append(top,actions); list.append(row);
        });
      }
      function renderMessages() {
        const list = $("messages"); list.replaceChildren();
        if (!data.messages.length) { list.append(text("p","empty","Chưa có lời chúc nào.")); return; }
        data.messages.forEach((item) => {
          const row = text("section","row" + (item.visible ? "" : " hidden-wish"),""), top = text("div","row-top",""), info = text("div","","");
          info.append(text("h3","",item.name),text("p","meta",formatDate(item.createdAt)));
          top.append(info,text("span","pill",item.visible ? "Đang hiện" : "Đã ẩn"));
          const actions = text("div","row-actions","");
          actions.append(
            button(item.visible ? "Ẩn lời chúc" : "Hiện lại","",async () => { await mutate({action:"set-message-visibility",id:item.id,visible:!item.visible}); }),
            button("Xóa","danger",async () => { if (!confirm("Xóa vĩnh viễn lời chúc của “" + item.name + "”?")) return; await mutate({action:"delete-message",id:item.id}); })
          );
          row.append(top,text("p","wish",item.body),actions); list.append(row);
        });
      }
      async function mutate(body) {
        try { await request("/api/admin/dashboard",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}); await load(); }
        catch (error) { showError($("dashboardError"),error instanceof Error ? error.message : "Không thể cập nhật dữ liệu."); }
      }
      async function exportCsv(type) {
        try {
          const response = await request("/api/admin/export?type=" + type);
          const url = URL.createObjectURL(await response.blob()), anchor = document.createElement("a");
          anchor.href = url; anchor.download = type === "rsvps" ? "xac-nhan-tham-du.csv" : "loi-chuc.csv"; anchor.click(); URL.revokeObjectURL(url);
        } catch (error) { showError($("dashboardError"),error instanceof Error ? error.message : "Không thể xuất dữ liệu."); }
      }
      $("loginForm").addEventListener("submit",async (event) => {
        event.preventDefault(); token = $("key").value.trim(); if (!token) return;
        $("loginButton").disabled = true; showError($("loginError"),"");
        try { await load(); $("login").hidden = true; $("dashboard").hidden = false; $("key").value = ""; }
        catch (error) { token = ""; showError($("loginError"),error instanceof Error ? error.message : "Không thể kết nối máy chủ."); }
        finally { $("loginButton").disabled = false; }
      });
      $("refresh").addEventListener("click",() => load().catch((error) => showError($("dashboardError"),error.message)));
      $("exportRsvp").addEventListener("click",() => exportCsv("rsvps"));
      $("exportMessages").addEventListener("click",() => exportCsv("messages"));
      $("logout").addEventListener("click",() => { token = ""; data = null; $("dashboard").hidden = true; $("login").hidden = false; $("key").focus(); });
    })();
  </script>
</body>
</html>`;

export function adminPageResponse(): Response {
  return new Response(ADMIN_PAGE, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Content-Security-Policy":
        "default-src 'none'; base-uri 'none'; connect-src 'self'; form-action 'none'; frame-ancestors 'none'; img-src data:; script-src 'unsafe-inline'; style-src 'unsafe-inline'",
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
