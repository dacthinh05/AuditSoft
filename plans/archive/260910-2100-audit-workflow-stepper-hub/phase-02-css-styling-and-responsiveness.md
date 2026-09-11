---
phase: 2
title: "Thiết kế giao diện CSS Styling và Khả năng Tương thích (Responsive)"
status: "pending"
files_modified:
  - "src/renderer/styles.css"
---

# Phase 2: Thiết kế giao diện CSS Styling và Khả năng Tương thích (Responsive)

## Mục tiêu
Xây dựng bộ quy tắc CSS chuyên biệt trong `styles.css` để biến thanh Stepper thành điểm nhấn thị giác đẳng cấp, hài hòa với giao diện tổng thể của AuditSoft, mang lại trải nghiệm điều hướng trực quan và dễ tiếp cận nhất.

## Chi tiết các bước thực hiện:

1. **Khung Container & Thanh tiêu đề Stepper**:
   - Class `.audit-workflow-stepper`: Nền card màu trắng mềm hoặc xám nhẹ (`#ffffff`), viền bo tròn (`border-radius: 12px`), bóng đổ viền tinh tế (`box-shadow: 0 2px 8px rgba(0,0,0,0.04)`).
   - Thanh tiêu đề phụ: Có nhãn nhỏ *"QUY TRÌNH KIỂM TOÁN THỰC CHIẾN CHUẨN VSA"* và dòng hướng dẫn *"Bắt đầu ca làm việc: Lần lượt hoàn thiện 4 bước để có bộ hồ sơ kiểm toán đầy đủ."*

2. **Lưới 4 Bước & Mũi tên liên kết (Flow Connector)**:
   - Dùng `display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;`
   - Hiệu ứng mũi tên liên kết giữa các bước (bằng pseudo-element `::after` hoặc SVG connector tinh tế).
   - Mỗi card bước có:
     - Số thứ tự lớn cách điệu (01, 02, 03, 04) với màu sắc nhận diện riêng theo giai đoạn (Xanh dương $\rightarrow$ Tím $\rightarrow$ Cam $\rightarrow$ Lục).
     - Badge trạng thái: *"Chưa nạp"* (màu xám nhạt) $\rightarrow$ *"Sẵn sàng / Đã nạp"* (màu xanh lá tươi sáng).
     - Nút bấm *"Bắt đầu bước này"* hoặc click toàn bộ thẻ card.

3. **Tương tác & Responsive Breakpoints**:
   - Hover card: Viền đổi sang màu nhận diện của bước đó, nâng nhẹ (`transform: translateY(-2px)`).
   - Màn hình nhỏ (< 1200px): Co lưới thành 2 hàng x 2 cột (`repeat(2, 1fr)`).
   - Màn hình siêu nhỏ (< 768px): Hiển thị dạng thẻ dọc hoặc cuộn ngang tiện lợi.
