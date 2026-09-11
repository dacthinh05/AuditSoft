# Phase 2: Nâng cấp ExpenseByNatureEngine.ts — Thuật toán cân đối kho thông minh

## Mục tiêu
Đảm bảo phương trình Thuyết minh BCTC cân đối 100%:
1. **Trường hợp có `cdfsAccounts`:**
   - Đọc chính xác số dư đầu năm và cuối năm của TK 154 và toàn bộ TK con 155 (`1551`, `1552`...).
2. **Trường hợp file NKC độc lập (không có CDFS):**
   - Tự động trích xuất biến động kho từ các dòng phát sinh trên NKC:
     - `deltaWip154 = Nợ 154 (từ 62x) - Có 154 (nhập kho 155)`
     - `deltaFinished155 = Nợ 155 (từ 154) - Có 155 (xuất bán 632)`
3. **Cập nhật `FinancialCorrelationEngine.ts`:**
   - Thêm tham số `cdfsAccounts?: Map<string, CdfsAccountRow>` vào `FinancialCorrelationEngine.analyze` và chuyển tiếp cho `ExpenseByNatureEngine.analyze(entries, cdfsAccounts)`.

## File tác động
- `src/domain/analytics/ExpenseByNatureEngine.ts`
- `src/domain/analytics/FinancialCorrelationEngine.ts`
