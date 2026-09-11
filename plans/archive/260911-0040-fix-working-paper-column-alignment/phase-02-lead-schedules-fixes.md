# Phase 2: Sửa dứt điểm lỗi đè ô & lệch cột trên nhóm Lead Schedule (D100, D300, D500, E100, E200, E300)

## Mục tiêu
Sửa các lỗi cụ thể đã phát hiện trong quá trình audit:
1. **`D100_CashFiller.ts`**:
   - Dời `insertAuditConclusion` trên `D 110` xuống hàng 33 (sau hàng ghi chú 30 và bảng đầu tư đến ngày đáo hạn). Trả lại các hàng 23, 24, 25 nguyên vẹn công thức `SUM`.
2. **`E100_BorrowingFiller.ts`**:
   - Cập nhật `setLeadRowValues(wsE110, rowNum, { ck, dk, colDk: 8 })` vì cột năm trước của `E 110` là cột H (cột 8).
3. **`D500_InventoryFiller.ts`**:
   - Dùng `getAccountRollup` cho các tài khoản kho `151`, `152`, `153`, `154`, `155`, `156`, `157`, `158` để số liệu tồn kho hiển thị đầy đủ ngay cả khi doanh nghiệp chỉ hạch toán tài khoản con (`1521`, `1522`...).
4. **`E300_TaxFiller.ts`**:
   - Dùng `getAccountRollup` cho các tài khoản thuế `1331`, `1332`, `33311`, `33312`, `3334`, `3335`...

## File tác động
- `src/domain/workingpaper/fillers/D100_CashFiller.ts`
- `src/domain/workingpaper/fillers/E100_BorrowingFiller.ts`
- `src/domain/workingpaper/fillers/D500_InventoryFiller.ts`
- `src/domain/workingpaper/fillers/E300_TaxFiller.ts`
