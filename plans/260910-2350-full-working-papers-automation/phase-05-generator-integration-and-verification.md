---
title: "Phase 5: Tích Hợp Generator & Kiểm Thử Hồi Quy 15 Files"
description: "Wire toàn bộ 15 fillers vào WorkingPaperGenerator, cập nhật test suite và xác thực việc sinh trọn bộ hồ sơ kiểm toán 15 files."
status: completed
priority: P1
effort: "20m"
tags: [workingpaper, integration, verification, test-suite, vitest]
---

# Phase 5: Tích Hợp Generator & Kiểm Thử Hồi Quy 15 Files

## Mục Tiêu
1. Đăng ký đầy đủ 15 tệp trong mảng `runners` của `WorkingPaperGenerator.ts`:
   - `A - B - H - Mau 2025 - Thinh.xlsx` (ABH_MasterFiller)
   - `Leadsheet - 2025 - Dac Thinh.xlsx` (LeadsheetFiller)
   - `D100` (Cash)
   - `D200` (Investment - mới)
   - `D300` (Receivable)
   - `D500` (Inventory)
   - `D600` (Prepaid)
   - `D700` (FixedAsset)
   - `E100` (Borrowing)
   - `E200` (Payable)
   - `E300` (Tax)
   - `E400` (Payroll)
   - `F100` (Equity)
   - `G100` (Revenue)
   - `G200` (Expense)
2. Nâng cấp `tests/workingpaper.test.ts`:
   - Kiểm tra xử lý đủ 15 files (thay vì 12 files cũ).
   - Kiểm tra tính hợp lệ của file sinh ra (kích thước file > 10KB, không bị corrupt định dạng OpenXml).
3. Đảm bảo 100% typecheck và test suite vượt qua.

## Files Thay Đổi
- `src/domain/workingpaper/WorkingPaperGenerator.ts`
- `tests/workingpaper.test.ts`

## Tiêu Chí Nghiệm Thu
- [ ] `summary.totalFilesProcessed === 15`.
- [ ] `summary.successfulFiles === 15`.
- [ ] `summary.failedFiles === 0`.
- [ ] Chạy `npm run typecheck` 0 error.
- [ ] Chạy `npx vitest run tests/workingpaper.test.ts` vượt qua 100%.
