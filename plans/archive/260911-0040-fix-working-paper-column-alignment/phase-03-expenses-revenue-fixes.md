# Phase 3: Sửa lỗi vùng dữ liệu cho nhóm Chi phí & Doanh thu (G100, G200, E400)

## Mục tiêu
Đảm bảo các ma trận phân tích chi phí lương, bán hàng, quản lý và đối chiếu doanh thu không bị lệch dòng hay đè ô:
1. **`E400_PayrollFiller.ts`**:
   - Kiểm tra Bảng 1 và Bảng 2 trên `E 490`: Đảm bảo điền đúng từ hàng 42 đến 53 (tháng 1 đến 12), không ghi đè vào hàng 54 (`SUM`) và hàng 55 (`Tỷ lệ`).
2. **`G200_ExpenseFiller.ts`**:
   - Kiểm tra các sheet `G353` và `G453`: Khớp đúng cột chi phí tương ứng và giữ nguyên hàng tổng cộng.
3. **`G100_RevenueFiller.ts`**:
   - Xác nhận sheet `G 150`: Các dòng đối chiếu thuế GTGT và sổ kế toán khớp đúng từ hàng 16 đến 27 (12 tháng).

## File tác động
- `src/domain/workingpaper/fillers/E400_PayrollFiller.ts`
- `src/domain/workingpaper/fillers/G200_ExpenseFiller.ts`
- `src/domain/workingpaper/fillers/G100_RevenueFiller.ts`
