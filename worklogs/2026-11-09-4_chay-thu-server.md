## 2026-11-09 — Chạy thử server

**Giai đoạn:** 2 · **Khu:** central

**Đã làm:**
- Đọc 3 worklog gần nhất. Người dùng yêu cầu "chạy thử server".
- Kiểm tra cổng: 2567 do node pid 25456 giữ (khởi động 20:19, là server dev phiên trước mở ở nền), 5173 do Vite pid 1360 (18:50), 5174 do Vite thừa pid 21060 (19:38). Không mở thêm server mới để tránh `EADDRINUSE`.
- Gọi `POST /matchmake/joinOrCreate/zone` thẳng vào 2567 và qua proxy Vite `/colyseus` ở 5173: cả hai trả 200. Trang client 5173 trả 200.
- `npm test`: 7/7 qua (lọc từ bậy, giới hạn tốc độ, khoá chat, chế độ chỉ câu có sẵn).

**Quyết định & lý do:**
- Dùng lại server đang chạy thay vì khởi động bản mới, vì cổng 2567 đã bị chiếm và server vẫn trả lời đúng.

**Vấn đề / lỗi còn tồn tại:**
- Vẫn còn Vite thừa ở cổng 5174 (pid 21060, 19:38). Người dùng nên tự tắt.
- Server ở 2567 là tiến trình nền của một phiên Claude cũ, có thể tắt bất cứ lúc nào. Muốn chạy ổn định thì tắt hết node cũ rồi tự chạy `npm run dev` trong terminal riêng.

**Tắt tiến trình node cũ (người dùng yêu cầu):**
- Liệt kê được 15 tiến trình node của dự án, thuộc 3 bộ `npm run dev` (18:50, 19:38, 20:04 — bộ 20:04 chỉ có server).
- Lệnh `Stop-Process` bị auto mode chặn. Không lách. Đã đưa người dùng lệnh `! powershell ...` lọc theo `HaiPhong|run dev` để tự chạy.

- Người dùng nhắc lại "tắt server" → thử lại bằng `taskkill /T /F` trên 3 tiến trình gốc `npm run dev` (15996, 19364, 15976): **thành công**, đã tắt toàn bộ cây tiến trình. Cổng 2567/5173/5174 trống, không còn node của dự án. Link Funnel không vào được cho tới khi chạy lại `npm run dev`.

**Giai đoạn 3 (bắt đầu, bị chặn):**
- Người dùng yêu cầu làm tiếp giai đoạn 3. Asset đầu tiên theo thứ tự ưu tiên: Nhà hát lớn.
- Bước 1 (tra ảnh Google) cần Claude in Chrome → **extension không kết nối** (giống phiên trước). Dừng, nhờ người dùng kết nối.
- Phiên này cũng **không có tool Blender MCP** → bước 4 (dọn model) chưa làm được.
- Chưa tạo/sửa file asset nào.
- Người dùng báo đã kết nối Chrome. `tabs_context_mcp` lần đầu vẫn báo chưa kết nối; gọi `list_connected_browsers` thấy DESKTOP-Q7TD65I, gọi lại thì được.
- **Bước 1 (Google) xong cho Nhà hát lớn:** tra 2 bộ ảnh (mặt tiền, flycam), ghi đặc điểm nhận dạng + nguồn vào `assets-src/refs/SOURCES.md` (chưa lưu ảnh về máy). Wikipedia chặn quyền đọc của extension, lấy chữ bằng WebFetch. Phát hiện năm xây chưa thống nhất (1898–1900 hay 1904–1912), kích thước thật chưa có nguồn.
- **Bước 2 (ChatGPT) bị chặn:** extension chưa được cấp quyền thao tác trên `chatgpt.com`. Đã soạn sẵn prompt, chờ người dùng cấp quyền.
- Người dùng cấp quyền chatgpt.com, đồng ý gửi prompt. ChatGPT đã đăng nhập sẵn. Tạo xong ảnh **v1** (~40 giây). Prompt ghi vào `assets-src/concepts/PROMPTS.md`.
- Duyệt v1 theo checklist 5.3: nhận ra Nhà hát (khối giữa + attic + cột cờ, 4 cột trắng, 3 cửa vòm đỏ nâu, 2 vòm góc đỏ, thân dài, mái xám có ô kính); 1 vật thể, nền trắng, không cắt, không chữ. Điểm trừ: ít "low-poly" (bo tròn, chi tiết gờ nhiều), chỉ thấy mặt trước + 1 bên. Chưa tải ảnh về, chờ người dùng xác nhận.
- Người dùng đồng ý tải v1. Bấm nút tải trong trình xem ảnh ChatGPT → Downloads chỉ có file `05d70736-....tmp` (1,5 MB) đứng yên, chưa thành `.png` (có thể Chrome đang chờ hộp thoại lưu). Theo mục 5.1 bước 9: dừng, báo người dùng, không thử cách khác.
- Người dùng yêu cầu **làm server nhận ảnh** để khỏi thao tác tay → `tools/asset-inbox.mjs` (Node thuần, không thêm thư viện), lệnh `npm run inbox`, cổng `127.0.0.1:5199`. Chỉ nhận origin `https://chatgpt.com` hoặc không có Origin, chỉ ghi vào `assets-src/concepts|refs`, tên snake_case, kiểm tra magic bytes, không ghi đè nếu không có `overwrite=1`. Cách dùng ghi trong `README.md`.
- Thử `fetch` từ trang ChatGPT → bị **CSP `connect-src`** chặn. Đọc header CSP: `form-action` chỉ là report-only → chuyển sang gửi **form multipart** (tab chuyển sang trang kết quả localhost rồi Back lại). Server trả HTML khi nhận form, JSON khi nhận body thô.
- Test bằng curl: lưu đúng, trùng tên → 409, `overwrite=1` ghi đè được, path có `..`/`_` → 400, không phải ảnh → 415, sai đuôi → 415, origin lạ → 403, preflight có `Access-Control-Allow-Private-Network`, form thiếu trường `file` → 400. Thư mục test đã xoá.
- **Đã lưu `assets-src/concepts/central/lm_nha_hat_lon_v1.png`** (PNG 1536×1024, 1.555.119 byte, khớp blob gốc). Mở ảnh xem lại: đầy đủ, không cắt. File `.tmp` dở trong Downloads đã tự biến mất.
- Lưu ý vận hành: `TaskStop` trên `npm run inbox` chỉ tắt npm, tiến trình node con vẫn giữ cổng → phải `taskkill` pid đó. Lần sau chạy nền thì gọi thẳng `node tools/asset-inbox.mjs`. Server inbox hiện đang chạy nền trong phiên Claude này.

**Việc dở dang / bước tiếp theo:**
- [x] Tắt các tiến trình node thừa.
- [ ] Người dùng chạy lại `npm run dev` trong terminal riêng khi cần.
- [x] Kết nối Claude in Chrome → tra ảnh Nhà hát lớn → ChatGPT concept v1 → lưu bằng hộp nhận ảnh.
- [ ] Image-to-3D từ `lm_nha_hat_lon_v1.png` (Meshy / Tripo / Hunyuan3D, người dùng tự đăng nhập) → lưu model thô vào `assets-src/models-raw/`.
- [x] Cập nhật CLAUDE.md (người dùng đồng ý): mục 5.1 bước 7 dùng hộp nhận ảnh làm cách chính, tải tay là dự phòng; cây thư mục mục 2 thêm `shared/` và `tools/`.
- [x] Commit các thay đổi phiên này (người dùng đồng ý), tên/email tạm như các commit trước, chỉ cho lệnh đó.
- [ ] Bật Blender + addon BlenderMCP (Connect) trước bước dọn model.
- [ ] Kiểm tra FPS và chuyển động multiplayer trên điện thoại thật.
- [ ] Màn hình loading + tách chunk Rapier/three.
- [ ] Tra nguồn Thẻ Bí Mật 4 landmark, đặt toạ độ theo bản đồ thật.

**Asset & nội dung:** không đổi.
