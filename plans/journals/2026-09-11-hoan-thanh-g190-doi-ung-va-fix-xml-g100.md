# Nhật Ký Hoàn Thành: Tự Động Hóa Sheet Bút Toán Đối Ứng (G 190.1, G 190.2) & Sửa Dứt Điểm Lỗi XML File G100

**Ngày thực hiện:** 2026-09-11
**Mục tiêu:** Khắc phục triệt để lỗi XML làm mất sheet G 151/G 152 và tự động hóa 100% hai sheet đối ứng G 190.1 (Đợt 1) và G 190.2 (Cả năm) của file G100.

## Kết Quả Đạt Được

1. **Xử lý dứt điểm lỗi XML:**
   - Bảo toàn tính nguyên vẹn của cấu trúc OpenXML trong `G100_RevenueFiller.ts`.
   - Microsoft Excel COM mở file thành công 100%, đủ 16/16 sheet, không còn bất kỳ cảnh báo repair nào.

2. **Xây dựng module `counterpartExtractor.ts`:**
   - Bóc tách phát sinh Nợ và Có của các tài khoản `511`, `521`, `515`, `711` từ NKC.
   - Hỗ trợ tách 2 kỳ: Đợt 1 (tháng 1 đến tháng 6) và Cả năm (tháng 1 đến tháng 12).
   - Tự động gom nhóm theo tài khoản đối ứng 3 số, sắp xếp số tiền giảm dần và liên kết mã W/P Ref (`RefDictionary.ts`).

3. **Tự động điền 2 Sheet Đối Ứng `G 190.1` & `G 190.2`:**
   - Điền Cột A (Tham chiếu), Cột B (TK ĐỨ), Cột C (Số tiền) cho vế 1. PS NỢ.
   - Điền Cột E (Tham chiếu), Cột F (TK ĐỨ), Cột G (Số tiền) cho vế 2. PS CÓ.
   - Cột Tỷ lệ (D và H) tự động tính toán tỷ trọng %, sạch hoàn toàn lỗi `#DIV/0!`.
   - Tự động điền câu đánh giá kết luận kiểm toán tại ô `B59`.

4. **Kiểm tra thực tế qua Microsoft Excel COM & Vitest:**
   - PowerShell kiểm tra qua COM: Cột tổng `C23` và `G23` khớp đúng 100% số phát sinh Sổ cái (`53.269.438.153 đ`), tỷ lệ `100%`.
   - Vitest: 79 test suites với 376 tests đều passed 100%.
   - `npm run typecheck`: 0 lỗi.
