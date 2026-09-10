---
title: "Phase 2: Floating Update Card Popup (UpdateNoticePopup)"
description: "Xây dựng component UpdateNoticePopup và tích hợp vào App.tsx cùng store.ts: Thẻ thông báo nổi trượt xuống từ Header khi có bản mới, tóm tắt changelog và hỗ trợ đóng/mở cập nhật."
status: completed
priority: P1
effort: "1.0h"
tags: ["react", "component", "popup", "notification-card", "store"]
created: 2026-09-10
---

# Phase 2: Floating Update Card Popup (UpdateNoticePopup)

## Context & Objectives

Khi ứng dụng kiểm tra thấy bản mới, thay vì chỉ âm thầm đổi màu nút ở góc thanh tiêu đề, cần có một **Thẻ thông báo nổi (Floating Notification Card)** tự động trượt ra ngay dưới nút phiên bản để thu hút sự chú ý của người dùng một cách chuyên nghiệp.

Thẻ này:
- Không chặn toàn màn hình như Modal (không dùng backdrop làm mờ màn hình), người dùng vẫn nhìn thấy số liệu và giao diện làm việc.
- Trình bày trực quan: Phiên bản mới, ngày phát hành, 2 điểm cải tiến quan trọng nhất.
- Cung cấp 2 lựa chọn hành động rõ ràng:
  - **[Cập nhật ngay]**: Mở hộp thoại `UpdateModal` đầy đủ để người dùng bấm tải hoặc xem toàn bộ changelog chi tiết.
  - **[Để sau]** / Nút **[✕]**: Đóng thẻ thông báo lại. Khi người dùng đóng, trạng thái được ghi nhớ trong `store.ts` (`dismissedUpdateNotice: true`) để không tự động nhảy ra lại trong cùng một phiên làm việc.

## Implementation Details

### 1. Cập nhật State trong `src/renderer/state/store.ts`
- Thêm thuộc tính vào `AppState`:
  ```ts
  updateNoticeDismissed: boolean
  setUpdateNoticeDismissed: (dismissed: boolean) => void
  ```
- Mặc định khi khởi động là `updateNoticeDismissed: false`.
- Nếu sau khi gọi `checkAppUpdate()` mà `info.hasUpdate === true` và `updateNoticeDismissed === false`, thẻ sẽ tự động được hiển thị.

### 2. Tạo component mới: `src/renderer/components/UpdateNoticePopup.tsx`
- Neo vị trí (fixed positioning): nằm ở góc trên bên phải, cách đỉnh ~54px (ngay dưới Header), cách mép phải ~16px, `z-index: 9998`.
- Cấu trúc giao diện:
  - **Header thẻ**:
    - Icon thông báo phát hành (IconSparkles hoặc IconRefresh với nền gradient vàng/cam sang trọng).
    - Tiêu đề: `"Có bản cập nhật mới v{latestVersion}"`.
    - Nút đóng `[✕]`.
  - **Body thẻ**:
    - Tiêu đề bản phát hành (ví dụ: `updateInfo?.title`).
    - Danh sách 1-2 điểm mới tóm tắt từ `updateInfo?.changelog`.
    - Dòng chữ nhỏ chỉ dẫn: *"Khuyên dùng để sửa lỗi và tối ưu hiệu năng."*
  - **Footer thẻ**:
    - Nút phụ: `"Để sau"` (bấm vào gọi `setUpdateNoticeDismissed(true)`).
    - Nút chính nổi bật: `"Cập nhật ngay"` (mở `UpdateModal`, đóng popup thẻ).

### 3. Tích hợp hiệu ứng CSS vào `src/renderer/styles.css`
- Class `.update-notice-card`:
  - `box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.18), 0 8px 10px -6px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(245, 158, 11, 0.3)`.
  - Hiệu ứng xuất hiện mượt mà: `@keyframes slideDownFadeIn { from { opacity: 0; transform: translateY(-10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }`.
  - Responsive: độ rộng `min(380px, 90vw)`, bo góc 12px, nền trắng thuần với header tinh tế.

### 4. Gắn component vào `src/renderer/App.tsx`
- Đặt `<UpdateNoticePopup />` trong DOM ngang hàng với `<UpdateModal />`.

## Verification & Checks
- Khi `hasUpdate === true` và `updateNoticeDismissed === false`: popup xuất hiện ngay sau khi kiểm tra xong (sau 2 giây khởi động app).
- Bấm "Để sau" hoặc nút [✕]: popup biến mất êm ái, không tự động hiện lại.
- Bấm "Cập nhật ngay": popup đóng và `UpdateModal` mở ra ngay lập tức.
- Nút phiên bản trên Header khi được bấm vẫn luôn mở `UpdateModal` độc lập.
