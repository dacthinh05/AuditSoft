---
id: "phase-04"
name: "Kiểm thử end-to-end và xác thực tính thẩm mỹ của file Excel"
plan: "plans/260911-1102-export-charts-to-excel/plan.md"
status: "pending"
---

# Pha 4: Kiểm thử end-to-end và xác thực tính thẩm mỹ của file Excel

## 1. Mục Tiêu
Kiểm thử toàn diện từ hành động bấm nút xuất trên giao diện, tạo ảnh SVG, gửi qua IPC và lưu file Excel chứa biểu đồ.

## 2. Các Bước Thực Hiện
1. Viết script kiểm thử mô phỏng việc tạo ảnh PNG từ SVG và nhúng vào `ExcelJS`.
2. Kiểm tra file output `.xlsx` bằng công cụ inspect hoặc mở trực tiếp trên Excel.
3. Chạy `npm run build` đảm bảo không có lỗi TypeScript ở Main, Preload và Renderer.

## 3. Tiêu Chí Nghiệm Thu
- [ ] Lệnh build `npm run build` thành công 100%.
- [ ] File Excel mở lên hiển thị đầy đủ cả bảng dữ liệu lẫn hình ảnh biểu đồ trực quan.
