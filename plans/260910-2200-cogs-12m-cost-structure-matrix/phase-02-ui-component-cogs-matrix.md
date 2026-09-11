---
phase: 2
title: "Xây dựng Giao diện Component CogsMatrix12MTable và Tính Năng Lọc Thông Minh"
status: "pending"
files_modified:
  - "src/renderer/components/Analytics/CogsMatrix12MTable.tsx"
  - "src/renderer/styles.css"
---

# Phase 2: Xây dựng Giao diện Component CogsMatrix12MTable và Tính Năng Lọc Thông Minh

## Mục tiêu
Tạo component React `CogsMatrix12MTable.tsx` hiển thị ma trận 12 tháng bóc tách chi phí giá vốn trước khi kết chuyển, có các nhóm cột nghiệp vụ rõ ràng, hỗ trợ ẩn cột rỗng thông minh và cảnh báo trực quan các tháng dồn chi phí.

## Chi tiết các bước thực hiện:

1. **Thiết kế Cấu trúc Bảng Ma Trận**:
   - **Thanh công cụ đầu bảng**:
     - Tiêu đề: *"Ma Trận Chi Phí Cấu Thành Giá Vốn 12 Tháng (Trước Kết Chuyển 911)"*.
     - Badge loại hình doanh nghiệp: `SẢN XUẤT / XÂY LẮP` (xanh ngọc) hoặc `THƯƠNG MẠI` (xanh dương) hoặc `HỖN HỢP`.
     - Nút toggle: `[Ẩn cột không phát sinh]` (tự động giấu các cột toàn gạch ngang `[-]`).
     - Bộ chuyển đổi đơn vị: `[Số tiền VNĐ]` | `[Tỷ trọng %]` | `[Song song]`.
   - **Nhóm cột 1: Chi Phí Đầu Vào Phát Sinh Thực Tế Trong Kỳ**:
     - NVL trực tiếp (Nợ 621)
     - Nhân công trực tiếp (Nợ 622)
     - Sản xuất chung (Nợ 627)
     - Chi phí SXKD dở dang (Nợ 154)
     - Mua hàng hóa nhập kho (Nợ 156)
     - Cột phụ: **Tổng Chi Phí Phát Sinh**
   - **Nhóm cột 2: Giá Vốn Hạch Toán Xuất Bán (Nợ 632)**:
     - Xuất kho hàng hóa (Có 156)
     - Xuất kho thành phẩm (Có 155)
     - Chi phí dịch vụ hoàn thành (Có 154)
     - Chi phí mua ngoài / Khác (Có 111, 112, 331...)
     - Cột tổng: **Tổng Giá Vốn 632 Trong Kỳ**
   - **Nhóm cột 3: Doanh Thu & Biên So Sánh**:
     - Doanh thu bán hàng (Có 511)
     - Tỷ lệ Giá vốn / Doanh thu (%)
   - **Nhóm cột 4: Cảnh Báo Kiểm Toán (VSA 520)**:
     - Huy hiệu cảnh báo:
       - 🔴 `Dồn giá vốn cuối năm (T12 chiếm > 50%)`
       - 🟠 `Treo chi phí 154 không kết chuyển`
       - 🟡 `Bán hàng không hạch toán giá vốn tương ứng`
       - 🟢 `Khớp đúng kỳ`

2. **Dòng Tổng Cộng Cả Năm**:
   - Đặt cố định ở đáy bảng với màu nền nhấn (`#f8fafc` hoặc `#eff6ff`), hiển thị tổng phát sinh cả năm của từng khoản mục.

3. **Hộp Tóm Tắt Phát Hiện Kiểm Toán (Audit Summary Box)**:
   - Đặt phía dưới bảng, liệt kê các kết luận kiểm toán súc tích giúp KTV đưa thẳng vào Giấy làm việc.

4. **CSS Styling (`src/renderer/styles.css`)**:
   - Cố định cột Tháng (`position: sticky; left: 0`).
   - Kẻ viền phân nhóm cột bằng border đậm hơn giữa nhóm Đầu vào và nhóm Giá vốn xuất bán.
   - Định dạng số tiền `#,##0` căn phải, font chữ monospace dễ gióng hàng.
