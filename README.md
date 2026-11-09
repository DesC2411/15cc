# Phượng Đỏ Phiêu Lưu

Web game 3D multiplayer quảng bá du lịch Hải Phòng. Quy định dự án: xem `CLAUDE.md`.

## Chạy thử

```bash
npm install
npm run dev        # server Colyseus (ws://localhost:2567) + client Vite (http://localhost:5173)
```

Mở trên điện thoại cùng Wi-Fi: vào `http://<IP-máy-tính>:5173`. Client nối tới server qua cùng địa chỉ, đường dẫn `/colyseus` (Vite chuyển tiếp sang cổng 2567), nên chỉ cần mở cổng 5173. Muốn nối thẳng tới server khác thì đặt `VITE_SERVER_URL` trong `client/.env.local`.

Cho máy ngoài mạng vào (link công khai, chỉ sống khi máy đang chạy `npm run dev`): `tailscale funnel --bg 5173`. Tắt: `tailscale funnel --https=443 off`.

Biến môi trường của server:

| Biến | Tác dụng |
|---|---|
| `PORT` | Cổng server (mặc định 2567) |
| `CHAT_QUICK_ONLY=1` | Phòng chỉ cho dùng câu chat có sẵn, không gõ chữ tự do |
| `REPORT_FILE` | Nơi lưu báo cáo người chơi (mặc định `server/logs/reports.jsonl`, không đưa lên git) |
| `CONTENT_DIR` | Thư mục `content/` khi deploy (mặc định tự tìm ở gốc dự án) |

| Lệnh | Việc |
|---|---|
| `npm run dev` | Chạy cả client và server |
| `npm run typecheck` | Kiểm tra kiểu TypeScript cả hai |
| `npm test` | Test server: bộ lọc từ bậy + test tích hợp phòng chat (tự chạy server ở cổng 2611–2612) |
| `npm run build` | Build server (`server/dist`) và client (`client/dist`) |
| `npm run inbox` | Hộp nhận ảnh (cổng 5199): nhận ảnh ChatGPT gửi thẳng vào `assets-src/` (xem dưới) |

## Hộp nhận ảnh (`tools/asset-inbox.mjs`)

Server nhỏ chỉ nghe `127.0.0.1:5199`, để Claude lưu ảnh ChatGPT vào `assets-src/concepts/` hoặc `assets-src/refs/` mà không phải tải tay qua thư mục Downloads.

- Chỉ nhận request từ `https://chatgpt.com` (hoặc không có Origin, ví dụ curl). Chỉ ghi file `snake_case` có đuôi `.png/.jpg/.webp`, có kiểm tra đúng là ảnh. Không ghi đè file có sẵn, trừ khi thêm `&overwrite=1`.
- Trang ChatGPT chặn `fetch` tới localhost (CSP `connect-src`) nhưng không chặn gửi form, nên ảnh được gửi bằng form `multipart/form-data`, trường `file`. Tab sẽ chuyển sang trang kết quả của localhost, sau đó bấm Back để quay lại cuộc trò chuyện.
- Đoạn JS chạy trong tab ChatGPT (qua `javascript_tool` của Claude in Chrome), nhớ đổi `path`:

```js
const img = [...document.querySelectorAll('img')].find(i => i.naturalWidth >= 512 && i.alt.startsWith('Ảnh được tạo'));
const blob = await fetch(img.src).then(r => r.blob());
const form = Object.assign(document.createElement('form'), { method: 'POST', enctype: 'multipart/form-data',
  action: 'http://127.0.0.1:5199/upload?path=concepts/<khu>/<ten_asset>_v<N>.png' });
const input = Object.assign(document.createElement('input'), { type: 'file', name: 'file' });
const dt = new DataTransfer(); dt.items.add(new File([blob], 'image.png', { type: blob.type }));
input.files = dt.files; form.append(input); document.body.append(form); form.submit();
```

- Có nhiều ảnh trong cuộc trò chuyện thì chọn đúng ảnh trước khi gửi (`find` lấy ảnh đầu tiên khớp).
- Gửi từ máy bằng curl: `curl -F "file=@anh.png" "http://127.0.0.1:5199/upload?path=concepts/central/ten_v1.png"`.

## Điều khiển

| | Máy tính | Điện thoại |
|---|---|---|
| Di chuyển | WASD / phím mũi tên, giữ Shift để chạy | Joystick ảo bên trái (đẩy hết cỡ để chạy) |
| Nhảy | Space | Nút **Nhảy** bên phải |
| Xoay camera | Kéo chuột trên màn hình | Kéo một ngón tay trên màn hình |
| Phóng to / thu nhỏ | Con lăn chuột | Chụm / mở hai ngón tay |
| Chat, emote | Enter hoặc nút 💬 | Nút 💬 bên phải |

Chat: câu có sẵn, emote, gõ chữ (server che từ bậy, gửi tối đa 1 tin / 1,5 giây, che 3 lần trong 1 phút thì khoá chat 1 phút). Bấm ⋯ cạnh tin nhắn để chặn hoặc báo cáo. Tick "Chỉ dùng câu có sẵn" để không gõ và không thấy chữ tự gõ của người khác. Danh sách từ bị che: `content/chat_filter.json`.

Bước vào vòng tròn đỏ trước mặt tiền landmark để nhận tem và mở Thẻ Bí Mật. Tem tạm lưu trong localStorage (khoá `pdpl-stamps-v1`).

## Thư mục

| Thư mục | Nội dung |
|---|---|
| `client/` | Vite + React + TypeScript + React Three Fiber |
| `server/` | Colyseus 0.18, phòng `zone` (lọc theo khu, tối đa 50 người), chat + kiểm duyệt |
| `shared/` | Kiểu và hằng số giao thức dùng chung cho client và server (`protocol.ts`) |
| `content/` | Dữ liệu nội dung: `landmarks.json`, `events.json`, `zones/<khu>.json` (bố cục đường, hàng cây, nhà nền), `chat.json` (câu có sẵn, emote), `chat_filter.json`, `i18n/vi.json` |
| `assets-src/` | Nguồn asset chưa tối ưu, ảnh tham khảo, prompt, ghi công |
| `worklogs/` | Nhật ký mỗi phiên làm việc |
