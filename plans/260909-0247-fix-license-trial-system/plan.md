---
title: "Khắc phục Lỗi Hệ thống Bản quyền & Kích hoạt Cơ chế Dùng thử 10 Lượt (Trial System)"
description: "Sửa lỗi ReferenceError nowSec, loại bỏ bypass auto-VIP, kích hoạt chuẩn xác cơ chế dùng thử 10 lượt xuất file, bảo vệ các module xuất file (NKC, Sampling, Working Papers, B410) và tối ưu hiển thị giao diện người dùng."
status: in_progress
priority: P1
effort: "2h"
tags: ["license", "trial", "security", "ed25519", "vietqr", "ui"]
created: 2026-09-09
blocks: [260909-release-distribution-hub]
---

# Khắc phục Lỗi Hệ thống Bản quyền & Kích hoạt Cơ chế Dùng thử 10 Lượt (Trial System)

## Overview
Hệ thống cấp phép bản quyền và dùng thử hiện tại đang có lỗi nghiêm trọng:
1. `src/shared/license.ts` gọi biến `nowSec` chưa khai báo gây crash runtime khi verify key có thời hạn.
2. `getLicenseStatus()` đang hardcode tự động cấp quyền VIP Vĩnh viễn nếu chưa có key, làm tê liệt toàn bộ cơ chế dùng thử 10 lượt và khiến `tests/license.test.ts` trượt 3/10 tests.
3. Các chức năng xuất quan trọng như Tạo Giấy làm việc tự động (Working Papers) và Tổng hợp B410 chưa được gắn chốt chặn kiểm tra lượt dùng thử.
4. Giao diện người dùng chưa hiển thị rõ ràng số lượt dùng thử còn lại.

Kế hoạch này khắc phục triệt để các lỗi trên, đưa test suite bản quyền về 100% PASS, khóa bảo vệ toàn diện các chức năng xuất và hiển thị trực quan thông tin dùng thử cho người dùng.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Sửa lỗi `nowSec` và loại bỏ hoàn toàn bypass auto-VIP trong `src/shared/license.ts` | P1 |
| 2 | Đạt 10/10 PASS cho toàn bộ `tests/license.test.ts` | P1 |
| 3 | Gắn chốt chặn `useTrialExport()` cho Tạo Giấy làm việc (`WorkingPaperPage.tsx`) và Tổng hợp B410 (`B410DropZone.tsx`) | P1 |
| 4 | Cập nhật giao diện Header & LicenseModal: hiển thị chính xác `Dùng thử (còn X/10 lượt)` và popup cảnh báo khi hết hạn | P1 |
| 5 | Kiểm thử tích hợp toàn bộ luồng: dùng thử -> giảm lượt -> hết hạn chặn xuất -> kích hoạt VIP -> hủy kích hoạt | P1 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Sửa lỗi Cốt lõi Bản quyền & Test Suite](./phase-01-start.md) | In Progress |
| 2 | [Phase 2: Chốt chặn Dùng thử cho Working Papers & B410](./phase-02-trial-protection-workingpaper-b410.md) | Pending |
| 3 | [Phase 3: Cập nhật Hiển thị Giao diện Header & License Modal](./phase-03-ui-trial-counter-header-modal.md) | Pending |
| 4 | [Phase 4: Kiểm thử Tích hợp Toàn diện (Smoke Test)](./phase-04-verification-and-smoke-test.md) | Pending |

## Success Criteria

- [ ] `npm test tests/license.test.ts` vượt qua 10/10 test cases không lỗi.
- [ ] Mở ứng dụng lần đầu (chưa kích hoạt key): Trạng thái là "Dùng thử" với 10 lượt xuất miễn phí.
- [ ] Mỗi lần xuất báo cáo (Đối chiếu NKC, Mẫu kiểm toán, Working Papers, B410) đều trừ đúng 1 lượt dùng thử.
- [ ] Khi hết 10 lượt: Ứng dụng chặn thao tác xuất, hiện thông báo rõ ràng và tự động mở bảng quét mã VietQR thanh toán.
- [ ] Khi nhập đúng License Key (Vĩnh viễn hoặc 1 Năm): Ứng dụng mở khóa ngay lập tức và cho phép xuất không giới hạn.
- [ ] Khi bấm "Hủy kích hoạt": Hệ thống quay về trạng thái chưa kích hoạt chuẩn xác.

<!-- slug: fix-license-trial-system -->
