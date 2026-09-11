# Kế Hoạch Chuẩn Hóa Kết Luận Kiểm Toán, Ký Hiệu Tickmarks & Định Dạng Màu Sắc Đạt Điểm Cao Hồ Sơ Mẫu VACPA

## 1. Bối cảnh & Mục tiêu (Outcome)
- Giúp 15 file Giấy làm việc (GLV) kiểm toán của hệ thống AuditSoft đạt điểm tối đa khi kiểm tra soát xét chất lượng kiểm toán theo chuẩn mực của Bộ Tài chính và VACPA.
- **Trọng tâm chuẩn hóa:**
  1. **Khối KẾT LUẬN KIỂM TOÁN (Audit Conclusion):** Tự động điền câu cú kết luận 3 phần chặt chẽ (Thủ tục thực hiện $\rightarrow$ Kết quả phát hiện $\rightarrow$ Khẳng định trung thực & hợp lý trên BCTC) tại chân các bảng Lead Schedule (`*10`) và bảng kiểm tra chi tiết/chọn mẫu (`*91`, `*95`).
  2. **Khối CHÚ GIẢI KÝ HIỆU KIỂM TOÁN (Tickmarks Legend):** Chèn bảng chú giải chuẩn VACPA (`^` - Footing, `✓` - Vouching, `GL` - Sổ cái, `TB` - Bảng CĐSPS) ở chân các bảng kiểm tra mẫu.
  3. **Định dạng màu sắc & Quy ước trực quan (Visual Conventions):**
     - Header cột chính: Nền xanh navy/xanh đậm (`#1F4E79`), chữ trắng in đậm.
     - Vùng kết luận kiểm toán: Nền xanh lá nhạt (`#E2EFDA`), viền xanh rêu thanh lịch.
     - Dòng tổng cộng: Gạch chân đôi (double underline) theo chuẩn kế toán - kiểm toán.
     - Cột AJE điều chỉnh: Nền vàng nhạt (`#FFF2CC`) làm nổi bật các bút toán phát hiện.
  4. **Tự động điền ngày ký & tên KTV (`Prepared by` / `Date`)** đồng bộ trên tất cả các sheet.

## 2. Danh Sách Các Phases

### Phase 01: Xây Dựng Engine Kết Luận Chuẩn VACPA & Khối Tickmarks Đa Dạng
- File: `src/domain/workingpaper/conclusionEngine.ts`
- Xây dựng từ điển mẫu câu kết luận chuẩn theo từng loại giấy làm việc:
  - Lead Schedule tổng hợp (`*10`): Khẳng định trung thực, hợp lý của số dư khoản mục trên BCTC.
  - Bảng kiểm tra chi tiết & chọn mẫu VSA 530 (`*91`, `*95`): Khẳng định tính đầy đủ hóa đơn, chứng từ hợp lệ, không có gian lận/sai sót vượt mức CTT.
  - Bảng Cut-off khóa sổ 31/12 (`*95TGNH`, `*96`): Khẳng định tính đúng kỳ kế toán, không ghi nhận khống/dịch chuyển niên độ.
- Hàm hỗ trợ chèn Tickmarks Legend và Audit Conclusion Box bằng OpenXML hoặc ExcelJS.

### Phase 02: Tích Hợp Vào Các File GLV Trọng Tâm (Fillers D100, D300, D500, E100, E200, G100)
- Tích hợp gọi `insertAuditConclusion` và `insertTickmarksLegend` vào chân các sheet thực hiện kiểm toán trong:
  - `D100_CashFiller.ts` (Tiền mặt, TGNH, Cutoff 31/12).
  - `D300_ReceivableFiller.ts` (Phải thu khách hàng, Thư xác nhận, Tuổi nợ).
  - `D500_InventoryFiller.ts` (Hàng tồn kho, Kiểm kê, Cutoff nhập xuất).
  - `E100_BorrowingFiller.ts`, `E200_PayableFiller.ts` (Vay và Phải trả người bán).
  - `G100_RevenueFiller.ts`, `G200_ExpenseFiller.ts` (Doanh thu & Chi phí 641/642).

### Phase 03: Chuẩn Hóa Định Dạng Màu Sắc & Đường Kẻ Kế Toán (Visual Styling)
- Cập nhật các hàm style trong `src/domain/workingpaper/helpers.ts` và `adaptEditor.ts`:
  - Thêm style cho Conclusion Box (fill màu `#E2EFDA`, font chữ `Cambria` 10pt in nghiêng).
  - Thêm style cho dòng tổng cộng (border bottom double).
  - Đảm bảo tên KTV (`ctx.engagement.auditorName`) và ngày kiểm toán được điền tự động vào ô `Prepared by / Date` ở góc trên bên phải các sheet.

### Phase 04: Kiểm Thử Tự Động & Đánh Giá Điểm Hồ Sơ (Verification)
- Viết unit test trong `tests/unit/auditConclusions.test.ts` kiểm tra câu cú kết luận và tickmarks được chèn đúng tọa độ, không đè dữ liệu.
- Chạy `npm run typecheck` và toàn bộ test suite `npm test`.
- Xác nhận các file Excel sinh ra mở trơn tru, không lỗi OpenXML.
