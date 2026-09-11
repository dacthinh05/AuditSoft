---
phase: 3
title: "Update UI & Verification"
status: pending
priority: P1
effort: "1.5h"
dependencies: ["phase-02-auto-update-engine.md"]
---

# Phase 3: Update UI & Verification

## Overview
Xây dựng giao diện thông báo cập nhật trên Header, Modal hiển thị chi tiết Changelog/Bản mới và tiến hành kiểm thử toàn diện từ giao diện tới bản build đóng gói.

## Requirements
- Functional:
  - Header Status Badge:
    - Đặt cạnh nút Bản quyền trên Header.
    - Hiển thị phiên bản hiện tại (VD: `v0.1.0`).
    - Nếu có bản mới: Hiển thị chấm sáng pulse xanh/cam kèm text `v0.1.0 (Có bản mới)`.
    - Khi click vào: Mở `UpdateModal`.
  - Update Modal (`src/renderer/components/UpdateModal.tsx`):
    - Tiêu đề: `Thông Báo Cập Nhật Phiên Bản Mới`.
    - Thông tin so sánh: `Phiên bản hiện tại (v0.1.0)` -> `Phiên bản mới nhất (v1.0.0)` kèm ngày phát hành.
    - Tiêu đề thông điệp cập nhật từ tác giả.
    - Danh sách Changelog (các tính năng mới / lỗi đã sửa) hiển thị dạng danh sách gạch đầu dòng rõ ràng, dễ đọc.
    - Nút hành động:
      - Nút chính: `Tải Bản Cài Đặt (Setup.exe)`.
      - Nút phụ: `Tải Bản Chạy Ngay (Portable.exe)` hoặc mở trang Release.
      - Nút `Kiểm tra lại` để người dùng chủ động check lại nếu cần.
      - Nút `Đóng` để quay lại làm việc bình thường.
  - Tự động kiểm tra:
    - Khi khởi chạy app, sau 2 giây (delay nhẹ để ưu tiên render xong trang chính), tự động gọi `checkUpdate()`.
    - Cập nhật state `updateInfo` trong Zustand store.
- Non-functional:
  - Thiết kế theo chuẩn giao diện phẳng B2B SaaS chuyên nghiệp (không dùng emoji phản cảm, căn lề và màu sắc hài hòa với toàn bộ hệ thống).
  - Đảm bảo các tương tác mượt mà, hỗ trợ đóng modal bằng phím ESC hoặc click ra ngoài backdrop.

## Architecture
```
[App Mounted] ──(sau 2s)──► checkUpdate() ──► updateInfo saved to Zustand store
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       ▼                                                             ▼
              [hasUpdate === false]                                         [hasUpdate === true]
         Header badge: "v0.1.0"                                        Header badge: "v0.1.0 · Có bản mới"
                       │                                                             │
                       └──────────────────────────────┬──────────────────────────────┘
                                                      │ (User click)
                                                      ▼
                                              Open UpdateModal
                                              ├─ Show Changelog
                                              ├─ Button: Tải Setup.exe
                                              ├─ Button: Tải Portable.exe
                                              └─ Button: Kiểm tra lại
```

## Related Code Files
- Create: `src/renderer/components/UpdateModal.tsx`
- Modify: `src/renderer/components/Icons.tsx` (thêm icon Spark / Download / ArrowUp)
- Modify: `src/renderer/state/store.ts` (thêm state quản lý update)
- Modify: `src/renderer/App.tsx` (nhúng badge & modal)
- Modify: `src/renderer/styles.css` (CSS cho badge và update modal)

## Implementation Steps
1. Mở `src/renderer/components/Icons.tsx`:
   - Bổ sung icon `IconSpark` và `IconDownloadCloud` chuẩn SVG.
2. Mở `src/renderer/state/store.ts`:
   - Thêm state: `updateInfo: AppUpdateInfo | null`, `isCheckingUpdate: boolean`, `updateModalOpen: boolean`.
   - Thêm actions: `setUpdateInfo`, `setIsCheckingUpdate`, `setUpdateModalOpen`, `checkUpdateAction`.
3. Tạo `src/renderer/components/UpdateModal.tsx`:
   - Xây dựng giao diện Modal hiển thị phiên bản, ngày phát hành, danh sách changelog, và các nút tải về.
4. Mở `src/renderer/App.tsx`:
   - Thêm `useEffect` tự động gọi check update khi khởi động.
   - Thêm Badge trên `header-right` hiển thị version và trạng thái.
   - Nhúng `<UpdateModal />`.
5. Mở `src/renderer/styles.css`:
   - Thêm styling cho `.btn-update-header`, `.badge-pulse`, `.update-modal-box`, `.changelog-list`.
6. Kiểm thử & Xác nhận:
   - Chạy `npm run typecheck` xác nhận TypeScript không có lỗi.
   - Chạy `npm run build` xác nhận build Vite, Node và Worker thành công.
   - Chạy thử app ở chế độ Dev để kiểm tra hiển thị thực tế.

## Success Criteria
- [x] Header hiển thị badge phiên bản đẹp mắt, chuyên nghiệp.
- [x] Khi có thông báo cập nhật, badge nổi bật với hiệu ứng chấm xanh/cam tinh tế.
- [x] Mở modal xem changelog đầy đủ, rõ ràng, bấm nút tải mở đúng liên kết trên trình duyệt.
- [x] Bấm nút "Kiểm tra lại" thực hiện gọi API kiểm tra tức thì và phản hồi trạng thái.
- [x] Build dự án thành công 100% không phát sinh lỗi.

## Risk Assessment
- Rủi ro: Quá trình check update làm chậm giao diện lúc mới mở.
- Giảm thiểu: Chạy bất đồng bộ với setTimeout 2000ms sau khi giao diện đã render hoàn tất.
