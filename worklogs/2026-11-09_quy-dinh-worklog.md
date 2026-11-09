## 2026-11-09 — Thêm quy định worklog vào CLAUDE.md

**Giai đoạn:** chuẩn bị (trước giai đoạn 0) · **Khu:** —

**Đã làm:**
- Thêm khối "BẮT BUỘC MỖI PHIÊN" ở đầu `CLAUDE.md` và mục 9 "Nhật ký làm việc (WORKLOG)".
- Thêm `worklogs/` vào cấu trúc thư mục ở mục 2.
- Tạo thư mục `worklogs/` và file này.

**Quyết định & lý do:**
- Dùng thư mục `worklogs/`, mỗi phiên một file `YYYY-MM-DD_<slug>.md` (người dùng yêu cầu). Tên bắt đầu bằng ngày để sắp theo tên là đúng thứ tự thời gian.
- Ban đầu làm 1 file `WORKLOG.md` ở gốc, đã bỏ theo yêu cầu người dùng.

**Vấn đề / lỗi còn tồn tại:**
- Dự án chưa có code, chưa có git repo.

**Việc dở dang / bước tiếp theo:**
- [ ] Giai đoạn 0: khởi tạo `client/`, `server/`, `content/`, `assets-src/` (mục 7.2).
- [ ] (Tuỳ chọn) Thêm hook `SessionStart` tự nạp worklog mới nhất mỗi phiên.

**Asset & nội dung:** chưa có.
