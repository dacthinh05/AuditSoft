# Nhật Ký Kỹ Thuật: Hoàn Thành Tính Năng Tự Động Hiện Bản Cập Nhật Mới Khi Mở App

- **Ngày thực hiện:** 2026-09-11
- **Phân hệ:** Hệ Thống Cập Nhật Tự Động (Auto-Updater & Modal)
- **Trạng thái:** Hoàn thành 100%

---

## 1. Yêu Cầu Người Dùng
Khi vừa mở phần mềm lên, nếu có bản cập nhật mới thì hệ thống tự động hiển thị cửa sổ popup thông báo bản mới trực diện giữa màn hình, cho phép người dùng lựa chọn:
- **Cập nhật ngay (1-Click):** Tự động tải ngầm và chạy bộ cài đặt.
- **Để sau:** Đóng modal, ghi nhớ lựa chọn trong phiên làm việc để không làm phiền, nhưng vẫn giữ đèn báo cập nhật trên thanh Header để KTV có thể cập nhật lại bất cứ lúc nào.

## 2. Các Thay Đổi Kỹ Thuật Đã Thực Hiện
1. **Tự động kích hoạt Modal khi khởi động (`App.tsx`):**
   - Trong `useEffect` khởi động (sau 1.5s): Gọi `checkAppUpdate()`.
   - Nếu `info.hasUpdate === true` và chưa bị dismiss trong session (`sessionStorage.getItem('auditsoft_update_auto_dismissed')`): Tự động gọi `setUpdateModalOpen(true)` để mở thẳng `UpdateModal`.
2. **Nâng cấp giao diện nút hành động trong `UpdateModal.tsx`:**
   - Bổ sung nút **`Để sau`** (màu xám nhạt thanh lịch) nằm song song ngay cạnh nút **`CẬP NHẬT NGAY`** (gradient xanh dương nổi bật).
   - Khi bấm `Để sau` (hoặc bấm nút đóng ✕ / click ngoài nền): Đóng modal, đặt `updateNoticeDismissed = true`, lưu cờ vào `sessionStorage` để không tự động bật lại trong phiên đó.
   - Nút trên thanh Header Topbar vẫn giữ đèn chấm cam và badge `Bản mới v...` để người dùng có thể chủ động mở lại bất kỳ lúc nào.

## 3. Kết Quả Kiểm Thử
- `tests/update-notice.test.ts`: 5/5 tests pass 100%.
- Toàn bộ test suite dự án: 86 test files, 397 tests pass 100%.
- TypeScript `npm run typecheck`: 0 lỗi.
