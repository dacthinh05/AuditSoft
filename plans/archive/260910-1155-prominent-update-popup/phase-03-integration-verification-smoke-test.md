---
title: "Phase 3: Integration, Typecheck, and Verification"
description: "Tích hợp toàn bộ các thành phần, kiểm tra typecheck với TypeScript compiler, kiểm tra kịch bản giả lập có bản mới và không có bản mới, đảm bảo trải nghiệm người dùng hoàn hảo."
status: completed
priority: P1
effort: "0.5h"
tags: ["testing", "typecheck", "smoke-test", "verification"]
created: 2026-09-10
---

# Phase 3: Integration, Typecheck, and Verification

## Context & Objectives

Xác thực tính ổn định, độ tương thích và trải nghiệm người dùng của tính năng thông báo cập nhật nổi bật mới được triển khai.

## Tasks & Scenarios

### 1. Kiểm tra biên dịch TypeScript (Typecheck)
- Chạy lệnh kiểm tra typecheck toàn bộ dự án:
  ```bash
  npm run typecheck
  ```
- Đảm bảo 0 lỗi kiểu dữ liệu ở `store.ts`, `UpdateNoticePopup.tsx`, `App.tsx`, và các file liên quan.

### 2. Kịch bản Kiểm thử Giao diện (Smoke Test Scenarios)

| Kịch bản | Dữ liệu đầu vào | Kết quả mong đợi |
| :--- | :--- | :--- |
| **Kịch bản A: Không có bản mới** | `updateInfo = { hasUpdate: false, currentVersion: '1.1.6', latestVersion: '1.1.6' }` | Nút Header hiển thị bình thường `[🔄 v1.1.6]`. Không có hiệu ứng pulse. Thẻ popup không xuất hiện. |
| **Kịch bản B: Phát hiện bản mới** | `updateInfo = { hasUpdate: true, currentVersion: '1.1.6', latestVersion: '1.1.7', changelog: ['Điểm mới 1', 'Điểm mới 2'] }` | Nút Header phát sáng viền amber, nhấp nháy pulse dot, ghi `v1.1.6 • Bản mới v1.1.7!`. Thẻ popup `UpdateNoticePopup` trượt xuống mượt mà từ góc phải dưới nút. |
| **Kịch bản C: Thao tác [Để sau] hoặc [✕]** | Người dùng click "Để sau" hoặc nút [✕] trên thẻ popup | Thẻ popup ẩn đi. Trạng thái `updateNoticeDismissed = true`. Nút Header vẫn giữ hiệu ứng nổi bật. Bấm lại vào nút Header vẫn mở `UpdateModal`. |
| **Kịch bản D: Thao tác [Cập nhật ngay]** | Người dùng click "Cập nhật ngay" trên thẻ popup | Thẻ popup đóng. Hộp thoại `UpdateModal` mở ra ở giữa màn hình với đầy đủ changelog và nút tải/cài đặt tự động. |
| **Kịch bản E: Không che khuất thao tác** | Thẻ popup đang hiển thị | Người dùng vẫn có thể click chuyển các tab ("Chọn mẫu đặc biệt", "Đối chiếu NKC", v.v.) mà không bị chặn thao tác. |

### 3. Acceptance Verification Checklist
- [ ] TypeScript typecheck hoàn toàn không có lỗi cảnh báo hay crash.
- [ ] Visual thiết kế chuẩn phong cách Clean Enterprise, không lòe loẹt.
- [ ] Không làm phát sinh lỗi tràn layout trên các độ phân giải màn hình khác nhau.
