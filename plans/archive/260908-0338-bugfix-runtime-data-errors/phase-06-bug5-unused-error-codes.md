---
phase: 6
title: "BUG-5: Fix RowErrorCode chết — THIEU_TK_NO/CO không bao giờ được push"
status: completed
priority: P2
effort: "20m"
dependencies: [5]
---

# Phase 6: BUG-5 — unused RowErrorCodes

## Overview
`RowErrorCode` định nghĩa 4 codes: `LOI_NGAY | LOI_TIEN | THIEU_TK_NO | THIEU_TK_CO`. `standardize.ts` chỉ push `LOI_NGAY`. Ba code còn lại có label trong `ROW_ERROR_LABELS` nhưng không bao giờ được set → tab "Lỗi dữ liệu" không hiển thị rows thiếu TK Nợ/Có.

Đồng thời xóa dead code `void normalizeKeyword` trong `JournalNormalizer.ts:216`.

## Design Decision
`LOI_TIEN` không nên add vào `standardize.ts` vì các dòng tiền null/0 đã bị `dropped` (filter BoRong). Chỉ add:
- `THIEU_TK_NO`: khi `mapping.debit != null` và giá trị debit sau trim = `''`
- `THIEU_TK_CO`: khi `mapping.credit != null` và giá trị credit sau trim = `''`

Không drop dòng thiếu TK — vẫn đưa vào entries với flag lỗi (nhất quán với xử lý `LOI_NGAY`).

## Related Code Files
- Modify: `src/domain/pipeline/standardize.ts` (sau line 64, trước line 67)
- Modify: `src/main/accounting/JournalNormalizer.ts` (line 216 — xóa `void normalizeKeyword`)

## Implementation Steps
1. Trong `standardize.ts`, sau khi push `LOI_NGAY`, thêm check TK Nợ/Có:
```typescript
// Thêm sau block LOI_NGAY (sau line 65)
const debitStr = pqTrim(coerceCellToString(debitRaw))
const creditStr = pqTrim(coerceCellToString(creditRaw))
if (mapping.debit != null && debitStr === '') errors.push('THIEU_TK_NO')
if (mapping.credit != null && creditStr === '') errors.push('THIEU_TK_CO')
```

2. Trong `JournalNormalizer.ts:216`, xóa dòng `void normalizeKeyword`:
```typescript
// BEFORE line 216
void normalizeKeyword

// AFTER — xóa dòng này hoàn toàn
```

3. Kiểm tra xem `normalizeKeyword` có import nào khác dùng không — nếu không, xóa luôn import.

## Todo
- [ ] Thêm check `THIEU_TK_NO` và `THIEU_TK_CO` trong `standardize.ts`
- [ ] Xóa `void normalizeKeyword` dead statement trong `JournalNormalizer.ts`
- [ ] Kiểm tra và xóa import `normalizeKeyword` nếu không dùng ở đâu khác
- [ ] Chạy `npm test` + `npm run typecheck`

## Risk Assessment
- Thêm errors cho TK trống sẽ làm tăng `errorRows` count trong stats — UI hiển thị thêm dòng trong tab lỗi. Đây là hành vi đúng, không phải regression.
- Test file `standardize.test.ts` có thể cần cập nhật nếu test với mapping.debit != null mà giá trị rỗng.

## Success Criteria
- [ ] Dòng thiếu TK Nợ hiển thị trong tab lỗi với label "Thiếu TK Nợ"
- [ ] Dòng thiếu TK Có hiển thị với label "Thiếu TK Có"
- [ ] Không còn `void normalizeKeyword` trong codebase
- [ ] `npm test` không regression
