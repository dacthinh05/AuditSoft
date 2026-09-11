# Phase 2: Hoàn thiện phương trình kế toán cân đối Thuyết minh BCTC

## Mục tiêu
Đảm bảo phương trình kế toán cân đối 100% trong mọi trường hợp:
1. **Luân chuyển kho 154 (Chi phí SXKD dở dang)**:
   - `Đầu vào 154`: Chi phí đưa vào Nợ 154 từ 62x (hoặc chi phí trực tiếp).
   - `Đầu ra 154`: Nhập kho thành phẩm (`Nợ 155 / Có 154`) + Xuất thẳng giá vốn (`Nợ 632 / Có 154`) + Thu hồi phế liệu (`Nợ 152 / Có 154`).
   - `Delta 154 (ĐK - CK)` = Tổng đầu ra 154 - Tổng đầu vào 154.
2. **Luân chuyển kho 155 (Thành phẩm)**:
   - `Đầu vào 155`: Nhập kho từ 154 (`Nợ 155 / Có 154`) + Nhập kho hàng bán trả lại (`Nợ 155 / Có 632`).
   - `Đầu ra 155`: Xuất bán giá vốn (`Nợ 632 / Có 155`) + Xuất dùng nội bộ/khuyến mại (`Nợ 641, 642 / Có 155`).
   - `Delta 155 (ĐK - CK)` = Tổng đầu ra 155 - Tổng đầu vào 155.
3. **Cân đối hoàn hảo**:
   - `Tổng Thuyết minh tính toán` = `Tổng 5 yếu tố thuần + Thương mại 156 + Delta 154 + Delta 155`.
   - Chênh lệch = `Tổng Thuyết minh tính toán - Tổng P&L thuần` $\rightarrow$ **chắc chắn bằng 0 đ**.

## File tác động
- `src/domain/analytics/ExpenseByNatureEngine.ts`
