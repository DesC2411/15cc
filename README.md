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

## Điều khiển

| | Máy tính | Điện thoại |
|---|---|---|
| Di chuyển | WASD / phím mũi tên, giữ Shift để chạy | Joystick ảo bên trái (đẩy hết cỡ để chạy) |
| Nhảy | Space | Nút **Nhảy** bên phải |
| Xoay camera | Kéo chuột trên màn hình | Kéo một ngón tay trên màn hình |
| Phóng to / thu nhỏ | Con lăn chuột | Chụm / mở hai ngón tay |

Bước vào vòng tròn đỏ trước mặt tiền landmark để nhận tem và mở Thẻ Bí Mật. Tem tạm lưu trong localStorage (khoá `pdpl-stamps-v1`).

## Thư mục

| Thư mục | Nội dung |
|---|---|
| `client/` | Vite + React + TypeScript + React Three Fiber |
| `server/` | Colyseus 0.18, phòng `zone` (lọc theo khu, tối đa 50 người) |
| `content/` | Dữ liệu nội dung: `landmarks.json`, `events.json`, `zones/<khu>.json` (bố cục đường, hàng cây, nhà nền), `i18n/vi.json` |
| `assets-src/` | Nguồn asset chưa tối ưu, ảnh tham khảo, prompt, ghi công |
| `worklogs/` | Nhật ký mỗi phiên làm việc |
