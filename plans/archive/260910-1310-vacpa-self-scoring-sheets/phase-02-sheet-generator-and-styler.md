# Phase 02: Xây Dựng Script Engine Sinh Sheet Chấm Điểm (Sheet Generator & Styler)

## 1. Mục Tiêu
Viết script Python `scripts/inject-vacpa-scoring-sheets.py` sử dụng thư viện `openpyxl` để tạo mới sheet `*99_ChamDiem` trong 13 file GLV với giao diện trang tính chuyên nghiệp, phông chữ đồng bộ `Cambria`, viền mỏng đen và các công thức tính điểm tự động.

## 2. Quy Cách Trình Bày Sheet Chấm Điểm
- **Tên sheet**: Thêm hậu tố `_ChamDiem` theo mã phần hành (ví dụ: `D 199_ChamDiem`, `D 399_ChamDiem`...).
- **Khung Header (Dòng 1 - 7)**:
  - Tên đơn vị kiểm toán, Tên khách hàng, Niên độ, Người thực hiện, Người soát xét.
  - Tiêu đề bảng: `BẢNG TỰ CHẤM ĐIỂM & RÀ SOÁT CHẤT LƯỢNG HỒ SƠ KIỂM TOÁN (THEO CHUẨN VACPA)`.
- **Khung Tóm Tắt Điểm (Dòng 8 - 10)**:
  - Khung viền đôi nổi bật: Điểm chuẩn tối đa | Điểm tự chấm (Công thức `=SUM(...)`) | Tỷ lệ (%) | Xếp loại (`=IF(...)`).
- **Bảng Chi Tiết Tiêu Chí (Dòng 12 trở đi)**:
  - Cột A: TT (Căn giữa, rộng 6).
  - Cột B: Nội dung tiêu chí kiểm tra (Căn trái, wrap text, rộng 52).
  - Cột C: Chuẩn mực VSA viện dẫn (Căn giữa, rộng 14).
  - Cột D: Điểm chuẩn (Căn phải, định dạng `0.0`, rộng 11).
  - Cột E: Trạng thái thực hiện (`[ Đã làm ]`, căn giữa, rộng 14).
  - Cột F: Điểm KTV tự chấm (Căn phải, công thức hoặc số điểm, định dạng `0.0`, rộng 12).
  - Cột G: Tham chiếu bằng chứng GLV (In đậm, căn giữa, rộng 15).
  - Cột H: Ghi chú & Thủ tục bổ sung (Căn trái, wrap text, rộng 32).
- **Hàng Tổng Cộng Cuối Bảng**:
  - `TỔNG CỘNG ĐIỂM PHẦN HÀNH`: Cột D có công thức `=SUM(D13:D...)`, Cột F có công thức `=SUM(F13:F...)`.
- **Phần Ký Tên (Cuối Sheet)**:
  - KTV Thực hiện ký tên | Trưởng nhóm kiểm toán soát xét ký tên.

## 3. Tiêu Chí Nghiệm Thu
Script sinh ra sheet mới mà không chạm vào hoặc làm thay đổi bất kỳ sheet hiện có nào trong workbook.
