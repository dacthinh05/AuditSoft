---
phase: 4
title: "Kiểm thử Tích hợp Toàn diện (Smoke Test & Build Verification)"
status: pending
priority: P1
effort: "30m"
dependencies: ["phase-01-start", "phase-02-trial-protection-workingpaper-b410", "phase-03-ui-trial-counter-header-modal"]
---

# Phase 4: Kiểm thử Tích hợp Toàn diện (Smoke Test & Build Verification)

## Overview
Tiến hành kiểm thử toàn diện hệ thống bản quyền và cơ chế dùng thử, đảm bảo cả tầng logic mã hóa (Ed25519), tầng lưu trữ (storage), giao diện người dùng (UI) và quy trình build packaging đều hoạt động trơn tru không lỗi.

## Requirements
- Functional:
  - Chạy toàn bộ test suite `npm test tests/license.test.ts` đạt 10/10 PASS.
  - Chạy kiểm tra TypeScript (`npm run typecheck` hoặc `tsc --noEmit`) không có lỗi type.
  - Chạy build ứng dụng (`npm run build`) thành công, không có warning hoặc lỗi đóng gói.
  - Kịch bản kiểm thử hành vi (Behavioral Scenarios):
    + Scenario 1: Mở app mới -> 10 lượt dùng thử.
    + Scenario 2: Xuất 1 file -> còn 9 lượt dùng thử, UI cập nhật tức thì.
    + Scenario 3: Dùng hết 10 lượt -> chặn xuất, popup VietQR kích hoạt.
    + Scenario 4: Nhập License Key hợp lệ -> mở khóa VIP Vĩnh viễn, không giới hạn xuất.
    + Scenario 5: Bấm Hủy kích hoạt -> trở về trạng thái chưa kích hoạt.
- Non-functional:
  - Tốc độ phản hồi tức thì, không gây lag giao diện khi kiểm tra bản quyền.

## Related Code Files
- Test: `tests/license.test.ts`
- Package Config: `package.json`

## Implementation Steps
1. Chạy `npm test tests/license.test.ts` để xác nhận 10/10 test cases màu xanh.
2. Chạy toàn bộ các bài test trong dự án: `npm test`.
3. Kiểm tra kiểm tra kiểu dữ liệu tĩnh: `npm run build` để đảm bảo vite build renderer và electron main/preload compile thành công.
4. Lập tài liệu hướng dẫn tạo License Key cho tác giả Thịnh Lynx bằng công cụ `scripts/keygen.ts`.

## Success Criteria
- [x] Test suite `tests/license.test.ts` đạt 100% (10/10 tests PASS).
- [x] Lệnh `npm run build` hoàn thành không lỗi.
- [x] Quy trình dùng thử 10 lượt và kích hoạt bản quyền sẵn sàng để đóng gói bản phát hành `AuditSoft-0.1.0-Setup.exe` và `AuditSoft-0.1.0-Portable.exe`.

## Risk Assessment
- Rủi ro: Khách hàng mua bản 1 Năm nhưng sau 1 năm app vẫn mở nếu máy tính bị chỉnh lùi giờ hệ thống.
  - Nhận biết: Máy tính đổi ngày giờ về quá khứ để lách hạn dùng.
  - Phản ứng: Với ứng dụng chạy offline hoàn toàn thì Ed25519 payload có trường `iat` (issued at). Có thể chặn nếu ngày hiện tại nhỏ hơn `iat`.
