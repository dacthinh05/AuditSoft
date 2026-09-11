---
id: "phase-04"
name: "Kiểm thử end-to-end và xác thực an toàn file Excel"
plan: "plans/260911-1038-d100-working-paper-automation/plan.md"
status: "pending"
---

# Pha 4: Kiểm thử end-to-end và xác thực an toàn file Excel

## 1. Mục Tiêu
Chạy script kiểm thử sinh file D100 thực tế từ dữ liệu giả lập và dữ liệu thật, kiểm tra tính toàn vẹn của file sinh ra trên cả hai engine (`OpenXmlPackageEditor` và `ExcelJS.Workbook`).

## 2. Các Bước Thực Hiện
1. Tạo kịch bản kiểm thử tự động với dữ liệu mẫu có cả nghiệp vụ Tiền mặt (111) và Tiền gửi (112) trải dài 12 tháng.
2. Kiểm tra nội dung 4 sheet sau khi sinh:
   - `D146`: Kiểm tra cột C có số dư ngân hàng và không có lỗi công thức.
   - `D 190`: Kiểm tra cột TC có đầy đủ mã `#Ref` tham chiếu đến các phần hành khác (`D390`, `E290`, `G490`...).
   - `D 191.1`: Kiểm tra ngày tháng các dòng mẫu đều nằm trong khoảng tháng 1 đến tháng 6.
   - `D 191.2`: Kiểm tra ngày tháng các dòng mẫu đều nằm trong khoảng tháng 7 đến tháng 12.
3. Kiểm tra tính tương thích với Microsoft Excel:
   - File sinh ra mở bằng script kiểm tra XML không có phần tử lỗi.
   - Biên dịch ứng dụng (`npm run build`) đảm bảo không phát sinh lỗi TypeScript hay Worker.

## 3. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] Lệnh build hệ thống `npm run build` hoàn thành với 0 lỗi.
- [ ] File Excel D100 mở lên trơn tru, không có thông báo "We found a problem with some content...".
