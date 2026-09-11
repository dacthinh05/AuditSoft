---
phase: 3
title: "Đồng Bộ OpenXml/ExcelJS Filler Cho Sheet ADD (A3-A4) & Viết Test Kiểm Thử"
status: ready
priority: P1
effort: "35m"
files:
  - "src/domain/workingpaper/openxml/OpenXmlPackageEditor.ts"
  - "src/domain/workingpaper/helpers.ts"
  - "tests/workingpaper-add-periods.test.ts"
---

# Phase 03: Đồng Bộ OpenXml/ExcelJS Filler Cho Sheet ADD (A3-A4) & Viết Test Kiểm Thử

## 1. Mục Tiêu
1. Đảm bảo hàm `fillAddSheet` ở cả hai chế độ sinh file (OpenXmlPackageEditor - nhanh, và helpers.ts - ExcelJS) tôn trọng và ghi nhận chính xác 2 chuỗi `auditPeriod1` và `auditPeriod2` do KTV nhập từ giao diện vào các ô `A3` và `A4` của sheet `ADD`.
2. Giữ nguyên cấu trúc tiền tố chuẩn `Đợt 1:             ` và `Đợt 2:             ` để bảo toàn tính tương thích 100% với các công thức `MID`/`RIGHT` trích xuất thông tin đợt kiểm toán trên các sheet Leadsheet VACPA.
3. Viết bộ unit test tự động `tests/workingpaper-add-periods.test.ts` để kiểm chứng logic điền đợt và chạy toàn bộ test suite.

---

## 2. Chi Tiết Kỹ Thuật

### 2.1. Cập nhật `OpenXmlPackageEditor.ts`
Trong phương thức `public fillAddSheet(engagement: EngagementInfo)`:
```ts
const yearStr = (engagement?.fiscalYearEnd || '2026').slice(-4) || '2026'

// A3: Đợt 1 (Interim)
const rawP1 = engagement.auditPeriod1?.replace(/^Đợt 1:\s*/i, '').trim() || `01/01 - 30/06/${yearStr}`
this.updateCell('ADD', 'A3', { text: `Đợt 1:             ${rawP1}` })

// A4: Đợt 2 (Final)
const rawP2 = engagement.auditPeriod2?.replace(/^Đợt 2:\s*/i, '').trim() || `01/07 - 31/12/${yearStr}`
this.updateCell('ADD', 'A4', { text: `Đợt 2:             ${rawP2}` })
```

### 2.2. Cập nhật `src/domain/workingpaper/helpers.ts`
Trong hàm `fillAddSheet(ws: ExcelJS.Worksheet, engagement: EngagementInfo)`:
```ts
const yearStr = engagement.fiscalYearEnd.slice(-4) || '2026'
const rawP1 = engagement.auditPeriod1?.replace(/^Đợt 1:\s*/i, '').trim() || `01/01 - 30/06/${yearStr}`
const rawP2 = engagement.auditPeriod2?.replace(/^Đợt 2:\s*/i, '').trim() || `01/07 - 31/12/${yearStr}`

// A3: Đợt 1
const a3Cell = ws.getCell('A3')
a3Cell.value = `Đợt 1:             ${rawP1}`

// A4: Đợt 2
const a4Cell = ws.getCell('A4')
a4Cell.value = `Đợt 2:             ${rawP2}`
```

### 2.3. Viết Unit Test `tests/workingpaper-add-periods.test.ts`
- **Test case 1:** Kiểm tra `OpenXmlPackageEditor` điền chuẩn `auditPeriod1` và `auditPeriod2` tùy biến (ví dụ: `01/01 - 30/09/2025` và `01/10 - 31/12/2025`).
- **Test case 2:** Kiểm tra fallback mặc định khi không truyền `auditPeriod1`/`auditPeriod2` (tự lấy theo `fiscalYearEnd`).
- **Test case 3:** Kiểm tra `helpers.fillAddSheet` (ExcelJS) ghi đúng cấu trúc chuỗi cho ô `A3` và `A4`.

---

## 3. Kiểm Thử & Nghiệm Thu
- [ ] Chạy `npx vitest run tests/workingpaper-add-periods.test.ts` $\rightarrow$ Tất cả test cases pass 100%.
- [ ] Chạy toàn bộ test suite `npx vitest run` $\rightarrow$ 76 test files pass, 0 regressions.
- [ ] Chạy `npm run typecheck` $\rightarrow$ TypeScript pass 100%.
