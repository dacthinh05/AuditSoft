# Phase 01: Xóa Key Cứng + Khóa Kênh Update (H1, H3, H2)

## 1. Mục Tiêu
Kẻ đọc được source không còn active VIP chùa; renderer bị chiếm cũng không lái được nguồn update; installer lạ không bao giờ tới `spawn`.

## 2. Việc Làm
1. **H1 — `src/shared/license.ts:17`**: xóa `DEFAULT_VIP_LICENSE_KEY` (grep toàn repo 0 lượt dùng — dead code). Không thêm thay thế.
2. **H3 — `src/main/index.ts:269`**: handler `IPC.checkUpdate` bỏ qua `rawUrl`, luôn gọi `checkForAppUpdates()` không tham số. Giữ chữ ký IPC (không vỡ preload/renderer). Ghi chú: ai cần mirror nội bộ thì đặt `AUDITSOFT_UPDATE_URL` (đã hỗ trợ ở `updater.ts:12`).
3. **H2 — `src/main/updater.ts` + `src/shared/types/update.ts` + `version.json`:**
   - Thêm `sha256?: string` vào `UpdateManifest`.
   - Sau khi tải xong, trước `spawn`: tính SHA-256 file, so với manifest; lệch/thiếu → xóa file, trả lỗi, không `spawn`, không `app.quit()`.
   - Đổi redirect `'follow'` sang kiểm tra host đích vẫn thuộc `github.com`/`objects.githubusercontent.com`, quá 3 hop thì dừng.
   - Ghi vào plan发布 checklist: `scripts/publish-distribution.mjs` phải điền `sha256` khi bump `version.json` (sửa script nếu tầm dưới 20 dòng, không thì để checklist tay).

## 3. Nghiệm Thu
- `grep -r DEFAULT_VIP_LICENSE_KEY .` 0 kết quả (trừ lịch sử git).
- Gọi `checkUpdate('https://evil.example/m.json')` vẫn trả về manifest chính thức.
- File installer bị sửa 1 byte → từ chối chạy, app không thoát.
