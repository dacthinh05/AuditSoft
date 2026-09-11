# Phase 1: Dọn Dẹp Tên Sheet & Xóa Sheet Rác

## Mục Tiêu
- Loại bỏ khoảng trắng thừa ở cuối tên sheet trong các file mẫu để tránh đứt gãy công thức liên kết:
  + `E 492 ` -> `E 492` trong `GLV MAU/E400 - Luong - Mau 2025 - Thinh.xlsx`.
  + `H150 ` -> `H150` trong `GLV MAU/A - B - H - Mau 2025 - Thinh.xlsx`.
- Xóa sheet mặc định `Sheet1` không có dữ liệu trong `E400 - Luong`.

## Trạng Thái
- [x] Đã thực thi dọn dẹp trực tiếp bằng Openpyxl an toàn.
- [x] Đã xác nhận không làm mất công thức và danh sách sheet sạch 100%.
