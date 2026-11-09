## 2026-11-09 — Giai đoạn 1: grey-box khu Trung tâm

**Giai đoạn:** 1 · **Khu:** central

**Đã làm:**
- Người dùng yêu cầu "tiếp giai đoạn 2", nhưng worklog cho thấy giai đoạn 1 chưa làm. Đã hỏi, người dùng chọn **làm trọn giai đoạn 1 trước**.
- Bố cục khu tách ra file dữ liệu `content/zones/central.json`: đường, quảng trường/sân trước landmark, hàng phượng, khối nhà nền, điểm xuất hiện, giới hạn khu. Đọc qua `zoneLayout()` và `treePositions()` trong `client/src/systems/content.ts`.
- `content/landmarks.json`: dời Bưu điện về `[42,0,-20]`, Bảo tàng về `[-42,0,-19]` để mặt tiền (+Z) quay ra trục đường chính. Vẫn là toạ độ tạm.
- Vật lý Rapier (`<Physics timeStep="vary">` trong `App.tsx`): collider hộp cho landmark và nhà nền, trụ cho thân cây, mặt đất, tường vô hình ở rìa khu (`components/world/ZoneGround.tsx`, `Landmarks.tsx`, `FlamboyantTrees.tsx`).
- Nhân vật (`components/player/LocalPlayer.tsx`): capsule đỏ phượng 1,8 m, Rapier character controller (autostep, bám đất, dốc 50°), đi 4,5 m/s, chạy 8 m/s, nhảy, rơi khỏi map thì về điểm xuất hiện. Camera đi theo, có raycast để không chui vào tường.
- Điều khiển: `systems/input.ts` (WASD/mũi tên, Shift chạy, Space nhảy); `components/ui/TouchControls.tsx` (joystick ảo trái, nút Nhảy phải, chỉ hiện khi màn cảm ứng hoặc rộng ≤ 820px); `components/player/CameraDrag.tsx` (kéo để xoay, con lăn hoặc chụm 2 ngón để zoom).
- Hàng phượng instancing (2 draw call cho cả hàng), màu và kích thước lệch nhẹ theo vị trí (ổn định, mọi người chơi thấy giống nhau).
- Checkpoint landmark: vòng tròn trước mặt tiền (`checkpointOf()`), tem xoay lơ lửng, nhãn tên. Bước vào thì `systems/checkpoints.ts` → `systems/stamps.ts` (zustand + persist localStorage, khoá `pdpl-stamps-v1`) ghi tem và mở `components/ui/SecretCard.tsx`: "Nhận tem mới!", "Có thể bạn chưa biết", nút Chỉ đường (mapsUrl), Đặt tour (tắt, "Sắp có"). Vòng đổi sang vàng khi đã có tem. Bộ đếm `StampCounter` ("Tem 1/4").
- `components/world/SunLight.tsx`: shadow map 1024 phủ 60×60 m và đi theo nhân vật, thay cho bóng 2048 phủ cả khu. `dpr` giảm còn `[1, 1.5]` cho điện thoại.
- `net/connection.ts`: thêm `sendMove()` gửi vị trí tối đa 10 lần/giây, chỉ khi có thay đổi. `RemotePlayers` bỏ chính mình. **Chưa nội suy** (để giai đoạn 2).
- Mọi chữ mới nằm trong `content/i18n/vi.json` (`hud.*`, `card.*`). README thêm bảng điều khiển.

**Kiểm tra:**
- `npm run typecheck`, `oxlint`, `npm run build` đều qua.
- Chrome extension **không kết nối** được trong phiên này, nên đã kiểm tra bằng Chrome headless điều khiển qua DevTools Protocol (script tạm ở scratchpad, không nằm trong repo; render phần mềm SwiftShader):
  - Khung **375×812** (giả lập mobile + cảm ứng): badge, bộ đếm tem, joystick, nút Nhảy nằm đúng chỗ. Giữ W đi tới Nhà hát lớn → nhận tem, thẻ hiện đúng, "Tem 1/4", localStorage có tem. Joystick cảm ứng kéo xuống → nhân vật đi lùi. Nút Nhảy → nhân vật bật lên.
  - Desktop 1280×800: không hiện joystick, A/D/W chạy đúng.
  - 2 tab: tab B hiện "2 người" và thấy capsule cam của tab A di chuyển.
  - Console: không có lỗi, chỉ 2 cảnh báo từ thư viện (`THREE.Clock` deprecated từ R3F, "deprecated parameters for the initialization function" từ rapier3d-compat).
- **FPS chưa kiểm tra được trên máy thật**: headless dùng render phần mềm, đo được 30–50 FPS khi đứng yên, 13–16 FPS khi di chuyển. Con số này không phản ánh GPU thật. Cần mở trên điện thoại thật hoặc Chrome thường.
- Lỗi đã sửa trong phiên: tạo character controller bằng `useMemo` + gỡ trong `useEffect` bị StrictMode gỡ mất → `computeColliderMovement` của undefined. Đã chuyển sang tạo + gỡ trong cùng một effect. Nhãn tên landmark dùng `distanceFactor` phóng to tràn màn hình khi đứng gần → đổi thành cỡ cố định 13px. Nút "Đặt tour · Sắp có" xuống dòng ở 375px → tách thành 2 dòng chữ.

**Chia sẻ link ra Internet (cuối phiên):**
- Người dùng cần máy ngoài LAN vào được. `client/vite.config.ts`: proxy `/colyseus` (có WebSocket) → `localhost:2567`, `allowedHosts: ['.ts.net']`. `net/connection.ts`: client mặc định nối `${location.origin}/colyseus` (vẫn đổi được bằng `VITE_SERVER_URL`). Nhờ vậy chỉ cần mở 1 cổng, chạy được qua https/wss.
- Người dùng chọn công khai bằng **Tailscale Funnel** và tự bật Funnel trong trang admin Tailscale. Đã chạy `tailscale funnel --bg 5173` → **https://desktop-q7td65i.tailac1e8d.ts.net** (cấu hình chạy nền, còn giữ sau khi tắt terminal). Tắt bằng `tailscale funnel --https=443 off` hoặc `tailscale funnel reset`.
- Kiểm tra: DNS công khai (dns.google, Cloudflare) trỏ về relay 103.84.155.x. Gọi trang và matchmake qua relay đều trả 200. Test 2 tab headless trên link https thấy "2 người", không lỗi.
- Lưu ý: đây là server dev, ai có link đều đọc được mã nguồn client và `content/` (Vite vẫn chặn `.env`). Link chỉ sống khi máy bật và `npm run dev` đang chạy.

**Quyết định & lý do:**
- Kiểm tra checkpoint bằng khoảng cách trong JS, không dùng sensor của Rapier: Rapier mặc định không báo va chạm giữa body kinematic và fixed, và với vài landmark mỗi khu thì tính khoảng cách là đủ rẻ, dễ đoán.
- `timeStep="vary"` và vẽ nhân vật tách khỏi RigidBody: camera, nhân vật và vật lý luôn cùng một vị trí, không giật do nội suy.
- Thẻ Bí Mật mở lại mỗi lần bước vào vòng (tem chỉ cộng lần đầu).
- Gửi vị trí 10 lần/giây ngay từ giai đoạn 1 để test 2 tab vẫn thấy nhau. Nội suy, chat, emote vẫn là việc của giai đoạn 2.
- Tem tạm lưu localStorage (có dự phòng bộ nhớ tạm khi bị chặn), sẽ chuyển Supabase khi có tài khoản.

**Vấn đề / lỗi còn tồn tại:**
- Bundle client tăng lên 3,6 MB (1,2 MB gzip) vì rapier3d-compat nhúng WASM dạng base64. Cần tách chunk / tải lười, thêm màn hình loading (hiện Suspense fallback = null, nền trống vài giây khi tải).
- Một `npm run dev` từ phiên trước (khởi động 18:50) vẫn chạy và đang phục vụ cổng 5173/2567 (tự nạp code mới). Phiên này lỡ mở thêm một bản lúc 19:38. Server bản mới lỗi `EADDRINUSE`, còn Vite bản mới có thể đang ở cổng 5174. Lệnh tắt các PID thừa bị chặn quyền, **người dùng cần tự tắt** (đóng cửa sổ terminal tương ứng, hoặc Task Manager).
- Tán cây không có collider nên camera có thể chui vào tán.
- Toạ độ landmark vẫn tạm, chưa theo bản đồ thật. Thẻ Bí Mật vẫn `verified: false`.

**Việc dở dang / bước tiếp theo:**
- [ ] Người dùng kiểm tra FPS trên điện thoại thật (`http://<IP-máy>:5173`) và Chrome thường. Khi đó mới tick mục "FPS ổn định" của giai đoạn 1.
- [ ] Commit giai đoạn 1 (chờ người dùng đồng ý).
- [ ] Giai đoạn 2: nội suy vị trí người chơi khác, chat có lọc từ bậy + câu chat có sẵn, emote; dùng chung kiểu schema giữa client và server.
- [ ] Màn hình loading + tách chunk Rapier/three.
- [ ] Tra nguồn Thẻ Bí Mật 4 landmark, đặt toạ độ theo bản đồ thật (mục 4).
- [ ] Còn từ phiên trước: sửa 2 chỗ chưa khớp trong `CLAUDE.md`; người dùng tự cài `git config user.name/email`.

**Asset & nội dung:** chưa có asset. Mới: `content/zones/central.json`, khoá i18n `hud.*`, `card.*`. Mọi landmark vẫn `verified: false`.
