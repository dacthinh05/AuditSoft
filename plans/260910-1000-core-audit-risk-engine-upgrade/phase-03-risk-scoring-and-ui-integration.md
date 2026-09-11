# Phase 3: Risk Scoring & UI Integration (Phân Tầng Điểm Số Rủi Ro & Hiển Thị UI)

## 1. Mục Tiêu
Nâng cấp giao diện hiển thị danh sách rủi ro kiểm toán (`ResultsPage.tsx`), phân tầng trực quan theo chuẩn mực VSA, bổ sung nhãn rủi ro rõ ràng (CRITICAL, HIGH, MEDIUM) để kiểm toán viên nhận diện ngay các rủi ro trọng yếu cần đưa vào Kế hoạch kiểm toán.

## 2. Chi Tiết Nâng Cấp Giao Diện
1. **Phân Tầng Mức Độ Rủi Ro & Màu Sắc Chuẩn Hóa**:
   - `CRITICAL`: Nền đỏ nhạt `#fef2f2`, chữ đỏ đậm `#991b1b`, viền `#fecaca` (Gian lận, ghi âm doanh thu, cặp định khoản cấm).
   - `HIGH`: Nền cam nhạt `#fff7ed`, chữ cam đậm `#9a3412`, viền `#fed7aa` (Quỹ tiền mặt ảo, nợ vay, rủi ro B4).
   - `MEDIUM`: Nền vàng nhạt `#fffbeb`, chữ vàng hổ phách `#92400e`, viền `#fde68a` (Treo chi phí, biến động lớn).
   - `LOW / INFO`: Nền xanh nhạt `#f0f9ff`, chữ xanh `#0369a1` (Lưu ý thông thường).

2. **Gắn Nhãn Chuẩn Mực Kiểm Toán & Thuế (Standards Badges)**:
   - Thêm nhãn nguồn: `VSA 240 (Rủi ro gian lận)`, `VSA 330 (Thủ tục kiểm toán)`, `VSA 520 (Thủ tục phân tích)`, `Nghị định 132/2020`, `Luật Thuế GTGT 2024`.
   - Giúp KTV trích dẫn trực tiếp vào Giấy làm việc kiểm toán (Working Paper) và Báo cáo kiểm toán.

3. **Thanh Tóm Tắt Sức Khỏe Hồ Sơ (Audit Risk Header Summary)**:
   - Hiển thị tổng số rủi ro phát hiện, phân bổ: X Nghiêm trọng, Y Cao, Z Trung bình.
   - Bộ lọc nhanh theo mức độ rủi ro (click vào thẻ để lọc danh sách bên dưới).

## 3. Cấu Trúc File & Tích Hợp
- Cập nhật `src/renderer/pages/ResultsPage.tsx`.
- Cập nhật định dạng nhãn trong `src/main/risks/AuditRuleEngine.ts`.

## 4. Tiêu Chí Nghiệm Thu
- [x] Giao diện hiển thị sắc nét, phân tầng rõ ràng giữa rủi ro nghiêm trọng và cảnh báo thông thường.
- [x] KTV có thể lọc nhanh các rủi ro CRITICAL / HIGH chỉ với 1 click.
- [x] Không có lỗi typecheck hay rendering bug.
