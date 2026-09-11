---
phase: 3
title: "Kiểm thử, Tự động hóa & Xác nhận (Testing & Verification)"
status: "pending"
files_modified:
  - "tests/audit-workflow-stepper.test.ts"
---

# Phase 3: Kiểm thử, Tự động hóa & Xác nhận (Testing & Verification)

## Mục tiêu
Đảm bảo toàn bộ tính năng và tương tác điều hướng của `AuditWorkflowStepper` hoạt động hoàn hảo, không gây hồi quy (regression) và vượt qua 100% các bài kiểm thử tự động của hệ thống.

## Chi tiết các bước thực hiện:

1. **Xây dựng Test Suite cho Stepper (`tests/audit-workflow-stepper.test.ts`)**:
   - Kiểm tra hiển thị đủ 4 bước nghiệp vụ tuần tự.
   - Kiểm tra mapping chính xác giữa các bước và các viewKey tương ứng (`setup`, `analytics`, `sampling`, `workingpaper`).
   - Kiểm tra tương tác click chuyển view sang Zustand store đúng đắn.
   - Kiểm tra trạng thái phản hồi khi dữ liệu trong store thay đổi (đã nạp NKC hay chưa nạp).

2. **Chạy chu trình Kiểm tra toàn diện của dự án**:
   - `npm run typecheck`: Xác nhận 0 lỗi TypeScript trên cả 3 tsconfig (`tsconfig.web.json`, `tsconfig.node.json`, `tsconfig.tests.json`).
   - `npm run lint`: Xác nhận mã nguồn tuân thủ 100% chuẩn ESLint của dự án.
   - `npm run test`: Xác nhận toàn bộ test suite Vitest pass 100%.
   - `npm run build`: Xác nhận build production (Vite + Electron Main/Worker) thành công mỹ mãn.
