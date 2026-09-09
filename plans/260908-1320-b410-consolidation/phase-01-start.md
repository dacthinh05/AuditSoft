---
phase: 1
title: "Technical Spike (COM Engine Edge Cases)"
status: pending
priority: P1
effort: "1d"
dependencies: []
---

# Phase 1: Technical Spike (COM Engine Edge Cases)

## Overview
Tiến hành một Technical Spike độc lập (bằng đoạn script PowerShell hoặc JS gọi COM) để chứng minh tính khả thi của `Range.Copy` và `Worksheet.Copy` đối với các trường hợp khó trong file B410 thực tế.

## Requirements
- Functional: Chạy script đọc được file có đuôi `.xls` và `.xlsx` bằng chế độ `ReadOnly`.
- Non-functional: Quá trình chạy ngầm, không mở giao diện Excel làm gián đoạn người dùng (`Visible = false`).

## Architecture
- Standalone script trong thư mục `scripts/` hoặc `tests/` để test COM Automation.
- Đọc file B410 gốc, copy vùng dữ liệu sang file Master giả lập.

## Related Code Files
- Create: `scripts/test-b410-com-spike.ps1` (hoặc `.js`)
- Modify: N/A

## Implementation Steps
1. Viết script khởi tạo Excel COM Object (tắt `DisplayAlerts`, tắt `Visible`).
2. Mở file B410 gốc (chứa ảnh neo, rich text, merge cells).
3. Xác định tọa độ một "khối" lỗi (VD: Dòng 14 đến 15) và thực thi `Range.Copy`.
4. Dán vào file Master bằng `PasteSpecial` hoặc dán trực tiếp. Kiểm tra xem Excel có tự mang theo shape/ảnh neo qua không. Nếu không, viết bổ sung hàm tính toán `TopLeftCell` để copy shape riêng biệt.
5. Thử nghiệm lệnh `Worksheet.Copy` để copy sheet bảng kê sang file Master. Đổi tên sheet.
6. Thử nghiệm mở file đang bị khóa (bởi tiến trình khác) hoặc có mật khẩu để xem COM văng lỗi ra sao, viết khối `try/catch` bắt lỗi an toàn.
7. Thoát và giải phóng COM object (`Quit()`, `ReleaseComObject`).

## Success Criteria
- [x] Chạy thành công copy khối lệnh chứa ảnh và merged cells sang file mới mà không lệch form.
- [x] Copy thành công một sheet đính kèm.
- [x] Bắt được lỗi an toàn khi file nguồn bị hỏng/có pass mà không để lại tiến trình `excel.exe` rác (zombie process) trên Task Manager.

## Risk Assessment
- Rủi ro: Hình ảnh/Shape không đi theo `Range.Copy` (tùy thuộc thuộc tính `Move and size with cells`).
- Khắc phục (Mitigation): Vòng lặp duyệt qua `Worksheet.Shapes`, kiểm tra `Shape.TopLeftCell.Row` có nằm trong khoảng dòng copy hay không. Nếu có, `.Copy()` shape đó và `.Paste()` vào vị trí đích tương đối.