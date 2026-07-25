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

- `GET /api/messages`: 12 lời chúc công khai mới nhất.
- `POST /api/messages`: gửi lời chúc.
- `POST /api/rsvp`: gửi xác nhận tham dự.
- `/admin`: thống kê, quản lý lời chúc và xuất CSV.

Dữ liệu được lưu trong Cloudflare D1 qua binding `DB`. Production cần hai biến
môi trường bí mật: `ADMIN_TOKEN` và `RATE_LIMIT_SALT`; không đưa giá trị thật
vào repository.

## Kiểm tra

```bash
npm run lint
npm test
```

Bộ test build và integration kiểm tra migration D1, chat, RSVP, chống đếm trùng,
xác thực admin, moderation và giới hạn kích thước request.

Ảnh trên website nằm trong `assets/photos/` và đã được tối ưu sang WebP.
