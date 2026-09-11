---
title: "Phase 2: Hoàn Thiện Nhóm Doanh Thu & Chi Phí G100, G200"
description: "Chuyển các sheet G353, G453, G490, G291.2 sang OpenXmlPackageEditor để chạy trong generator tự động, bổ sung chọn mẫu G191.1 và cut-off G195."
status: completed
priority: P1
effort: "45m"
tags: [workingpaper, revenue, expenses, g100, g200, openxml]
---

# Phase 2: Hoàn Thiện Nhóm Doanh Thu & Chi Phí G100, G200

## Mục Tiêu
1. Trong `G200_ExpenseFiller.ts`, hàm `fillExpenseOpenXml` hiện mới chỉ điền 4 sheet (`ADD`, `G210`, `G310`, `G410`). Các tính năng mạnh nhất như `G353` (Chi tiết chi phí bán hàng 641 theo tháng), `G453` (Chi tiết chi phí QLDN 642 theo tháng), `G490` (Chọn mẫu chi phí QLDN) và `G291.2` (Chọn mẫu mua hàng) mới chỉ nằm ở hàm ExcelJS cũ chưa được gọi trong runner OpenXml!
2. Trong `G100_RevenueFiller.ts`, bổ sung `G191.1` (Chọn mẫu hóa đơn doanh thu giá trị lớn / bất thường) và `G195` (Thủ tục kiểm tra khóa sổ Cut-off doanh thu bán hàng).

## Thiết Kế Kỹ Thuật

### 1. `src/domain/workingpaper/fillers/G200_ExpenseFiller.ts` (Nâng cấp OpenXml)
- **Sheet `G353` (Chi tiết CPBH TK 641 12 tháng x TK 4 số):**
  - Tích hợp kết quả phân tích từ `analyzeTransactions(ctx.nkcTransactions).sell`.
  - Điền từng tháng từ T1 đến T12 cho các tài khoản con 6411, 6412, 6413, 6414, 6417, 6418...
  - Điền tổng chi phí, doanh thu và tính tỷ lệ % chi phí/doanh thu.
- **Sheet `G453` (Chi tiết CPQLDN TK 642 12 tháng x TK 4 số):**
  - Tích hợp kết quả phân tích từ `analyzeTransactions(ctx.nkcTransactions).admin`.
  - Điền từng tháng từ T1 đến T12 cho các tài khoản con 6421, 6422, 6423, 6424, 6425, 6426, 6427, 6428...
- **Sheet `G490` (Chọn mẫu chi phí QLDN 642):**
  - Trích xuất Top 10 đối ứng Có của TK 642 (ví dụ Có 111, 112, 331, 334, 338, 214, 242...).
  - Trích xuất 15-20 chứng từ chi phí lớn nhất và đại diện trong kỳ (Ngày, Số CT, Diễn giải, Nợ 642, Có, Số tiền, Tick `P`).
- **Sheet `G291.2` (Chọn mẫu phát sinh mua hàng & nguyên vật liệu):**
  - Trích xuất các nghiệp vụ Nợ 152, 156, 611 / Có 331 lớn nhất trong kỳ.

### 2. `src/domain/workingpaper/fillers/G100_RevenueFiller.ts` (Mở rộng)
- **Sheet `G191.1` (Chọn mẫu doanh thu bán hàng 511):**
  - Lấy danh sách giao dịch Có 511 từ NKC.
  - Áp dụng thuật toán chọn mẫu: Top các hóa đơn giá trị lớn vượt mức PM, cộng với mẫu ngẫu nhiên đại diện qua các tháng.
  - Điền: Ngày hóa đơn, Số hóa đơn, Tên khách hàng/Diễn giải, Nợ 131/111/112, Có 511, Doanh thu, Thuế GTGT 3331, Tick `P`.
- **Sheet `G195` (Kiểm tra Cut-off Doanh thu cuối năm):**
  - Lấy 5-10 hóa đơn doanh thu cuối cùng trước ngày 31/12 và 5-10 hóa đơn đầu tiên sau ngày 31/12.
  - Điền đầy đủ ngày lập, ngày giao hàng, số hóa đơn để đối chiếu kỳ ghi nhận đúng đắn.

## Files Thay Đổi
- `src/domain/workingpaper/fillers/G200_ExpenseFiller.ts`: Viết lại logic OpenXml cho `G353`, `G453`, `G490`, `G291.2`.
- `src/domain/workingpaper/fillers/G100_RevenueFiller.ts`: Thêm logic điền `G191.1` và `G195`.

## Tiêu Chí Nghiệm Thu
- [ ] Sheet `G353` và `G453` được điền đầy đủ ma trận chi phí 12 tháng x các tiểu khoản 641/642, không bị lỗi `#DIV/0!`.
- [ ] Sheet `G490` và `G291.2` có đầy đủ chứng từ mẫu được tick `P`.
- [ ] Sheet `G191.1` và `G195` trong file Doanh thu có dữ liệu chọn mẫu và cut-off thực tế từ Sổ NKC.
