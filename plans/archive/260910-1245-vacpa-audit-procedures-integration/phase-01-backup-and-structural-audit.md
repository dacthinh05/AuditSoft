# Phase 01: Sao Lưu Bảo Vệ & Khảo Sát Chi Tiết Cấu Trúc 13 File GLV

## 1. Mục Tiêu
Bảo vệ an toàn tuyệt đối toàn bộ file Excel mẫu trước khi chỉnh sửa bằng cách tạo bản sao lưu độc lập, đồng thời quét chính xác vị trí dòng trống và cấu trúc sheet `*20` của từng file.

## 2. Các Bước Thực Hiện
1. **Tạo thư mục sao lưu**:
   Sao chép toàn bộ thư mục `D:\Desktop\Project\5. AuditSoft\GLV MAU` sang:
   `D:\Desktop\Project\5. AuditSoft\GLV MAU_BACKUP_20260910`
2. **Khảo sát dòng bắt đầu của bảng Thuyết minh hiện hữu trên từng sheet `*20`**:
   - D100 (`D 120`): Bảng bắt đầu từ dòng mấy?
   - D200 (`D220`): Bảng bắt đầu từ dòng mấy?
   - D300 (`D 320`): Bảng bắt đầu từ dòng mấy?
   - D500 (`D520`): Bảng bắt đầu từ dòng mấy?
   - D600 (`D620`): Bảng bắt đầu từ dòng mấy?
   - D700 (`D720`): Bảng bắt đầu từ dòng mấy?
   - E100 (`E 120`), E200 (`E220`), E300 (`E 320`), E400 (`E 420`), F100 (`F120`), G100 (`G120`), G200 (`G220`).
3. **Xác định vị trí chèn bảng Thủ Tục Kiểm Toán**:
   - Bảng thủ tục kiểm toán sẽ được đặt tại dòng 7 (sau phần tiêu đề công ty kiểm toán và thông tin khách hàng).
   - Phần nội dung thuyết minh BCTC hiện hữu sẽ được dịch chuyển xuống dưới bảng thủ tục (khoảng dòng 25-30) mà không làm thay đổi nội dung hay công thức của nó.

## 3. Tiêu Chí Nghiệm Thu
- Bản sao lưu `GLV MAU_BACKUP_20260910` đầy đủ 100% file gốc.
- Bảng khảo sát tọa độ dòng của 13 file được ghi nhận chi tiết để nạp vào script Phase 2.
