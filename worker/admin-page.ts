const ADMIN_PAGE = String.raw`<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Quản trị thiệp cưới · Ngô Nam & Nhật Mai</title>
  <style>
    :root {
      color-scheme: light;
      --paper: #f6f0e8;
      --paper-deep: #eee3d7;
      --card: #fffdf9;
      --card-soft: #fbf7f1;
      --ink: #30251f;
      --muted: #776960;
      --muted-strong: #62534b;
      --clay: #a56f5b;
      --rose: #c98d86;
      --rose-soft: #f3e1de;
      --sage: #7f917a;
      --sage-soft: #e5ece2;
      --gold: #c29a68;
      --danger: #a24f50;
      --danger-soft: #f7e5e3;
      --line: rgba(76, 55, 43, .14);
      --line-strong: rgba(76, 55, 43, .24);
      --shadow: 0 24px 70px rgba(74, 49, 36, .11);
      --serif: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
      --sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      min-width: 320px;
      min-height: 100vh;
      background:
        radial-gradient(circle at 8% 0, rgba(255, 255, 255, .94), transparent 32rem),
        radial-gradient(circle at 100% 18%, rgba(201, 141, 134, .13), transparent 28rem),
        linear-gradient(145deg, var(--paper), var(--paper-deep));
      color: var(--ink);
      font-family: var(--sans);
      -webkit-font-smoothing: antialiased;
    }
    body::before {
      position: fixed;
      inset: 0;
      pointer-events: none;
      content: "";
      opacity: .18;
      background-image: radial-gradient(rgba(71, 49, 37, .22) .45px, transparent .55px);
      background-size: 4px 4px;
    }
    button, input, select { font: inherit; }
    button { cursor: pointer; }
    button:disabled { cursor: wait; }
    [hidden] { display: none !important; }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    :focus-visible {
      outline: 3px solid rgba(165, 111, 91, .35);
      outline-offset: 3px;
    }
    .eyebrow {
      margin: 0;
      color: var(--clay);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: .2em;
      text-transform: uppercase;
    }
    .button {
      display: inline-flex;
      min-height: 44px;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: 1px solid var(--line-strong);
      border-radius: 999px;
      background: rgba(255, 253, 249, .72);
      color: var(--ink);
      padding: 0 17px;
      font-weight: 750;
      text-decoration: none;
      transition: transform .2s ease, background .2s ease, border-color .2s ease, opacity .2s ease;
    }
    .button:hover:not(:disabled) {
      transform: translateY(-1px);
      border-color: rgba(76, 55, 43, .38);
      background: #fff;
    }
    .button:disabled { opacity: .56; transform: none; }
    .button--primary { border-color: var(--ink); background: var(--ink); color: #fff; }
    .button--primary:hover:not(:disabled) { background: #493a32; }
    .button--excel {
      border-color: rgba(78, 111, 72, .32);
      background: var(--sage-soft);
      color: #465944;
    }
    .button--csv { background: transparent; color: var(--muted-strong); }
    .button--danger { border-color: transparent; background: transparent; color: var(--danger); }
    .button--small { min-height: 36px; padding: 0 12px; font-size: 12px; }
    .button-icon { font-size: 17px; line-height: 1; }

    /* Login */
    .login-shell {
      position: relative;
      display: grid;
      min-height: 100vh;
      place-items: center;
      padding: 24px;
    }
    .login-card {
      display: grid;
      width: min(940px, 100%);
      grid-template-columns: minmax(280px, .92fr) minmax(360px, 1.08fr);
      overflow: hidden;
      border: 1px solid rgba(137, 104, 83, .28);
      border-radius: 34px;
      background: var(--card);
      box-shadow: var(--shadow);
      animation: rise .7s cubic-bezier(.22, 1, .36, 1) both;
    }
    .login-story {
      position: relative;
      display: flex;
      min-height: 510px;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      padding: 42px;
      background:
        radial-gradient(circle at 80% 10%, rgba(255, 255, 255, .16), transparent 17rem),
        linear-gradient(155deg, #2d211c, #684c3e);
      color: #fffaf4;
    }
    .login-story::before,
    .login-story::after {
      position: absolute;
      border: 1px solid rgba(255, 255, 255, .16);
      border-radius: 50%;
      content: "";
    }
    .login-story::before { width: 280px; height: 280px; right: -125px; top: -95px; }
    .login-story::after { width: 190px; height: 190px; left: -95px; bottom: -75px; }
    .login-story-top, .login-story-copy { position: relative; z-index: 1; }
    .login-date {
      display: block;
      margin-bottom: 38px;
      color: rgba(255, 250, 244, .72);
      font-size: 11px;
      font-weight: 750;
      letter-spacing: .24em;
      text-transform: uppercase;
    }
    .monogram {
      display: grid;
      width: 112px;
      height: 112px;
      place-items: center;
      border: 1px solid rgba(255, 255, 255, .44);
      border-radius: 50%;
      font: italic 40px/1 var(--serif);
    }
    .login-story h2 {
      max-width: 330px;
      margin: 0 0 14px;
      font: 500 clamp(34px, 5vw, 52px)/1.05 var(--serif);
    }
    .login-story p { max-width: 320px; margin: 0; color: rgba(255, 250, 244, .72); line-height: 1.65; }
    .login-form {
      align-self: center;
      padding: clamp(34px, 7vw, 72px);
    }
    .login-form h1 {
      margin: 9px 0 13px;
      font: 500 clamp(34px, 5vw, 50px)/1.05 var(--serif);
      letter-spacing: -.025em;
    }
    .login-copy { margin: 0 0 30px; color: var(--muted); line-height: 1.7; }
    .field-label { display: block; margin-bottom: 9px; font-size: 13px; font-weight: 800; }
    .key-field { position: relative; }
    .key-field input {
      width: 100%;
      height: 54px;
      border: 1px solid var(--line-strong);
      border-radius: 15px;
      background: #fff;
      color: var(--ink);
      padding: 0 56px 0 16px;
      outline: none;
    }
    .key-field input:focus { border-color: var(--clay); box-shadow: 0 0 0 4px rgba(165, 111, 91, .12); }
    .key-toggle {
      position: absolute;
      top: 5px;
      right: 5px;
      width: 44px;
      height: 44px;
      border: 0;
      border-radius: 12px;
      background: transparent;
      color: var(--muted);
    }
    .login-submit { width: 100%; margin-top: 14px; }
    .privacy-note { margin: 18px 0 0; color: var(--muted); font-size: 12px; line-height: 1.55; }

    /* Dashboard */
    .topbar {
      position: sticky;
      z-index: 20;
      top: 0;
      display: flex;
      min-height: 76px;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      border-bottom: 1px solid var(--line);
      background: rgba(248, 243, 236, .86);
      padding: 11px max(20px, calc((100vw - 1200px) / 2));
      backdrop-filter: blur(18px);
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 11px;
      color: inherit;
      text-decoration: none;
    }
    .brand-mark {
      display: grid;
      width: 45px;
      height: 45px;
      place-items: center;
      border: 1px solid var(--line-strong);
      border-radius: 50%;
      background: rgba(255, 253, 249, .68);
      font: italic 17px/1 var(--serif);
    }
    .brand-copy { display: grid; gap: 2px; }
    .brand-copy strong { font: 500 17px/1.1 var(--serif); }
    .brand-copy small { color: var(--muted); font-size: 11px; font-weight: 750; letter-spacing: .14em; text-transform: uppercase; }
    .topbar-right { display: flex; align-items: center; gap: 9px; }
    .sync-label { display: grid; margin-right: 5px; text-align: right; }
    .sync-label span { color: var(--muted); font-size: 11px; font-weight: 750; letter-spacing: .1em; text-transform: uppercase; }
    .sync-label time { margin-top: 2px; font-size: 12px; font-weight: 700; }
    .live-dot {
      display: inline-block;
      width: 7px;
      height: 7px;
      margin-right: 5px;
      border-radius: 50%;
      background: var(--sage);
      box-shadow: 0 0 0 4px rgba(127, 145, 122, .14);
    }
    .dashboard-shell { position: relative; width: min(1200px, calc(100% - 32px)); margin: auto; padding: 42px 0 64px; }
    .welcome {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 30px;
      margin-bottom: 24px;
    }
    .welcome h1 {
      max-width: 720px;
      margin: 9px 0 0;
      font: 500 clamp(38px, 6vw, 68px)/.98 var(--serif);
      letter-spacing: -.035em;
    }
    .welcome-note {
      max-width: 320px;
      margin: 0 0 7px;
      color: var(--muted);
      line-height: 1.65;
    }
    .notice {
      display: none;
      margin: 0 0 18px;
      border: 1px solid rgba(162, 79, 80, .26);
      border-radius: 15px;
      background: var(--danger-soft);
      color: #783d3e;
      padding: 13px 16px;
      font-size: 14px;
      line-height: 1.5;
    }
    .notice.show { display: block; }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }
    .stat {
      position: relative;
      min-height: 154px;
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 23px;
      background: rgba(255, 253, 249, .84);
      padding: 21px;
      box-shadow: 0 10px 32px rgba(74, 49, 36, .05);
    }
    .stat::after {
      position: absolute;
      width: 90px;
      height: 90px;
      right: -36px;
      bottom: -42px;
      border: 1px solid rgba(165, 111, 91, .18);
      border-radius: 50%;
      content: "";
    }
    .stat--featured { border-color: transparent; background: var(--ink); color: #fff; }
    .stat--featured::after { border-color: rgba(255, 255, 255, .16); }
    .stat-label { display: block; color: var(--muted); font-size: 12px; font-weight: 750; }
    .stat--featured .stat-label, .stat--featured .stat-detail { color: rgba(255, 255, 255, .66); }
    .stat-value { display: block; margin: 12px 0 7px; font: 500 40px/1 var(--serif); }
    .stat-detail { color: var(--muted); font-size: 12px; line-height: 1.4; }
    .insights {
      display: grid;
      grid-template-columns: 1.05fr 1fr 1fr;
      gap: 13px;
      margin-top: 13px;
    }
    .insights-help { display: none; }
    .insight {
      min-height: 202px;
      border: 1px solid var(--line);
      border-radius: 23px;
      background: rgba(255, 253, 249, .72);
      padding: 21px;
    }
    .insight-heading { display: flex; align-items: start; justify-content: space-between; gap: 12px; }
    .insight-heading h2 { margin: 3px 0 0; font: 500 22px/1.2 var(--serif); }
    .insight-note { color: var(--muted); font-size: 11px; }
    .donut-layout { display: flex; align-items: center; gap: 22px; margin-top: 20px; }
    .donut {
      --value: 0;
      position: relative;
      display: grid;
      width: 108px;
      height: 108px;
      flex: 0 0 auto;
      place-items: center;
      border-radius: 50%;
      background: conic-gradient(var(--sage) calc(var(--value) * 1%), #e7ddd4 0);
    }
    .donut::before { position: absolute; width: 76px; height: 76px; border-radius: 50%; background: var(--card); content: ""; }
    .donut strong { position: relative; font: 500 24px/1 var(--serif); }
    .legend { display: grid; flex: 1; gap: 10px; }
    .legend-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--muted-strong); font-size: 12px; }
    .legend-label { display: inline-flex; align-items: center; gap: 7px; }
    .swatch { width: 9px; height: 9px; border-radius: 50%; background: var(--sage); }
    .swatch--soft { background: #d7c8bd; }
    .swatch--rose { background: var(--rose); }
    .metric-stack { display: grid; gap: 19px; margin-top: 27px; }
    .metric-row { display: grid; gap: 8px; }
    .metric-copy { display: flex; justify-content: space-between; gap: 16px; color: var(--muted-strong); font-size: 12px; }
    .metric-copy strong { color: var(--ink); }
    .bar { height: 9px; overflow: hidden; border-radius: 999px; background: #e9dfd6; }
    .bar-fill { width: 0; height: 100%; border-radius: inherit; background: var(--clay); transition: width .45s ease; }
    .bar-fill--rose { background: var(--rose); }
    .bar-fill--sage { background: var(--sage); }

    .data-panel {
      margin-top: 18px;
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 25px;
      background: rgba(255, 253, 249, .9);
      box-shadow: 0 14px 40px rgba(74, 49, 36, .055);
    }
    .panel-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      border-bottom: 1px solid var(--line);
      padding: 22px 24px;
    }
    .panel-actions { display: flex; flex: 0 0 auto; align-items: center; gap: 8px; }
    .panel-title-wrap { display: flex; align-items: center; gap: 12px; }
    .panel-title-wrap h2 { margin: 4px 0 0; font: 500 clamp(24px, 4vw, 31px)/1.1 var(--serif); }
    .count-pill {
      display: inline-flex;
      min-height: 28px;
      align-items: center;
      border-radius: 999px;
      background: var(--rose-soft);
      color: #79504c;
      padding: 0 10px;
      font-size: 11px;
      font-weight: 800;
    }
    .panel-export-note { margin: 7px 0 0; color: var(--muted); font-size: 12px; }
    .toolbar {
      display: grid;
      grid-template-columns: minmax(220px, 1fr) 190px 190px auto;
      gap: 10px;
      border-bottom: 1px solid var(--line);
      background: rgba(246, 240, 232, .55);
      padding: 13px 24px;
    }
    .toolbar--messages { grid-template-columns: minmax(260px, 1fr) 210px auto; }
    .control {
      width: 100%;
      min-height: 44px;
      border: 1px solid var(--line-strong);
      border-radius: 13px;
      background: rgba(255, 255, 255, .86);
      color: var(--ink);
      padding: 0 13px;
      outline: none;
    }
    .control:focus { border-color: var(--clay); box-shadow: 0 0 0 3px rgba(165, 111, 91, .1); }
    .filter-summary { min-height: 42px; padding: 13px 24px 0; color: var(--muted); font-size: 12px; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 15px 17px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
    th {
      color: var(--muted);
      font-size: 11px;
      font-weight: 850;
      letter-spacing: .1em;
      text-transform: uppercase;
      white-space: nowrap;
    }
    tbody tr:last-child td { border-bottom: 0; }
    tbody tr:hover { background: rgba(246, 240, 232, .48); }
    .person strong { display: block; max-width: 260px; overflow-wrap: anywhere; font-size: 14px; }
    .person small { display: block; margin-top: 5px; color: var(--muted); font-size: 11px; }
    .cell-muted { color: var(--muted); font-size: 12px; white-space: nowrap; }
    .status-pill {
      display: inline-flex;
      min-height: 29px;
      align-items: center;
      border-radius: 999px;
      background: var(--sage-soft);
      color: #4e624b;
      padding: 0 10px;
      font-size: 11px;
      font-weight: 800;
      white-space: nowrap;
    }
    .status-pill--no { background: var(--danger-soft); color: #834547; }
    .status-pill--hidden { background: #ede5df; color: #68574e; }
    .row-actions { display: flex; flex-wrap: wrap; gap: 6px; }
    .message-list { display: grid; }
    .message-card {
      display: grid;
      grid-template-columns: 46px minmax(0, 1fr) auto;
      gap: 14px;
      border-bottom: 1px solid var(--line);
      padding: 19px 24px;
    }
    .message-card:last-child { border-bottom: 0; }
    .message-card--hidden { background: rgba(238, 229, 222, .45); }
    .message-avatar {
      display: grid;
      width: 44px;
      height: 44px;
      place-items: center;
      border-radius: 50%;
      background: var(--rose-soft);
      color: #7d514c;
      font: 500 19px/1 var(--serif);
    }
    .message-main { min-width: 0; }
    .message-meta { display: flex; align-items: start; justify-content: space-between; gap: 14px; }
    .message-meta strong { overflow-wrap: anywhere; font-size: 14px; }
    .message-meta time { display: block; margin-top: 4px; color: var(--muted); font-size: 11px; }
    .message-body { margin: 11px 0 0; color: #594940; line-height: 1.62; overflow-wrap: anywhere; white-space: pre-wrap; }
    .message-actions { display: flex; align-items: center; gap: 6px; }
    .empty {
      padding: 48px 22px;
      text-align: center;
      color: var(--muted);
    }
    .empty-mark { display: block; margin-bottom: 10px; color: var(--rose); font: 500 34px/1 var(--serif); }
    .empty h3 { margin: 0 0 7px; color: var(--ink); font: 500 21px/1.2 var(--serif); }
    .empty p { margin: 0; line-height: 1.55; }
    .footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      border-top: 1px solid var(--line);
      color: var(--muted);
      padding: 27px 20px;
      font: italic 17px/1 var(--serif);
    }
    .footer span { color: var(--rose); }
    .toast {
      position: fixed;
      z-index: 50;
      right: 20px;
      bottom: 20px;
      display: flex;
      max-width: min(390px, calc(100% - 32px));
      align-items: flex-start;
      gap: 11px;
      border: 1px solid var(--line-strong);
      border-radius: 16px;
      background: #fffdf9;
      box-shadow: var(--shadow);
      padding: 14px 16px;
      opacity: 0;
      pointer-events: none;
      transform: translateY(12px);
      transition: opacity .2s ease, transform .2s ease;
    }
    .toast.show { opacity: 1; pointer-events: auto; transform: none; }
    .toast--error { border-color: rgba(162, 79, 80, .32); background: #fff7f6; }
    .toast-icon { color: var(--sage); font-weight: 900; }
    .toast--error .toast-icon { color: var(--danger); }
    .toast p { margin: 0; color: var(--muted-strong); font-size: 13px; line-height: 1.5; }

    @keyframes rise {
      from { opacity: 0; transform: translateY(18px); }
      to { opacity: 1; transform: none; }
    }
    @media (max-width: 980px) {
      .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .insights { grid-template-columns: 1fr 1fr; }
      .insight:first-child { grid-column: 1 / -1; }
      .toolbar, .toolbar--messages { grid-template-columns: 1fr 1fr; }
      .toolbar .search-control { grid-column: 1 / -1; }
      .toolbar .filter-reset { justify-self: start; }
    }
    @media (max-width: 760px) {
      .login-shell { padding: 14px; }
      .login-card { grid-template-columns: 1fr; border-radius: 25px; }
      .login-story { min-height: 255px; padding: 28px; }
      .login-story h2 { font-size: 34px; }
      .login-story p { display: none; }
      .login-date { margin-bottom: 23px; }
      .monogram { width: 82px; height: 82px; font-size: 29px; }
      .login-form { padding: 31px 24px 35px; }
      .topbar { align-items: flex-start; padding: 12px 16px; }
      .brand-copy { display: none; }
      .sync-label { display: none; }
      .topbar-right { flex-wrap: wrap; justify-content: flex-end; }
      .topbar-right .button { min-height: 42px; padding: 0 13px; font-size: 12px; }
      .dashboard-shell { width: min(100% - 20px, 1200px); padding-top: 28px; }
      .welcome { display: grid; gap: 13px; }
      .welcome h1 { font-size: 43px; }
      .welcome-note { max-width: none; }
      .stats { gap: 8px; }
      .stat { min-height: 137px; padding: 17px; }
      .stat-value { font-size: 34px; }
      .insights {
        grid-template-columns: repeat(3, minmax(280px, 1fr));
        gap: 9px;
        overflow-x: auto;
        padding-bottom: 7px;
        scroll-snap-type: x proximity;
      }
      .insights-help {
        display: block;
        margin: 13px 2px -3px;
        color: var(--muted);
        font-size: 12px;
      }
      .insight { scroll-snap-align: start; }
      .insight:first-child { grid-column: auto; }
      .panel-head { align-items: stretch; flex-direction: column; padding: 18px; }
      .panel-actions { align-items: stretch; flex-direction: column; }
      .panel-head .button { width: 100%; }
      .toolbar, .toolbar--messages { grid-template-columns: 1fr; padding: 12px 18px; }
      .toolbar .search-control { grid-column: auto; }
      .toolbar .filter-reset { width: 100%; }
      .filter-summary { padding-inline: 18px; }
      .table-wrap { overflow: visible; padding: 0 14px 14px; }
      table, tbody, tr, td { display: block; width: 100%; }
      thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); }
      tbody { display: grid; gap: 10px; }
      tbody tr { border: 1px solid var(--line); border-radius: 17px; background: #fff; padding: 11px 14px; }
      tbody tr:hover { background: #fff; }
      td {
        display: grid;
        grid-template-columns: 110px minmax(0, 1fr);
        gap: 10px;
        border-bottom: 1px dashed var(--line);
        padding: 10px 0;
      }
      td:last-child { border: 0; }
      td::before { content: attr(data-label); color: var(--muted); font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
      .message-card { grid-template-columns: 42px minmax(0, 1fr); padding: 17px 18px; }
      .message-actions { grid-column: 1 / -1; padding-left: 56px; }
      .message-actions .button { flex: 1; }
    }
    @media (max-width: 460px) {
      .topbar-right .button .button-copy { display: none; }
      .topbar-right .button { width: 44px; padding: 0; }
      .stats { grid-template-columns: 1fr 1fr; }
      .stat { min-height: 116px; padding: 15px; }
      .stat-value { margin: 9px 0 5px; font-size: 31px; }
      .stat-detail { display: none; }
      .donut-layout { align-items: flex-start; }
      .donut { width: 96px; height: 96px; }
      .donut::before { width: 68px; height: 68px; }
      .panel-title-wrap { align-items: flex-start; flex-direction: column; }
      td { grid-template-columns: 92px minmax(0, 1fr); }
      .message-card { grid-template-columns: 36px minmax(0, 1fr); gap: 10px; }
      .message-avatar { width: 36px; height: 36px; }
      .message-meta { align-items: flex-start; flex-direction: column; }
      .message-actions { padding-left: 46px; }
    }
    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior: auto; }
      *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
    }
  </style>
</head>
<body>
  <main id="login" class="login-shell">
    <section class="login-card" aria-labelledby="loginTitle">
      <div class="login-story">
        <div class="login-story-top">
          <span class="login-date">07 · 08 · 2026</span>
          <div class="monogram" aria-hidden="true">N&amp;M</div>
        </div>
        <div class="login-story-copy">
          <h2>Ngày vui,<br>được chăm chút.</h2>
          <p>Một nơi riêng tư để theo dõi khách mời, lời chúc và mọi thông tin cần thiết cho buổi lễ.</p>
        </div>
      </div>
      <form id="loginForm" class="login-form">
        <p class="eyebrow">Khu vực riêng tư</p>
        <h1 id="loginTitle">Bảng quản trị</h1>
        <p class="login-copy">Nhập khóa quản trị để xem phản hồi của khách và tải danh sách chuẩn Excel.</p>
        <label class="field-label" for="key">Khóa truy cập quản trị</label>
        <div class="key-field">
          <input id="key" type="password" autocomplete="current-password" required autofocus placeholder="Nhập khóa quản trị">
          <button id="toggleKey" class="key-toggle" type="button" aria-label="Hiện khóa truy cập" aria-pressed="false">◉</button>
        </div>
        <p id="loginError" class="notice" role="alert"></p>
        <button id="loginButton" class="button button--primary login-submit" type="submit">Mở bảng quản trị</button>
        <p class="privacy-note">Khóa chỉ tồn tại trong bộ nhớ của tab hiện tại và bị xóa khi bạn đăng xuất, tải lại hoặc đóng trang.</p>
      </form>
    </section>
  </main>

  <div id="dashboard" hidden>
    <header class="topbar">
      <a class="brand" href="https://ngo-nam-nhat-mai-wedding.vercel.app/" aria-label="Về trang thiệp cưới">
        <span class="brand-mark" aria-hidden="true">N&amp;M</span>
        <span class="brand-copy"><strong>Wedding desk</strong><small>Ngô Nam · Nhật Mai</small></span>
      </a>
      <div class="topbar-right">
        <div class="sync-label"><span><i class="live-dot"></i>Dữ liệu cập nhật</span><time id="updatedAt">—</time></div>
        <button id="refresh" class="button" type="button" aria-label="Làm mới dữ liệu"><span class="button-icon" aria-hidden="true">↻</span><span class="button-copy">Làm mới</span></button>
        <button id="logout" class="button button--danger" type="button" aria-label="Đăng xuất quản trị"><span class="button-icon" aria-hidden="true">↪</span><span class="button-copy">Đăng xuất</span></button>
      </div>
    </header>

    <main class="dashboard-shell">
      <section class="welcome" aria-labelledby="dashboardTitle">
        <div><p class="eyebrow">Tổng quan ngày cưới</p><h1 id="dashboardTitle">Mọi điều quan trọng,<br>ở cùng một nơi.</h1></div>
        <p class="welcome-note">Số liệu được tổng hợp trực tiếp từ phản hồi của khách mời. Danh sách bên dưới hiển thị 40 mục gần nhất.</p>
      </section>
      <p id="dashboardError" class="notice" role="alert"></p>

      <section id="stats" class="stats" aria-label="Thống kê tổng quan"></section>

      <p id="insightsHelp" class="insights-help">Vuốt ngang hoặc dùng phím mũi tên để xem đủ ba biểu đồ.</p>
      <section class="insights" tabindex="0" aria-label="Biểu đồ tổng quan" aria-describedby="insightsHelp">
        <article class="insight">
          <div class="insight-heading"><div><p class="eyebrow">Tỷ lệ phản hồi</p><h2>Khách xác nhận tham dự</h2></div><span id="attendanceResponseCount" class="insight-note"></span></div>
          <div class="donut-layout">
            <div id="attendanceDonut" class="donut" role="img" aria-label="Chưa có dữ liệu"><strong id="attendancePercent">0%</strong></div>
            <div class="legend">
              <div class="legend-row"><span class="legend-label"><i class="swatch"></i>Tham dự</span><strong id="attendingResponses">0</strong></div>
              <div class="legend-row"><span class="legend-label"><i class="swatch swatch--soft"></i>Không tham dự</span><strong id="declinedResponses">0</strong></div>
            </div>
          </div>
        </article>
        <article class="insight">
          <div class="insight-heading"><div><p class="eyebrow">Phân bổ khách</p><h2>Hai bên gia đình</h2></div></div>
          <div class="metric-stack">
            <div class="metric-row"><div class="metric-copy"><span>Nhà trai</span><strong id="groomMetric">0 khách</strong></div><div class="bar"><div id="groomBar" class="bar-fill"></div></div></div>
            <div class="metric-row"><div class="metric-copy"><span>Nhà gái</span><strong id="brideMetric">0 khách</strong></div><div class="bar"><div id="brideBar" class="bar-fill bar-fill--rose"></div></div></div>
          </div>
        </article>
        <article class="insight">
          <div class="insight-heading"><div><p class="eyebrow">Kiểm duyệt</p><h2>Trạng thái lời chúc</h2></div></div>
          <div class="metric-stack">
            <div class="metric-row"><div class="metric-copy"><span>Đang hiển thị</span><strong id="visibleMetric">0</strong></div><div class="bar"><div id="visibleBar" class="bar-fill bar-fill--sage"></div></div></div>
            <div class="metric-row"><div class="metric-copy"><span>Đã ẩn</span><strong id="hiddenMetric">0</strong></div><div class="bar"><div id="hiddenBar" class="bar-fill bar-fill--rose"></div></div></div>
          </div>
        </article>
      </section>

      <section class="data-panel" aria-labelledby="rsvpTitle">
        <header class="panel-head">
          <div>
            <div class="panel-title-wrap"><div><p class="eyebrow">Danh sách khách</p><h2 id="rsvpTitle">Xác nhận tham dự</h2></div><span id="rsvpCount" class="count-pill"></span></div>
            <p class="panel-export-note">Excel gồm tối đa 250 phản hồi mới nhất; CSV gồm tối đa 10.000 phản hồi.</p>
          </div>
          <div class="panel-actions">
            <button id="exportRsvp" class="button button--excel" type="button"><span class="button-icon" aria-hidden="true">↓</span><span>Tải Excel (.xlsx)</span></button>
            <button id="exportRsvpCsv" class="button button--csv" type="button"><span class="button-icon" aria-hidden="true">↓</span><span>Tải CSV (.csv)</span></button>
          </div>
        </header>
        <div class="toolbar" aria-label="Lọc xác nhận tham dự">
          <label><span class="sr-only">Tìm tên khách</span><input id="rsvpSearch" class="control search-control" type="search" placeholder="Tìm theo tên khách…" autocomplete="off"></label>
          <label><span class="sr-only">Lọc phía gia đình</span><select id="rsvpSide" class="control"><option value="all">Tất cả gia đình</option><option value="groom">Nhà trai</option><option value="bride">Nhà gái</option></select></label>
          <label><span class="sr-only">Lọc trạng thái tham dự</span><select id="rsvpAttend" class="control"><option value="all">Tất cả phản hồi</option><option value="yes">Sẽ tham dự</option><option value="no">Không tham dự</option></select></label>
          <button id="clearRsvpFilters" class="button filter-reset" type="button">Xóa bộ lọc</button>
        </div>
        <p id="rsvpFilterSummary" class="filter-summary" aria-live="polite"></p>
        <div class="table-wrap">
          <table>
            <thead><tr><th scope="col">Khách mời</th><th scope="col">Gia đình</th><th scope="col">Phản hồi</th><th scope="col">Số khách</th><th scope="col">Thời gian</th><th scope="col">Thao tác</th></tr></thead>
            <tbody id="rsvps"></tbody>
          </table>
          <div id="rsvpEmpty" class="empty" hidden><span class="empty-mark" aria-hidden="true">✉</span><h3>Chưa tìm thấy phản hồi</h3><p>Hãy thay đổi từ khóa hoặc bộ lọc để xem kết quả khác.</p></div>
        </div>
      </section>

      <section class="data-panel" aria-labelledby="messageTitle">
        <header class="panel-head">
          <div>
            <div class="panel-title-wrap"><div><p class="eyebrow">Guestbook</p><h2 id="messageTitle">Lời chúc gửi đến hai bạn</h2></div><span id="messageCount" class="count-pill"></span></div>
            <p class="panel-export-note">Excel gồm tối đa 250 lời chúc mới nhất; CSV gồm tối đa 10.000 lời chúc.</p>
          </div>
          <div class="panel-actions">
            <button id="exportMessages" class="button button--excel" type="button"><span class="button-icon" aria-hidden="true">↓</span><span>Tải Excel (.xlsx)</span></button>
            <button id="exportMessagesCsv" class="button button--csv" type="button"><span class="button-icon" aria-hidden="true">↓</span><span>Tải CSV (.csv)</span></button>
          </div>
        </header>
        <div class="toolbar toolbar--messages" aria-label="Lọc lời chúc">
          <label><span class="sr-only">Tìm lời chúc</span><input id="messageSearch" class="control search-control" type="search" placeholder="Tìm tên hoặc nội dung lời chúc…" autocomplete="off"></label>
          <label><span class="sr-only">Lọc trạng thái lời chúc</span><select id="messageVisibility" class="control"><option value="all">Tất cả trạng thái</option><option value="visible">Đang hiển thị</option><option value="hidden">Đã ẩn</option></select></label>
          <button id="clearMessageFilters" class="button filter-reset" type="button">Xóa bộ lọc</button>
        </div>
        <p id="messageFilterSummary" class="filter-summary" aria-live="polite"></p>
        <div id="messages" class="message-list"></div>
        <div id="messageEmpty" class="empty" hidden><span class="empty-mark" aria-hidden="true">♡</span><h3>Chưa tìm thấy lời chúc</h3><p>Hãy thay đổi từ khóa hoặc trạng thái để xem kết quả khác.</p></div>
      </section>
    </main>
    <footer class="footer">Ngô Nam <span aria-hidden="true">♡</span> Nhật Mai</footer>
  </div>

  <div id="toast" class="toast" role="status" aria-live="polite" aria-atomic="true"><span id="toastIcon" class="toast-icon" aria-hidden="true">✓</span><p id="toastMessage"></p></div>

  <script>
    (() => {
      let token = "";
      let data = null;
      let busyRowId = "";
      let exporting = "";
      let toastTimer = 0;
      const $ = (id) => document.getElementById(id);
      const text = (tag, className, value) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        node.textContent = value;
        return node;
      };
      const formatNumber = (value) => new Intl.NumberFormat("vi-VN").format(Number(value || 0));
      const formatDate = (value) => {
        const date = new Date(value);
        return Number.isFinite(date.getTime())
          ? new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" }).format(date)
          : "—";
      };
      const isoDate = (value) => {
        const date = new Date(value);
        return Number.isFinite(date.getTime()) ? date.toISOString() : "";
      };
      const percent = (part, total) => total > 0 ? Math.round((Number(part || 0) / Number(total)) * 100) : 0;
      const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLocaleLowerCase("vi-VN").trim();
      const showError = (target, message) => {
        target.textContent = message || "";
        target.classList.toggle("show", Boolean(message));
      };
      const showToast = (message, kind) => {
        const toast = $("toast");
        $("toastMessage").textContent = message;
        $("toastIcon").textContent = kind === "error" ? "!" : "✓";
        toast.setAttribute("role", kind === "error" ? "alert" : "status");
        toast.setAttribute("aria-live", kind === "error" ? "assertive" : "polite");
        toast.classList.toggle("toast--error", kind === "error");
        toast.classList.add("show");
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => toast.classList.remove("show"), 4200);
      };
      const readError = async (response) => {
        try {
          const value = await response.json();
          if (typeof value.error === "string") return value.error;
        } catch {}
        return "Yêu cầu không thành công. Vui lòng thử lại.";
      };
      const request = async (path, options = {}) => {
        const headers = new Headers(options.headers || {});
        headers.set("Authorization", "Bearer " + token);
        const response = await fetch(path, { ...options, headers, cache: "no-store" });
        if (!response.ok) {
          const error = new Error(await readError(response));
          error.status = response.status;
          throw error;
        }
        return response;
      };
      const stat = (label, value, detail, featured) => {
        const card = text("article", "stat" + (featured ? " stat--featured" : ""), "");
        card.append(
          text("span", "stat-label", label),
          text("strong", "stat-value", formatNumber(value)),
          text("span", "stat-detail", detail)
        );
        return card;
      };
      const actionButton = (label, className, action, disabled, ariaLabel) => {
        const node = text("button", "button button--small " + (className || ""), label);
        node.type = "button";
        node.disabled = Boolean(disabled);
        if (ariaLabel) node.setAttribute("aria-label", ariaLabel);
        node.addEventListener("click", action);
        return node;
      };
      const setBar = (id, value) => { $(id).style.width = Math.min(100, Math.max(0, value)) + "%"; };
      const filenameFrom = (response, fallback) => {
        const disposition = response.headers.get("Content-Disposition") || "";
        const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i);
        if (encoded) {
          try { return decodeURIComponent(encoded[1]); } catch {}
        }
        const plain = disposition.match(/filename="([^"]+)"/i);
        return plain ? plain[1] : fallback;
      };
      function handleAuthError(error) {
        if (error && error.status === 401) {
          token = "";
          data = null;
          $("key").value = "";
          $("key").type = "password";
          $("toggleKey").setAttribute("aria-pressed", "false");
          $("toggleKey").setAttribute("aria-label", "Hiện khóa truy cập");
          $("dashboard").hidden = true;
          $("login").hidden = false;
          $("toast").classList.remove("show");
          window.clearTimeout(toastTimer);
          showError($("loginError"), "Khóa quản trị không còn hợp lệ. Vui lòng đăng nhập lại.");
          $("key").focus();
          return true;
        }
        return false;
      }
      async function load(quiet) {
        const refreshWasFocused = !quiet && document.activeElement === $("refresh");
        showError($("dashboardError"), "");
        if (!quiet) {
          $("refresh").disabled = true;
          $("refresh").setAttribute("aria-busy", "true");
        }
        try {
          const response = await request("/api/admin/dashboard");
          data = await response.json();
          render();
          return true;
        } catch (error) {
          if (!handleAuthError(error)) {
            const message = error instanceof Error ? error.message : "Không thể tải dữ liệu.";
            if ($("dashboard").hidden) showError($("dashboardError"), message);
            else showToast(message, "error");
          }
          return false;
        } finally {
          $("refresh").disabled = false;
          $("refresh").removeAttribute("aria-busy");
          if (refreshWasFocused && !$("dashboard").hidden) $("refresh").focus();
        }
      }
      function render() {
        const s = data.stats;
        $("stats").replaceChildren(
          stat("Khách sẽ tham dự", s.rsvps.attendingGuests, s.rsvps.attendingResponses + " lượt xác nhận có mặt", true),
          stat("Tổng phản hồi", s.rsvps.totalResponses, s.rsvps.declinedResponses + " lượt báo không tham dự"),
          stat("Lời chúc đang hiện", s.messages.visible, s.messages.hidden + " lời chúc đã được ẩn"),
          stat("Tất cả lời chúc", s.messages.total, "Được lưu an toàn trên hệ thống")
        );
        $("updatedAt").textContent = formatDate(data.generatedAt);
        $("updatedAt").dateTime = isoDate(data.generatedAt);
        const attendance = percent(s.rsvps.attendingResponses, s.rsvps.totalResponses);
        $("attendanceDonut").style.setProperty("--value", String(attendance));
        $("attendanceDonut").setAttribute("aria-label", attendance + "% phản hồi sẽ tham dự");
        $("attendancePercent").textContent = attendance + "%";
        $("attendanceResponseCount").textContent = formatNumber(s.rsvps.totalResponses) + " phản hồi";
        $("attendingResponses").textContent = formatNumber(s.rsvps.attendingResponses);
        $("declinedResponses").textContent = formatNumber(s.rsvps.declinedResponses);
        const familyTotal = Number(s.rsvps.groomGuests || 0) + Number(s.rsvps.brideGuests || 0);
        $("groomMetric").textContent = formatNumber(s.rsvps.groomGuests) + " khách";
        $("brideMetric").textContent = formatNumber(s.rsvps.brideGuests) + " khách";
        setBar("groomBar", percent(s.rsvps.groomGuests, familyTotal));
        setBar("brideBar", percent(s.rsvps.brideGuests, familyTotal));
        $("visibleMetric").textContent = formatNumber(s.messages.visible);
        $("hiddenMetric").textContent = formatNumber(s.messages.hidden);
        setBar("visibleBar", percent(s.messages.visible, s.messages.total));
        setBar("hiddenBar", percent(s.messages.hidden, s.messages.total));
        $("rsvpCount").textContent = formatNumber(data.rsvps.length) + " gần nhất";
        $("messageCount").textContent = formatNumber(data.messages.length) + " gần nhất";
        renderRsvps();
        renderMessages();
      }
      function renderRsvps() {
        const list = $("rsvps");
        list.replaceChildren();
        const query = normalize($("rsvpSearch").value);
        const side = $("rsvpSide").value;
        const attend = $("rsvpAttend").value;
        const filtered = data.rsvps.filter((item) =>
          (!query || normalize(item.name).includes(query)) &&
          (side === "all" || item.side === side) &&
          (attend === "all" || item.attend === attend)
        );
        $("rsvpFilterSummary").textContent = "Đang hiển thị " + formatNumber(filtered.length) + "/" + formatNumber(data.rsvps.length) + " phản hồi gần nhất.";
        const empty = $("rsvpEmpty");
        empty.hidden = filtered.length > 0;
        if (!filtered.length) {
          empty.querySelector("h3").textContent = data.rsvps.length ? "Chưa tìm thấy phản hồi" : "Chưa có xác nhận nào";
          empty.querySelector("p").textContent = data.rsvps.length ? "Hãy thay đổi từ khóa hoặc bộ lọc để xem kết quả khác." : "Danh sách sẽ xuất hiện khi khách mời gửi phản hồi.";
        }
        filtered.forEach((item) => {
          const row = document.createElement("tr");
          const person = text("td", "person", "");
          person.dataset.label = "Khách mời";
          person.append(text("strong", "", item.name), text("small", "", item.id.slice(0, 18) + "…"));
          const family = text("td", "", item.side === "groom" ? "Nhà trai" : "Nhà gái");
          family.dataset.label = "Gia đình";
          const response = text("td", "", "");
          response.dataset.label = "Phản hồi";
          response.append(text("span", "status-pill " + (item.attend === "yes" ? "" : "status-pill--no"), item.attend === "yes" ? "Tham dự" : "Không tham dự"));
          const guests = text("td", "", formatNumber(item.guestCount));
          guests.dataset.label = "Số khách";
          const time = text("td", "cell-muted", formatDate(item.createdAt));
          time.dataset.label = "Thời gian";
          const actions = text("td", "", "");
          actions.dataset.label = "Thao tác";
          const actionWrap = text("div", "row-actions", "");
          actionWrap.append(actionButton("Xóa xác nhận", "button--danger", async () => {
            if (!confirm("Xóa vĩnh viễn xác nhận của “" + item.name + "”? Số liệu thống kê sẽ được tính lại.")) return;
            await mutate({ action: "delete-rsvp", id: item.id }, "Đã xóa xác nhận của " + item.name + ".");
          }, busyRowId === item.id, "Xóa xác nhận của " + item.name));
          actions.append(actionWrap);
          row.append(person, family, response, guests, time, actions);
          list.append(row);
        });
      }
      function renderMessages() {
        const list = $("messages");
        list.replaceChildren();
        const query = normalize($("messageSearch").value);
        const visibility = $("messageVisibility").value;
        const filtered = data.messages.filter((item) =>
          (!query || normalize(item.name + " " + item.body).includes(query)) &&
          (visibility === "all" || (visibility === "visible" ? item.visible : !item.visible))
        );
        $("messageFilterSummary").textContent = "Đang hiển thị " + formatNumber(filtered.length) + "/" + formatNumber(data.messages.length) + " lời chúc gần nhất.";
        const empty = $("messageEmpty");
        empty.hidden = filtered.length > 0;
        if (!filtered.length) {
          empty.querySelector("h3").textContent = data.messages.length ? "Chưa tìm thấy lời chúc" : "Chưa có lời chúc nào";
          empty.querySelector("p").textContent = data.messages.length ? "Hãy thay đổi từ khóa hoặc trạng thái để xem kết quả khác." : "Lời chúc sẽ xuất hiện khi khách mời gửi lời nhắn đầu tiên.";
        }
        filtered.forEach((item) => {
          const card = text("article", "message-card" + (item.visible ? "" : " message-card--hidden"), "");
          const avatar = text("div", "message-avatar", item.name.trim().charAt(0).toLocaleUpperCase("vi-VN") || "♡");
          avatar.setAttribute("aria-hidden", "true");
          const main = text("div", "message-main", "");
          const meta = text("div", "message-meta", "");
          const identity = text("div", "", "");
          const time = text("time", "", formatDate(item.createdAt));
          const iso = isoDate(item.createdAt);
          if (iso) time.dateTime = iso;
          identity.append(text("strong", "", item.name), time);
          meta.append(identity, text("span", "status-pill " + (item.visible ? "" : "status-pill--hidden"), item.visible ? "Đang hiển thị" : "Đã ẩn"));
          main.append(meta, text("p", "message-body", item.body));
          const actions = text("div", "message-actions", "");
          actions.append(
            actionButton(item.visible ? "Ẩn" : "Hiện lại", "", async () => {
              if (item.visible && !confirm("Ẩn lời chúc của “" + item.name + "” khỏi trang thiệp? Bạn có thể hiện lại sau.")) return;
              await mutate({ action: "set-message-visibility", id: item.id, visible: !item.visible }, item.visible ? "Đã ẩn lời chúc." : "Đã hiện lại lời chúc.");
            }, busyRowId === item.id, (item.visible ? "Ẩn lời chúc của " : "Hiện lại lời chúc của ") + item.name),
            actionButton("Xóa", "button--danger", async () => {
              if (!confirm("Xóa vĩnh viễn lời chúc của “" + item.name + "”? Thao tác này không thể khôi phục.")) return;
              await mutate({ action: "delete-message", id: item.id }, "Đã xóa lời chúc.");
            }, busyRowId === item.id, "Xóa lời chúc của " + item.name)
          );
          card.append(avatar, main, actions);
          list.append(card);
        });
      }
      async function mutate(body, successMessage) {
        const activeButton = document.activeElement instanceof HTMLButtonElement ? document.activeElement : null;
        const actionRoot = activeButton ? activeButton.closest("tr, .message-card") : null;
        const rowButtons = actionRoot ? Array.from(actionRoot.querySelectorAll("button")) : [];
        let focusMoved = false;
        rowButtons.forEach((button) => {
          button.disabled = true;
          button.setAttribute("aria-busy", "true");
        });
        busyRowId = body.id;
        showError($("dashboardError"), "");
        try {
          await request("/api/admin/dashboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
          busyRowId = "";
          const refreshed = await load(true);
          if (refreshed) {
            showToast(successMessage, "success");
            $(body.action === "delete-rsvp" ? "rsvpSearch" : "messageSearch").focus();
            focusMoved = true;
          }
        } catch (error) {
          if (!handleAuthError(error)) {
            const message = error instanceof Error ? error.message : "Không thể cập nhật dữ liệu.";
            showToast(message, "error");
          }
        } finally {
          busyRowId = "";
          rowButtons.forEach((button) => {
            if (button.isConnected) {
              button.disabled = false;
              button.removeAttribute("aria-busy");
            }
          });
          if (!focusMoved && activeButton && activeButton.isConnected && !$("dashboard").hidden) {
            activeButton.focus();
          }
        }
      }
      const exportButtons = [
        { id: "exportRsvp", type: "rsvps", format: "xlsx", label: "Tải Excel (.xlsx)" },
        { id: "exportRsvpCsv", type: "rsvps", format: "csv", label: "Tải CSV (.csv)" },
        { id: "exportMessages", type: "messages", format: "xlsx", label: "Tải Excel (.xlsx)" },
        { id: "exportMessagesCsv", type: "messages", format: "csv", label: "Tải CSV (.csv)" }
      ];
      function setExportState(type, format) {
        exporting = type && format ? type + ":" + format : "";
        exportButtons.forEach((config) => {
          const button = $(config.id);
          const active = exporting === config.type + ":" + config.format;
          button.disabled = Boolean(exporting);
          button.setAttribute("aria-busy", active ? "true" : "false");
          button.lastElementChild.textContent = active ? "Đang chuẩn bị…" : config.label;
        });
      }
      async function exportWorkbook(type, format) {
        if (exporting) return;
        const trigger = document.activeElement instanceof HTMLButtonElement ? document.activeElement : null;
        setExportState(type, format);
        showError($("dashboardError"), "");
        let url = "";
        let anchor = null;
        try {
          const path = format === "xlsx"
            ? "/api/admin/export?type=" + type + "&format=xlsx"
            : "/api/admin/export?type=" + type + "&format=csv";
          const response = await request(path);
          const contentType = (response.headers.get("Content-Type") || "").toLocaleLowerCase("en-US").split(";")[0].trim();
          const expectedType = format === "xlsx"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "text/csv";
          if (contentType !== expectedType) {
            throw new Error("Máy chủ trả về định dạng file không hợp lệ.");
          }
          const extension = format === "xlsx" ? ".xlsx" : ".csv";
          const fallback = (type === "rsvps" ? "xac-nhan-tham-du" : "loi-chuc") + extension;
          const filename = filenameFrom(response, fallback);
          const blob = await response.blob();
          if (blob.size < 4) throw new Error("File tải về đang trống.");
          if (format === "xlsx") {
            const signature = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
            if (signature[0] !== 0x50 || signature[1] !== 0x4b || signature[2] !== 0x03 || signature[3] !== 0x04) {
              throw new Error("File Excel nhận được không hợp lệ.");
            }
          }
          url = URL.createObjectURL(blob);
          anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = filename;
          document.body.appendChild(anchor);
          anchor.click();
          showToast("Đã tải file “" + filename + "”. Bạn có thể mở trực tiếp bằng Excel.", "success");
        } catch (error) {
          if (!handleAuthError(error)) {
            const message = error instanceof Error ? error.message : "Không thể xuất dữ liệu.";
            showToast(message, "error");
          }
        } finally {
          if (anchor && anchor.isConnected) anchor.remove();
          if (url) window.setTimeout(() => URL.revokeObjectURL(url), 1500);
          setExportState("", "");
          if (trigger && trigger.isConnected && !$("dashboard").hidden) trigger.focus();
        }
      }
      $("loginForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        token = $("key").value.trim();
        if (!token) return;
        $("loginButton").disabled = true;
        $("loginButton").textContent = "Đang kiểm tra…";
        showError($("loginError"), "");
        try {
          const loaded = await load(false);
          if (loaded) {
            $("login").hidden = true;
            $("dashboard").hidden = false;
            $("key").value = "";
            $("key").type = "password";
            $("toggleKey").setAttribute("aria-pressed", "false");
            $("toggleKey").setAttribute("aria-label", "Hiện khóa truy cập");
            $("refresh").focus();
          } else if (token) {
            const message = $("dashboardError").textContent || "Không thể kết nối máy chủ. Vui lòng thử lại.";
            token = "";
            showError($("dashboardError"), "");
            showError($("loginError"), message);
          }
        } catch (error) {
          token = "";
          showError($("loginError"), error instanceof Error ? error.message : "Không thể kết nối máy chủ.");
        } finally {
          $("loginButton").disabled = false;
          $("loginButton").textContent = "Mở bảng quản trị";
        }
      });
      $("toggleKey").addEventListener("click", () => {
        const showing = $("key").type === "text";
        $("key").type = showing ? "password" : "text";
        $("toggleKey").setAttribute("aria-pressed", showing ? "false" : "true");
        $("toggleKey").setAttribute("aria-label", showing ? "Hiện khóa truy cập" : "Ẩn khóa truy cập");
        $("key").focus();
      });
      $("refresh").addEventListener("click", async () => {
        if (await load(false)) showToast("Dữ liệu đã được làm mới.", "success");
      });
      $("exportRsvp").addEventListener("click", () => exportWorkbook("rsvps", "xlsx"));
      $("exportRsvpCsv").addEventListener("click", () => exportWorkbook("rsvps", "csv"));
      $("exportMessages").addEventListener("click", () => exportWorkbook("messages", "xlsx"));
      $("exportMessagesCsv").addEventListener("click", () => exportWorkbook("messages", "csv"));
      $("logout").addEventListener("click", () => {
        token = "";
        data = null;
        busyRowId = "";
        exporting = "";
        $("dashboard").hidden = true;
        $("login").hidden = false;
        $("key").value = "";
        $("key").type = "password";
        $("toggleKey").setAttribute("aria-pressed", "false");
        $("toggleKey").setAttribute("aria-label", "Hiện khóa truy cập");
        $("toast").classList.remove("show");
        window.clearTimeout(toastTimer);
        showError($("loginError"), "");
        $("key").focus();
      });
      ["rsvpSearch", "rsvpSide", "rsvpAttend"].forEach((id) => $(id).addEventListener(id === "rsvpSearch" ? "input" : "change", renderRsvps));
      ["messageSearch", "messageVisibility"].forEach((id) => $(id).addEventListener(id === "messageSearch" ? "input" : "change", renderMessages));
      $("clearRsvpFilters").addEventListener("click", () => {
        $("rsvpSearch").value = "";
        $("rsvpSide").value = "all";
        $("rsvpAttend").value = "all";
        renderRsvps();
        $("rsvpSearch").focus();
      });
      $("clearMessageFilters").addEventListener("click", () => {
        $("messageSearch").value = "";
        $("messageVisibility").value = "all";
        renderMessages();
        $("messageSearch").focus();
      });
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
