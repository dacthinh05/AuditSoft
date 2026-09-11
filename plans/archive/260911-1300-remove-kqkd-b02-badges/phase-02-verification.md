# Giai đoạn 2: Kiểm tra xác nhận (Verification)

## Nhiệm vụ
1. Chạy TypeScript typecheck để đảm bảo không phát sinh lỗi cú pháp hay component render.
2. Kiểm tra lại code diff để đảm bảo không ảnh hưởng đến cấu trúc cột hoặc bảng KQKD bên cạnh.

## Tiêu chí thành công
- Cột "Chỉ tiêu" hiển thị sạch sẽ chỉ có tên khoản mục.
- Các số âm vẫn giữ highlight đỏ ở cột Năm nay, Năm trước, Chênh lệch.
- Cột % vẫn hiển thị pill tỷ lệ biến động.
- Không có lỗi typecheck hoặc build.
