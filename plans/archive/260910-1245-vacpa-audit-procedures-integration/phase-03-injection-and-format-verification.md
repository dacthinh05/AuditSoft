# Phase 03: Thực Thi Tích Hợp Vào 13 File GLV & Kiểm Tra Nghiệm Thu Định Dạng

## 1. Mục Tiêu
Chạy script engine để cập nhật lần lượt toàn bộ 13 file GLV trong thư mục `D:\Desktop\Project\5. AuditSoft\GLV MAU`, sau đó thực hiện kiểm tra tính toàn vẹn của từng file: mở lại không lỗi, công thức không bị phá hủy, định dạng hiển thị hoàn hảo.

## 2. Các Bước Thực Hiện
1. **Chạy script tiêm thủ tục**:
   Thực thi lệnh Python cập nhật 13 file GLV.
2. **Kiểm tra tự động bằng code**:
   - Quét lại 13 file vừa ghi đè.
   - Kiểm tra xem sheet `*20` đã có đầy đủ các dòng thủ tục chưa.
   - Đảm bảo các sheet khác trong workbook (`*110`, `*141`, `*146`, `*191`, `*195`, `*196`...) không bị thay đổi hay suy giảm dung lượng.
3. **Kiểm tra trực quan Format**:
   - Kiểm tra chiều rộng cột A -> G để không bị lỗi text tràn hay bị che khuất (`###`).
   - Đảm bảo tiêu đề bảng thủ tục kiểm toán nằm ngay dưới phần thông tin khách hàng và nằm trên phần thuyết minh BCTC.

## 3. Tiêu Chí Nghiệm Thu Hoàn Thành (Acceptance Criteria)
- Cả 13 file GLV trong `GLV MAU` đều có bảng Thủ Tục Kiểm Toán chuẩn VACPA.
- Format ô, font chữ, viền kẻ đồng bộ 100% với phong cách hồ sơ kiểm toán hiện tại của công ty.
- Không có bất kỳ cảnh báo lỗi cấu trúc XML nào khi mở file Excel.
