---
title: "B410 Consolidation Success Modal Dialog"
description: "Thay thế hộp thoại window.confirm thô sơ bằng Custom Modal Dialog AuditSoft: hiển thị kết quả trực quan, cung cấp nút Mở file Excel ngay, Mở thư mục chứa file, và Đóng."
status: pending
priority: P1
effort: "1h"
tags: ["b410", "modal", "ui", "electron", "ipc"]
created: 2026-09-09
---

# B410 Consolidation Success Modal Dialog

## 1. Overview
Hiện tại sau khi gộp xong B410, ứng dụng đang sử dụng `window.confirm` mặc định của trình duyệt để hỏi mở file. Kế hoạch này thay thế bằng một Modal Dialog chuyên nghiệp (Phương án 2), đồng bộ nhận diện thương hiệu AuditSoft, hỗ trợ mở trực tiếp file Excel hoặc mở thư mục chứa file trong Windows Explorer (`shell.showItemInFolder`).

## 2. Goals & Priorities

| # | Goal | Priority |
|---|------|----------|
| 1 | Bổ sung IPC `showItemInFolder` để mở Explorer và highlight file kết quả | P1 |
| 2 | Xây dựng component `B410SuccessModal` đồng bộ style hệ thống AuditSoft | P1 |
| 3 | Tích hợp vào `B410DropZone.tsx`, thay thế `window.confirm` và quản lý trạng thái mở modal | P1 |
| 4 | Kiểm thử build, typecheck và kiểm tra giao diện | P1 |

## 3. Scope & Boundaries
- **In Scope:**
  - `src/shared/ipc.ts`: Định nghĩa channel `showItemInFolder` và method trong `AuditBridgeApi`.
  - `src/preload/index.ts`: Expose `showItemInFolder` qua `window.auditsoft`.
  - `src/main/index.ts`: Đăng ký `ipcMain.handle(IPC.showItemInFolder)`.
  - `src/renderer/components/B410Consolidation/B410SuccessModal.tsx`: Component Modal mới.
  - `src/renderer/components/B410Consolidation/B410DropZone.tsx`: Kích hoạt Modal khi `res.success` thay vì `window.confirm`.
- **Out of Scope:**
  - Không can thiệp vào logic gộp dữ liệu B410 (`B410Consolidator`, `B410ComWorker.ps1`, `B410Renderer`).

## 4. Success Criteria
- [ ] Gộp B410 thành công -> Modal tự động xuất hiện với hiệu ứng mềm mại.
- [ ] Nút "Mở file Excel ngay" mở file kết quả và đóng modal.
- [ ] Nút "Mở thư mục chứa file" mở Windows Explorer và chọn đúng file kết quả.
- [ ] Nút "Để sau" hoặc icon X đóng modal, vẫn giữ thẻ kết quả trên màn hình để mở lại khi cần.
- [ ] TypeScript build (`npm run build:vite` & `npm run build:node`) thành công không có lỗi.
