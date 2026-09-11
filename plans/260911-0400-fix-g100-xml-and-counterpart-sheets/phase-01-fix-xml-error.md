# Phase 01: Điều Tra & Sửa Lỗi XML OpenXML Sheet G 151 & G 152

## Mục tiêu
Khắc phục triệt để lỗi XML khiến Microsoft Excel xóa bỏ sheet `G 151` (`sheet8.xml`) và `G 152` (`sheet9.xml`).

## File tác động
- `src/domain/workingpaper/openxml/OpenXmlPackageEditor.ts`
- `src/domain/workingpaper/fillers/G100_RevenueFiller.ts`

## Chi tiết thực hiện
1. Trích xuất nội dung `sheet8.xml` và `sheet9.xml` sau khi được sửa đổi bằng `updateCell` để đối chiếu với file gốc:
   - Kiểm tra xem regex thay thế cell có làm hỏng thẻ công thức `<f>` hoặc thứ tự thuộc tính của thẻ `<c>` không.
   - Kiểm tra xem các hàng được chèn có thiếu thuộc tính bắt buộc nào không.
2. Sửa logic cập nhật trong `OpenXmlPackageEditor` hoặc phương pháp cập nhật của `G100_RevenueFiller.ts` để bảo đảm chuẩn XML hợp lệ 100%.
3. Kiểm tra lại bằng script PowerShell mở file qua Excel COM: xác nhận không còn thông báo repair.
