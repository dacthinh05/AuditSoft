# Giai đoạn 3: Kiểm tra xác nhận (Verification)

## Nhiệm vụ
1. Chạy test suite `tests/workingpaper.test.ts` để kiểm tra độ chính xác của các filler.
2. Kiểm tra typecheck toàn dự án `npm run typecheck`.
3. Chạy script sinh thử file `D700` và `D600` từ dữ liệu mẫu, đọc lại cấu trúc cell bằng Python để khẳng định:
   - Cột A và E có W/P Ref màu đỏ / chuẩn text.
   - Cột B và F có TK 3 số chuẩn (`331`, `112`, `241`...), không còn gạch chéo.
   - Không còn ô nào bị lỗi `#DIV/0!`.
   - TK 214 được điền đúng đối ứng chi phí khấu hao.

## Tiêu chí thành công
- Tất cả unit test và typecheck pass 100%.
- File Excel đầu ra chuẩn chỉnh như cấu trúc mẫu ở Ảnh #2.
