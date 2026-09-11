# Phase 02: Nâng Cấp Giao Diện Thanh Chọn Sheet & Khắc Phục Ghép Cột Clipboard

## Mục Tiêu
Nâng cấp giao diện trong `src/renderer/pages/SetupPage.tsx` để:
1. Luôn hiển thị thanh chọn Sheet nổi bật, đẹp mắt khi nạp file Excel.
2. Cung cấp nút chuyển đổi rõ ràng giữa File Excel và Clipboard.
3. Hiển thị đúng 6 cột đã khớp khi ở chế độ Clipboard thay vì báo đỏ `-- Chưa chọn --`.

## Chi Tiết Công Việc

1. **Thanh chọn Sheet nổi bật (`loaded-sheet-selector`)**:
   - Khi có `side.meta`:
     - Hiển thị thanh thẻ chọn sheet: Icon Sheet, tên sheet đang chọn, số dòng, nhãn độ tin cậy (`95% TT200`).
     - Dropdown `<select>` đẹp mắt, có viền bo tròn, hiển thị tất cả các sheet kèm số dòng của từng sheet để người dùng chuyển đổi tức thì.
     - Khi đổi sheet, tự động cập nhật lại toàn bộ mapping 6 cột và 4 cột nâng cao theo `s.suggestedMapping`.

2. **Phân định rõ nguồn File Excel và Clipboard**:
   - Khi ở chế độ Clipboard:
     - Hiển thị banner: `Nguồn dữ liệu: Dán từ Clipboard (3.531 dòng)`.
     - Kèm nút bấm: `[ 📁 Chuyển sang chọn file Excel ]` để người dùng bấm vào là mở hộp thoại chọn file ngay lập tức nếu đã dán nhầm.

3. **Sửa lỗi hiển thị dropdown 6 cột ở chế độ Clipboard**:
   - Khi `side.pasted` có dữ liệu:
     - Tạo danh sách các cột từ ma trận dán: `Cột 1`, `Cột 2`, `Cột 3`...
     - Khi `currentIdx != null` (ví dụ `auto.date = 0`), dropdown hiển thị đúng `✓ Cột 1 (Ngày)` thay vì nhảy về `-- Chưa chọn --`.
     - Thẻ mapping chuyển sang trạng thái tích xanh `✓` (thay vì dấu chấm than đỏ `!`).

## Tiêu Chí Nghiệm Thu
- Người dùng có thể nhìn thấy và chọn đổi sheet ngay lập tức.
- Khi dán Clipboard, 6 cột đều hiện tích xanh `✓` và tên cột tương ứng.
