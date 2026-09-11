# Phase 03: Chuẩn Hóa Định Dạng Màu Sắc & Đường Kẻ Kế Toán (Visual Styling)

## Mục tiêu
Đảm bảo thẩm mỹ hồ sơ: màu header chuyên nghiệp, gạch chân đôi dòng tổng cộng, ô AJE màu vàng cảnh báo.

## File tác động
- `src/domain/workingpaper/helpers.ts`

## Chi tiết thực hiện
- Bổ sung helper `styleAuditHeaderRow(row, fgColor)`: Nền xanh navy hoặc xanh rêu đậm (`#1F4E79` / `#2E5B37`), chữ trắng đậm, viền mỏng.
- Bổ sung helper `styleTotalDoubleUnderline(row)`: Viền trên nét đơn (thin), viền dưới nét đôi (double).
- Bổ sung helper `styleAjeAdjustmentCell(cell)`: Nền vàng nhạt (`#FFF2CC`) viền cam mỏng.
