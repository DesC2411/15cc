## 2026-11-09 — Kiểm tra dự án + Giai đoạn 0 (khởi tạo)

**Giai đoạn:** 0 · **Khu:** central

**Đã làm:**
- Kiểm tra hiện trạng: lúc đầu chỉ có `CLAUDE.md` và `worklogs/`. Máy có Node v24.21.0, npm 11.19.0, git 2.55.0.
- `git init`, thêm `.gitignore` (bỏ qua `node_modules`, `dist`, `.env*`, `assets-src/models-raw/*`). **Chưa commit.**
- npm workspaces ở gốc (`package.json`): `npm run dev` chạy cùng lúc server và client bằng `concurrently`; thêm `typecheck`, `build`.
- `server/`: Colyseus 0.18.12 + @colyseus/schema 5. Phòng `zone` (`server/src/rooms/ZoneRoom.ts`) lọc theo `zone`, tối đa 50 người, patchRate 50ms, có tin nhắn `move` (kiểm tra dữ liệu, giới hạn toạ độ ±500 m). State ở `server/src/rooms/schema/ZoneState.ts`.
- `client/`: Vite 8 + React 19 + TS 7 (strict) + R3F 9 + drei + zustand + @colyseus/sdk 0.18. Đã cài `@react-three/rapier` nhưng chưa dùng.
  - `src/scenes/central/CentralScene.tsx`: mặt đất, đường tạm, khối grey-box đọc từ `content/landmarks.json`, OrbitControls tạm.
  - `src/net/connection.ts` + `netStore.ts`: vào phòng, chép state vào zustand mỗi patch.
  - `src/components/player/RemotePlayers.tsx`: mỗi người chơi là một capsule (mình đỏ phượng, người khác cam).
  - `src/components/ui/NetStatusBadge.tsx`: hiện trạng thái kết nối và số người.
  - `src/systems/i18n.ts` (chữ đọc từ `content/i18n/vi.json`), `src/systems/content.ts` (kiểm tra dữ liệu landmark khi tải), `src/theme/colors.ts` + biến CSS cho bảng màu, font Be Vietnam Pro.
  - Alias `@content` trỏ tới `../content`.
- `content/`: `landmarks.json` (4 landmark khu Trung tâm), `events.json` (18 sự kiện lấy từ CLAUDE.md mục 6, kèm nguồn), `i18n/vi.json`.
- `assets-src/`: `concepts/PROMPTS.md`, `refs/SOURCES.md`, `CREDITS.md`, thư mục `blend/`, `models-raw/`.
- `README.md`: cách chạy.

**Kiểm tra:**
- `npm run typecheck` và `npm run build` đều qua.
- Chạy `npm run dev` rồi mở 2 tab Chrome: cả hai vào chung phòng, hiện "Khu Trung tâm · 2 người", thấy 2 capsule.
- Lỗi đã sửa trong phiên: trường float32 không có giá trị mặc định nên `y`/`rotY` ra `undefined` → capsule có toạ độ NaN, không hiện. Đã thêm `.default(0)`.
- Đã đổi `shadows="percentage"` vì three r187 bỏ PCFSoftShadowMap.
- **Chưa kiểm tra khung điện thoại 375×812**: lệnh đổi cỡ cửa sổ báo thành công nhưng trang vẫn rộng 1920px (có thể do cửa sổ đang phóng to).

**Quyết định & lý do:**
- Dùng Colyseus 0.18 (bản mới nhất); API mới là `defineServer` / `defineRoom().filterBy(['zone'])`, schema khai báo bằng `schema({...})` + `t.*` (không dùng decorator).
- Một kiểu phòng `zone` cho mọi khu, ghép phòng theo `zone`, thay vì mỗi khu một kiểu phòng.
- Client chưa import schema từ server (để tách gói); giai đoạn 2 có thể chia sẻ kiểu.
- Thẻ Bí Mật trong `landmarks.json` để bản nháp, `verified: false`, chưa có nguồn. `canShowSecret()` chỉ hiện bản nháp ở chế độ dev.

**Vấn đề / lỗi còn tồn tại:**
- Console còn cảnh báo `THREE.Clock: This module has been deprecated`, đến từ bên trong R3F 9.8, không sửa được ở phía mình.
- Bundle client 1,33 MB (371 KB gzip), chủ yếu là three + drei. Sau này tách theo khu.
- npm chặn script cài đặt của `esbuild` và `msgpackr-extract`. Hiện vẫn chạy được (`tsx`, Vite đều ổn), chỉ ghi lại để biết.
- `CLAUDE.md` còn 2 chỗ chưa khớp (chưa sửa): `assets-src/blend/` + `CREDITS.md` không có trong cây thư mục mục 2; `content/secrets.json` (mục 2) và trường `secret` (mục 8) trùng nhau. Đề xuất: bỏ `secrets.json`.
- Toạ độ landmark là tạm, chưa theo bản đồ thật.

**Việc dở dang / bước tiếp theo:**
- [ ] Commit đầu tiên (chờ người dùng đồng ý).
- [ ] Kiểm tra khung 375×812 (DevTools device mode).
- [ ] Giai đoạn 1: điều khiển nhân vật (WASD + joystick ảo), camera đi theo, Rapier, checkpoint landmark → tem + Thẻ Bí Mật.
- [ ] Tra nguồn cho Thẻ Bí Mật 4 landmark (mục 4.2), đặt toạ độ theo bản đồ thật.
- [ ] Sửa 2 chỗ chưa khớp trong `CLAUDE.md`.

**Asset & nội dung:** chưa có asset. Mọi landmark `verified: false`. Sự kiện `verified: false`: bơi trải An Dương, hội vật Cổ Trai, V.League.
