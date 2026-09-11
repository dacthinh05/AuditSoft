# Phase 03: Thực Thi Tích Hợp Vào 13 File GLV & Kiểm Tra Nghiệm Thu Toàn Diện

## 1. Mục Tiêu
Chạy script engine để nạp sheet `*99_ChamDiem` vào 13 file GLV trong thư mục `D:\Desktop\Project\5. AuditSoft\GLV MAU`, sau đó chạy kịch bản kiểm tra tự động xác minh tính toàn vẹn của từng file.

## 2. Các Bước Thực Hiện
1. **Thực thi script**:
   Chạy `python scripts/inject-vacpa-scoring-sheets.py`.
2. **Kiểm tra tự động bằng code Python**:
   - Kiểm tra cả 13 file đều đã có sheet `*99_ChamDiem`.
   - Kiểm tra công thức tính tổng điểm `=SUM(F13:F...)` có hợp lệ không.
   - Đảm bảo các sheet trước đó (`*110`, `*120`, `*141`, `*146`, `*191`, `*195`, `*196`, `*198`...) còn nguyên vẹn 100%.
3. **Sẵn sàng liên kết sang file A - B - H**:
   Ghi lại tọa độ ô tổng điểm của từng file (ví dụ: `D100!D 199_ChamDiem!F18`) để phục vụ liên kết sang sheet `H 110` khi làm phần A-B-H.

## 3. Tiêu Chí Nghiệm Thu Hoàn Thành (Acceptance Criteria)
- 13/13 file GLV có sheet `*99_ChamDiem` đặt ở cuối workbook.
- Điểm chuẩn và điểm tự chấm tính toán chính xác bằng công thức Excel.
- Toàn bộ các sheet khác và công thức liên kết trong workbook không bị suy chuyển.
