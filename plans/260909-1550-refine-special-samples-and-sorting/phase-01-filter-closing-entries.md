---
phase: 1
title: "Filter Out Closing Entries & Eliminate Leaked Rows"
status: completed
priority: P1
effort: "0.5h"
dependencies: []
---

# Phase 1: Filter Out Closing Entries & Eliminate Leaked Rows

## Overview

Trong file kế toán thực tế của khách hàng (như trong ảnh màn hình Image 1 dòng #72):
- Chứng từ: `NVK0137`
- Diễn giải: `"`
- TK Nợ: `Kết ...` (chữ "Kết chuyển...")
- TK Có: `5112`
- Số tiền: `911`

Hiện tại trong `src/domain/sampling/sectionFilter.ts`:
```ts
if (exclude911 && is911(item.debit, item.credit)) {
  return false
}
```
Hàm này chỉ kiểm tra xem mã tài khoản có bắt đầu bằng `911` hay không. Do chữ `"Kết..."` không bắt đầu bằng `"911"`, dòng này đã bị lọt qua bộ lọc của phần hành Doanh thu và bị nhặt vào mẫu kiểm tra.

## Requirements

1. Cập nhật `sectionFilter.ts`:
   - Kiểm tra `isAllocationOrClosing(item)`.
   - Kiểm tra nếu `debit` hoặc `credit` chứa chuỗi *"KẾT"* / *"KET"* / *"911"*.
   ```ts
   function isClosingEntry(item: SampleableItem): boolean {
     if (is911(item.debit, item.credit)) return true
     if (isAllocationOrClosing(item)) return true
     const d = (item.debit || '').toUpperCase()
     const c = (item.credit || '').toUpperCase()
     if (d.includes('KẾT') || d.includes('KET') || c.includes('KẾT') || c.includes('KET')) return true
     if (d.startsWith('911') || c.startsWith('911')) return true
     return false
   }
   ```
2. Trong `filterBySection`:
   ```ts
   if (exclude911 && isClosingEntry(item)) {
     return false
   }
   ```
3. Viết unit test trong `src/domain/sampling/samplingEngine.test.ts` đảm bảo dòng NVK0137 (TK Nợ: "Kết chuyển", TK Có: "5112", tiền: 911) bị loại trừ 100%.

## Verification Gate

```bash
npx vitest run src/domain/sampling
```
Phải pass 100% các bài test hiện tại và test case mới.
