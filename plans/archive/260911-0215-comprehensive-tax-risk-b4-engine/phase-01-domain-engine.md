# Phase 1: Nâng cấp Domain Engine CashTaxRiskScanner thành ComprehensiveTaxRiskScanner

## Mục tiêu
Xây dựng lõi quét đa chuyên đề các khoản chi phí không được trừ theo quy định của Luật Thuế TNDN (Thông tư 96/2015, TT 78/2014, NĐ 181/2025):
1. Mở rộng `src/domain/analytics/types.ts`:
   - Định nghĩa `TaxRiskCategory`:
     - `'CASH_OVER_THRESHOLD'`: Chi tiền mặt >= 5tr (NĐ 181)
     - `'CASH_SPLIT_SAME_DAY'`: Chia nhỏ phiếu chi tiền mặt cùng ngày
     - `'PENALTY_ADMIN_TAX'`: Tiền phạt VPHC, phạt chậm nộp thuế (TK 811)
     - `'NO_INVOICE_EXPENSE'`: Chi phí không hóa đơn / mua hàng lẻ
     - `'WELFARE_UNREASONABLE'`: Chi phúc lợi, trang phục bất thường
2. Cập nhật `src/domain/analytics/CashTaxRiskScanner.ts`:
   - Thêm quy tắc quét các khoản phạt Nợ 811:
     - Từ khóa: `phạt`, `chậm nộp`, `truy thu`, `vphc`, `vi phạm hành chính`, `phạt thuế`, `án phí`...
   - Thêm quy tắc quét chi phí không hóa đơn trên 641, 642, 627:
     - Diễn giải chứa: `không hóa đơn`, `không hđ`, `mua lẻ`, `mua chợ`, `bảng kê lẻ` hoặc không có số hóa đơn.
   - Thống kê tổng chi phí không được trừ Chỉ tiêu B4, thuế TNDN tăng thêm (20%) và bóc tách theo từng chuyên đề.

## File tác động
- `src/domain/analytics/types.ts`
- `src/domain/analytics/CashTaxRiskScanner.ts`
