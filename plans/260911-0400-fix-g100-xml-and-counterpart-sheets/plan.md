# Kế Hoạch: Tự Động Hóa Sheet Bút Toán Đối Ứng (G 190.1, G 190.2) & Sửa Dứt Điểm Lỗi XML Mở File G100

## 1. Bối Cảnh & Vấn Đề
- Người dùng phát hiện 2 lỗi nghiêm trọng trên file `G100 - Doanh thu - Mau 2025- Thinh.xlsx`:
  1. **Lỗi mở file:** Excel báo lỗi XML ở `sheet8.xml` (G 151) và `sheet9.xml` (G 152), kích hoạt chế độ sửa chữa và làm mất 2 sheet này.
  2. **Chưa điền Sheet Tài Khoản Đối Ứng (`G 190.1` Đợt 1 & `G 190.2` Cả năm):**
     - Bảng đối ứng 2 vế (PS Nợ vs PS Có) của các tài khoản `511`, `521`, `515`, `711` đang trống trơn.
     - Cột Tỷ lệ đang chứa công thức chia cho ô tổng bằng 0 dẫn đến hiển thị lỗi `#DIV/0!` toàn bộ bảng.

## 2. Mục Tiêu (Outcome)
1. **Sửa dứt điểm lỗi XML tại sheet8 và sheet9**:
   - Xác định nguyên nhân `updateCell` trong `OpenXmlPackageEditor.ts` làm lỗi XML khi cập nhật `G 151` và `G 152`. Đảm bảo file sau khi điền mở trơn tru bằng Microsoft Excel mà không có bất kỳ cảnh báo repair nào.
2. **Tự động hóa hoàn toàn Sheet `G 190.1` (Đợt 1) và `G 190.2` (Cả năm)**:
   - Bóc tách phát sinh Nợ và Có của các tài khoản `511`, `521`, `515`, `711` từ `ctx.nkcTransactions`:
     - Phân loại theo Đợt 1 (tháng 1 đến tháng 6) và Cả năm (tháng 1 đến tháng 12).
     - Gom nhóm theo tài khoản đối ứng 3 số (111, 112, 131, 3331, 152...).
     - Tự động tra cứu mã W/P Ref (`RefDictionary.ts`: 111/112 -> D190, 131 -> D390, 3331 -> E390...).
     - Điền chính xác vào các dòng:
       * `TK 511`: PS Nợ (Rows 16-22), PS Có (Rows 16-22).
       * `TK 521`: PS Nợ (Rows 29-33), PS Có (Rows 29-33).
       * `TK 515`: PS Nợ (Rows 39-43), PS Có (Rows 39-43).
       * `TK 711`: PS Nợ (Rows 49-53), PS Có (Rows 49-53).
   - Tự động điền phần Đánh giá & Kết luận kiểm toán (Rows 58-59).
   - Xóa bỏ 100% lỗi `#DIV/0!` trên cả 2 sheet.

## 3. Danh Sách Các Phases

### Phase 01: Điều Tra & Sửa Lỗi XML OpenXML Sheet G 151 & G 152
- Kiểm tra chi tiết XML của sheet8 (`G 151`) và sheet9 (`G 152`) sau khi `OpenXmlPackageEditor.updateCell` thực thi.
- Khắc phục lỗi định dạng thẻ cell `<c>` hoặc `<f>` gây ra thông báo "Replaced Part: /xl/worksheets/sheet8.xml part with XML error".

### Phase 02: Xây Dựng Engine Bóc Tách Phát Sinh Đối Ứng Doanh Thu (`G 190.1` & `G 190.2`)
- File: `src/domain/workingpaper/counterpartExtractor.ts` (hoặc tích hợp trực tiếp trong `G100_RevenueFiller.ts`).
- Logic lọc:
  - Vế Nợ tài khoản mục tiêu (đối ứng với các TK Có).
  - Vế Có tài khoản mục tiêu (đối ứng với các TK Nợ).
  - Tách theo đợt: `isPeriod1` (tháng 1 - 6) và cả năm (tháng 1 - 12).
  - Gom theo mã TK 3 số, sắp xếp số tiền giảm dần.
  - Lấy mã tham chiếu từ `getWorkingPaperRef(tk3)`.

### Phase 03: Tích Hợp Đổ Dữ Liệu Vào Sheet `G 190.1` và `G 190.2`
- File: `src/domain/workingpaper/fillers/G100_RevenueFiller.ts`.
- Điền đầy đủ Cột A (Tham chiếu), Cột B (TK ĐỨ), Cột C (Số tiền) cho PS Nợ.
- Điền Cột E (Tham chiếu), Cột F (TK ĐỨ), Cột G (Số tiền) cho PS Có.
- Cập nhật dòng Đánh giá kết luận: "Không phát sinh bất thường. Doanh thu phát sinh đối ứng chủ yếu với Phải thu khách hàng (TK 131) và Tiền gửi ngân hàng (TK 112)."

### Phase 04: Kiểm Thử Với Excel COM & Unit Tests (Verification)
- Viết kịch bản kiểm tra tự động bằng Excel COM: mở file `G100 - Doanh thu - Mau 2025- Thinh.xlsx` sau khi fill.
- Xác nhận:
  - Excel mở trực tiếp thành công, không có popup cảnh báo hoặc repair.
  - Cả 16 sheet nguyên vẹn, bao gồm `G 151`, `G 152`, `G 190.1`, `G 190.2`.
  - Sheet `G 190.1` và `G 190.2` có đầy đủ số liệu đối ứng, không còn ô nào bị `#DIV/0!`.
- Chạy toàn bộ `npm run typecheck` và `npm test`.
