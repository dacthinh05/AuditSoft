---
phase: 4
title: "Kiểm thử Unit Test, Khử ký tự đặc biệt & Kiểm thử tích hợp E2E"
status: pending
priority: P2
effort: "30m"
dependencies: ["phase-01", "phase-02", "phase-03"]
---

# Phase 4: Kiểm thử Unit Test, Khử ký tự đặc biệt & Kiểm thử tích hợp E2E

## Goal
Viết bộ kiểm thử Unit Test toàn diện cho bộ phân tích tên file `smartFilenameParser.test.ts`, kiểm tra xử lý ký tự cấm Windows, kiểm tra hồi quy toàn bộ hệ thống test hiện có để đảm bảo tính an toàn và ổn định tuyệt đối trước khi bàn giao.

## Files to Create / Modify
- Create: `tests/unit/smartFilenameParser.test.ts`
- Modify: `tests/workingpaper.test.ts` (nếu cần bổ sung kiểm tra tên file mới)

## Tasks & Steps

1. **Viết toàn bộ Unit Test trong `tests/unit/smartFilenameParser.test.ts`**:
   - **Nhóm 1: Kiểm thử bóc tách tên file thực tế (Parsing Test Cases)**:
     - Case 1 (Tệp của khách hàng hiện tại): `LONG RICH 2025 - D2 - sau dc.xlsx`
       $\to$ `clientShortName = 'Long Rich'`, `auditPeriodStage = 'D2'`, `fiscalYear = '2025'`.
     - Case 2 (Đợt 1 trước điều chỉnh): `Long Rich 2025_D1_truoc dc.xlsx`
       $\to$ `clientShortName = 'Long Rich'`, `auditPeriodStage = 'D1'`, `fiscalYear = '2025'`.
     - Case 3 (File có đuôi Final/Interim): `NKC May Mac Gia Cong 2026 Final.xlsx`
       $\to$ `clientShortName = 'May Mac Gia Cong'`, `auditPeriodStage = 'D2'`, `fiscalYear = '2026'`.
     - Case 4 (File tên rác): `MAU NKC.xlsx` kết hợp fallback tên đầy đủ `Công ty Cổ phần May Mặc Gia Công Test`
       $\to$ `clientShortName = 'May Mặc Gia Công Test'`, `auditPeriodStage = ''`.
     - Case 5 (Tiền tố pháp lý): `Công ty TNHH Thương Mại Dịch Vụ ABC`
       $\to$ `clientShortName = 'Thương Mại Dịch Vụ ABC'`.

   - **Nhóm 2: Kiểm thử chuẩn hóa tên KTV sang ASCII không dấu (`toAsciiAuditor`)**:
     - `Đắc Thịnh` $\to$ `Thinh`
     - `Nguyễn Hải Triều` $\to$ `Trieu`
     - `Phạm Hoàng Anh` $\to$ `Anh`
     - `KTV` $\to$ `KTV`
     - `Đỗ Mỹ Linh` $\to$ `Linh`

   - **Nhóm 3: Kiểm thử khử ký tự cấm Windows (`sanitizeFileName`)**:
     - Chuỗi chứa `/ \ : * ? " < > |` phải được thay thế an toàn, không gây crash `fs.mkdirSync` hay `fs.writeFileSync`.

   - **Nhóm 4: Kiểm thử định dạng tên file W/P (`formatWorkingPaperFileName`)**:
     - Mode `'compact'`:
       - `D100` $\to$ `D100 - Long Rich D1 2026 - Thinh.xlsx`
       - `Leadsheet` $\to$ `Leadsheet - Long Rich D1 2026 - Thinh.xlsx`
       - `A - B - H` $\to$ `A - B - H - Long Rich D1 2026 - Thinh.xlsx`
     - Mode `'standard'`:
       - `D100` $\to$ `D100 - Tien - Long Rich D1 2026 - Thinh.xlsx`
       - `D500` $\to$ `D500 - HTK - Long Rich D1 2026 - Thinh.xlsx`

   - **Nhóm 5: Kiểm thử định dạng tên thư mục kết quả (`formatOutputDirectoryName`)**:
     - Có đợt: `HoSoKiemToan_Long Rich_D2_2025`
     - Không có đợt: `HoSoKiemToan_Long Rich_2025`

2. **Chạy kiểm thử hồi quy (Regression Test)**:
   - Chạy `npx vitest run tests/d300-receivable-fill.test.ts`
   - Chạy `npx vitest run tests/workingpaper.test.ts`
   - Chạy `npx vitest run tests/workingpaper-add-periods.test.ts`
   - Chạy kiểm tra tĩnh TypeScript: `npx tsc --noEmit`
   - Chạy Linter: `npm run lint`

## Verification
- Lệnh chạy test:
  ```bash
  npx vitest run tests/unit/smartFilenameParser.test.ts
  npm test
  npm run lint
  ```
- Tiêu chí đạt: Toàn bộ test suite pass 100%, không phát sinh cảnh báo TypeScript hoặc Lint.
