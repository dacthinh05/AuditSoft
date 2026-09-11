# Phase 4: Kiểm thử toàn diện & Xác thực không đè công thức

## Mục tiêu
Dùng script tự động hóa quét qua toàn bộ các file sinh ra để đảm bảo:
1. Mọi công thức mẫu của VACPA (`SUM`, trừ `F-G`, tỷ lệ `H/G`, `D+E`...) được bảo toàn 100%, không ô nào bị đè giá trị tĩnh.
2. Tất cả các cột số liệu biến động tính ra kết quả số hợp lệ, không có lỗi `#VALUE!`, `#REF!`, `#DIV/0!`.
3. Test suite `tests/workingpaper.test.ts` và toàn bộ test của hệ thống pass 100%.

## File tác động
- `tests/workingpaper.test.ts`
- Script kiểm tra kiểm toán
