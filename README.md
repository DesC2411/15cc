# Phượng Đỏ Phiêu Lưu

Web game 3D multiplayer quảng bá du lịch Hải Phòng. Quy định dự án: xem `CLAUDE.md`.

## Chạy thử

```bash
npm install
npm run dev        # server Colyseus (ws://localhost:2567) + client Vite (http://localhost:5173)
```

Mở trên điện thoại cùng Wi-Fi: vào `http://<IP-máy-tính>:5173`. Client tự nối tới server ở cùng máy. Muốn đổi thì đặt `VITE_SERVER_URL` trong `client/.env.local`.

| Lệnh | Việc |
|---|---|
| `npm run dev` | Chạy cả client và server |
| `npm run typecheck` | Kiểm tra kiểu TypeScript cả hai |
| `npm run build` | Build server (`server/dist`) và client (`client/dist`) |

## Thư mục

| Thư mục | Nội dung |
|---|---|
| `client/` | Vite + React + TypeScript + React Three Fiber |
| `server/` | Colyseus 0.18, phòng `zone` (lọc theo khu, tối đa 50 người) |
| `content/` | Dữ liệu nội dung: `landmarks.json`, `events.json`, `i18n/vi.json` |
| `assets-src/` | Nguồn asset chưa tối ưu, ảnh tham khảo, prompt, ghi công |
| `worklogs/` | Nhật ký mỗi phiên làm việc |
