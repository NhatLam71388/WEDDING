# Thiệp cưới Ngô Nam & Nhật Mai

Website thiệp cưới tương tác, ưu tiên tiệc nhà gái lúc 11:00 thứ Sáu
07/08/2026, có guestbook, xác nhận
tham dự và khu vực quản trị.

## Chạy cục bộ

Yêu cầu Node.js 22.13 trở lên.

```bash
npm ci
npm run dev
```

Mở địa chỉ do Vinext hiển thị. Việc mở trực tiếp file HTML chỉ xem được giao
diện tĩnh, không thể gửi lời chúc hoặc RSVP.

## Backend

Backend production chạy độc lập trên Cloudflare Workers; frontend tĩnh vẫn chạy
trên Vercel. Entry deploy là `worker/api.ts`, không kéo Vinext, ảnh hay toàn bộ
giao diện vào mỗi request API.

Production API: `https://ngo-nam-nhat-mai-wedding-api.vanhung71388.workers.dev`

- `GET /api/messages`: tải lời chúc công khai theo từng trang 12 mục bằng
  `cursor` (tối đa 24 mục mỗi request).
- `POST /api/messages`: gửi lời chúc.
- `POST /api/rsvp`: gửi hoặc cập nhật xác nhận tham dự bằng mã phản hồi riêng
  của thiết bị; họ tên không được dùng làm khóa duy nhất.
- `/admin`: giao diện quản trị nhẹ, không lưu khóa truy cập trong trình duyệt.

Dữ liệu được lưu trong Cloudflare D1 qua binding `DB`. Production cần hai biến
môi trường bí mật: `ADMIN_TOKEN` và `RATE_LIMIT_SALT`; không đưa giá trị thật
vào repository.

### Deploy Cloudflare

Yêu cầu đăng nhập Wrangler và dùng Node.js 22.13 trở lên:

```bash
npm run db:migrate:remote
npm run deploy:worker
```

Workflow `.github/workflows/deploy-cloudflare.yml` tự kiểm tra, migrate D1 và
deploy backend khi push `main`. Repository GitHub cần hai Actions secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN` có quyền chỉnh sửa Workers và D1

Secret runtime của Worker được cấu hình một lần bằng `wrangler secret put` và
được Cloudflare giữ lại qua các lần deploy.

## Kiểm tra

```bash
npm run lint
npm test
```

Bộ test build và integration kiểm tra migration D1, chat, RSVP, chống đếm trùng,
xác thực admin, moderation và giới hạn kích thước request.

Ảnh trên website nằm trong `assets/photos/` và đã được tối ưu sang WebP.
