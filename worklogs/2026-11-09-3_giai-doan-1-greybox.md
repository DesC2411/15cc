## 2026-11-09 — Giai đoạn 1 (grey-box khu Trung tâm) + Giai đoạn 2 (multiplayer, chat)

**Giai đoạn:** 1 → 2 · **Khu:** central

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

**Giai đoạn 1 đã commit:** `8b6154b` (người dùng đồng ý).

---

### Giai đoạn 2: multiplayer, chat

**Đã làm:**
- `shared/protocol.ts` (+ `shared/package.json`): tên tin nhắn, kiểu dữ liệu, giới hạn dùng chung client/server. Client import `@shared/protocol` (alias Vite + paths), server import tương đối. Server `tsconfig` đổi `rootDir: ".."` → build ra `server/dist/server/src/index.js` (đã sửa script `start`).
- **Nội suy** (`client/src/net/interpolation.ts`): mỗi patch có thay đổi lưu snapshot kèm giờ nhận, vẽ trễ 150 ms và nội suy giữa 2 snapshot. Nếu người kia đứng yên lâu rồi mới đi, chèn bản sao vị trí cũ để không bị trượt chậm. `connection.ts` đẩy vị trí vào bộ đệm. Store React chỉ cập nhật khi có người vào/ra hoặc đổi tên/màu, nên 20 patch/giây không làm React render lại.
- Người chơi có `name` ("Lữ khách 123", tiền tố trong `content/chat.json`) và `look` (7 màu theo bảng màu) trong schema. `Avatar` dùng chung cho mình và người khác, nhún theo `walk`/`run`. Nhãn tên + bong bóng chat/emote trên đầu (`Overhead`), ẩn khi xa hơn 30 m.
- **Chat server** (`server/src/chat/`):
  - `profanity.ts`: lọc nguyên từ / cụm từ. Chuẩn hoá chữ thường, bỏ ký tự chèn (`. * _ - !`), đổi leet, gộp chữ lặp. Dạng gộp chỉ dùng khi còn ≥ 2 ký tự (tránh `cc` → `c` che nhầm chữ "c"). Danh sách ở `content/chat_filter.json`, có ghi rõ các dạng không dấu KHÔNG được thêm vì trùng từ thường (lon/lớn, cac/các, buoi/buổi, du/du lịch, deo/đeo, ngu/ngủ).
  - `moderation.ts`: 1 tin / 1,5 giây, emote 1 / giây, che 3 lần trong 60 giây → khoá chat 60 giây. Báo cáo lưu `server/logs/reports.jsonl` (đã gitignore), kèm 5 tin gần nhất của người bị báo cáo.
  - `ZoneRoom.ts`: tin `chat` / `quick` / `emote` / `report` / `notice`. Câu có sẵn và emote gửi bằng id, server kiểm tra id có trong `content/chat.json`. Bật `CHAT_QUICK_ONLY=1` thì phòng chỉ cho câu có sẵn (`state.quickOnly`). Server đọc `content/` lúc chạy (`server/src/content.ts`, tự tìm thư mục hoặc dùng `CONTENT_DIR`).
- **Chat client:** `systems/chat.ts` (store: lịch sử 60 tin, bong bóng, danh sách chặn, tin chưa đọc, tuỳ chọn "Chỉ dùng câu có sẵn" lưu localStorage). `components/ui/chat/`: nút 💬 (có số tin chưa đọc, Enter trên máy tính cũng mở), bảng chat (lịch sử, emote, câu có sẵn, ô nhập, ⋯ → Chặn/Báo cáo), dòng tin nổi mờ dần, thông báo ngắn. Mọi chữ nằm trong `vi.json` (`chat.*`, `notice.*`).
- Hook gỡ lỗi `window.__pdpl` chỉ có ở bản dev (`main.tsx`); đã kiểm tra không có trong bản build.
- Test: `npm test` (gốc) → `server/src/chat/profanity.test.ts` (5 test, gồm danh sách câu thường không được che nhầm) + `server/src/rooms/ZoneRoom.test.ts` (test tích hợp: chạy server thật ở cổng 2611/2612, kiểm tra lọc, giới hạn tốc độ, id sai, khoá chat, chế độ chỉ câu có sẵn). Thêm `@colyseus/sdk` vào devDependencies của server.

**Kiểm tra giai đoạn 2:**
- `typecheck`, `oxlint`, `build`, `npm test` (7/7) đều qua.
- 2 cửa sổ Chrome headless, khung 375×812 (script CDP ở scratchpad):
  - Thấy tên nhau. B ghi vị trí đã nội suy của A mỗi khung hình trong lúc A đi: **0 khung đứng khựng giữa lúc di chuyển**, có thấy cả `idle` và `walk`. Tốc độ giữa các khung chưa đều (p10 1,2 – trung vị 3,5 – p90 6,0 m/s), một phần do A chạy bằng render phần mềm nên bước đi của A không đều. Cần xem lại trên máy thật.
  - A gửi câu có sẵn → B thấy bong bóng + dòng tin nổi + số chưa đọc. Gửi tiếp ngay → "Gửi chậm lại một chút nhé!". Gõ "đm vcl, Nhà hát lớn đẹp quá!" → B thấy "** ***, Nhà hát lớn đẹp quá!", A nhận thông báo bị che. Emote 👋 hiện trên đầu A ở màn B.
  - B bật "Chỉ dùng câu có sẵn": tin gõ tay bị ẩn, ô nhập biến mất. B báo cáo A → "Đã gửi báo cáo", file `reports.jsonl` có dòng đúng. B chặn A → tin cũ và tin mới của A đều ẩn, không còn bong bóng.
  - Console chỉ có 2 cảnh báo thư viện như cũ.
- Link công khai Funnel vẫn chạy với code mới (trang và matchmake đều 200).

**Lỗi tìm ra và đã sửa trong lúc test:**
- Đứng sát tường Nhà hát thì nhân vật nằm đúng mép vòng nhận tem (vòng chạm tường) → nhích nhẹ là thẻ tự mở lại sau khi đóng. Sửa: mép trong vòng cách tường 1 m (`CHECKPOINT_GAP = bán kính + 1`) và vùng đệm 1 m khi ra (`EXIT_MARGIN`). Chạy lại 2 lần đều đúng.
- Bong bóng chat bị co hẹp (3 dòng cho câu ngắn) → `width: max-content`. Màu `colonial-cream` gần trùng màu sân → đổi sang `langur-black`.
- Gọi hook có điều kiện (`a || useNetStore(...)`) trong `Overhead`, đã tách ra.

**Vận hành / tiến trình:**
- Vite dev cũ (18:50) không tự nạp alias `@shared` mới, phải `touch client/vite.config.ts`. Hai `tsx watch` cũ (của phiên trước và bản lỡ mở lúc 19:38) bị treo sau khi server crash lúc đang sửa code dở, không tự chạy lại. Đã chạy **server dev mới ở nền trong phiên Claude này** (cổng 2567). Khi tắt phiên Claude, server này có thể tắt theo, lúc đó cần chạy lại `npm run dev`. Các tiến trình node thừa (khởi động 18:50 và 19:38) người dùng nên tự tắt rồi chạy lại `npm run dev` cho sạch.

**Quyết định & lý do (giai đoạn 2):**
- Câu có sẵn gửi bằng **id**, mỗi máy tự dịch sang ngôn ngữ của mình (chuẩn bị cho tiếng Anh).
- Lọc từ ở **server** (client có thể bị sửa). Người gửi vẫn thấy bản đã che của chính mình.
- "Chỉ dùng câu có sẵn" có 2 tầng: tuỳ chọn của từng người (client: không gõ, không xem chữ tự gõ) và chế độ cả phòng (server, `CHAT_QUICK_ONLY=1`).
- Chặn chỉ trong phiên (chưa có tài khoản). Báo cáo tạm ghi file, sau chuyển Supabase.
- Không làm dự đoán phía client cho người khác (extrapolation): người khác hiện trễ ~150 ms là chấp nhận được với game dạo chơi.

**Quyết định & lý do (giai đoạn 1):**
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
- [x] Commit giai đoạn 1 (`8b6154b`).
- [x] Commit giai đoạn 2 (`05edcdd`, người dùng đồng ý).
- [ ] Kiểm tra giai đoạn 2 trên máy thật: 2 thiết bị qua link công khai, xem chuyển động có mượt không, bàn phím ảo điện thoại khi gõ chat.
- [ ] Danh sách từ bậy nên được người Việt duyệt thêm (đặc biệt tiếng lóng mới, cách viết lách lọc). Chưa lọc tên người chơi vì tên đang do server đặt.
- [ ] Chưa test giao diện với 30–50 người cùng lúc (mỗi người một nhãn HTML, có thể nặng trên điện thoại yếu).
- [ ] Màn hình loading + tách chunk Rapier/three.
- [ ] Tra nguồn Thẻ Bí Mật 4 landmark, đặt toạ độ theo bản đồ thật (mục 4).
- [ ] Còn từ phiên trước: sửa 2 chỗ chưa khớp trong `CLAUDE.md`; người dùng tự cài `git config user.name/email`.

**Asset & nội dung:** chưa có asset. Mới: `content/zones/central.json`, `content/chat.json` (10 câu có sẵn, 6 emote), `content/chat_filter.json`, khoá i18n `hud.*`, `card.*`, `chat.*`, `notice.*`. Mọi landmark vẫn `verified: false`.
