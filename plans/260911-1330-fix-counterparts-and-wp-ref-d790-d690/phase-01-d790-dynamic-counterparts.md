# Giai đoạn 1: Chuẩn hóa bóc tách đối ứng động cho D790 (D700)

## Nhiệm vụ
1. Import `extractCounterpartStats` vào `D700_FixedAssetFiller.ts`.
2. Khối 1: **Tài khoản 211** (Hàng 15 - 16):
   - Gọi `extractCounterpartStats(ctx.nkcTransactions, '211')`.
   - Vế Nợ (Cột A: TC, Cột B: TK đối ứng, Cột C: Số tiền):
     - Lấy 2 dòng đầu của `debitItems`.
     - Nếu có item: `updateCell(A, ref)`, `updateCell(B, account)`, `updateCell(C, amount)`.
     - Nếu không có: xóa cell hoặc để trống, set amount = 0.
   - Vế Có (Cột E: TC, Cột F: TK đối ứng, Cột G: Số tiền):
     - Lấy 2 dòng đầu của `creditItems`.
     - Nếu có item: `updateCell(E, ref)`, `updateCell(F, account)`, `updateCell(G, amount)`.
     - Nếu không có phát sinh Có: set `G15 = 0`, `G16 = 0`, gán tỷ lệ `H15 = 0`, `H16 = 0` hoặc thay công thức để tránh `#DIV/0!`.
3. Khối 2: **Tài khoản 214** (Hàng 23 - 25):
   - Gọi `extractCounterpartStats(ctx.nkcTransactions, '214')`.
   - Vế Nợ (Hàng 23 - 25): Lấy `debitItems` điền vào Cột A (TC), B (TK), C (Số tiền).
   - Vế Có (Hàng 23 - 25): Lấy `creditItems` (thường là 627, 641, 642) điền vào Cột E (TC), F (TK), G (Số tiền).
   - Đảm bảo công thức SUM và tỷ lệ cột D / H không bị lỗi `#DIV/0!`.
4. Điền phần kết luận kiểm toán tại dòng 59:
   - "Hạch toán phát sinh tăng, giảm TSCĐ và trích khấu hao trong kỳ phù hợp, không phát hiện đối ứng bất thường."
5. Cập nhật cả 2 nhánh xử lý: `OpenXmlPackageEditor` (chính) và `exceljs` fallback.

## File chỉnh sửa
- `src/domain/workingpaper/fillers/D700_FixedAssetFiller.ts`
