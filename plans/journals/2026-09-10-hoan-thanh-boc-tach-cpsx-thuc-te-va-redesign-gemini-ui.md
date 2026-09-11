# Nhật Ký Kỹ Thuật: Hoàn Thành Bóc Tách CPSX Thực Tế Hàng Tháng & Redesign UI Trợ Lý Gemini AI

- **Ngày thực hiện:** 2026-09-10
- **Phân hệ:** Analytics & AI Audit Advisor (VSA 520)
- **Trạng thái:** Hoàn thành xuất sắc, 100% tests & typecheck pass.

## 1. Vấn đề giải quyết
1. **Dồn kết chuyển Giá vốn cuối kỳ (TK 632):**
   - Các doanh nghiệp sản xuất / xây lắp / dịch vụ thường chỉ hạch toán chi phí đầu vào hàng tháng (621, 622, 627, 154) và dồn toàn bộ Nợ 632 vào Tháng 12.
   - Nếu chỉ phân tích theo TK 632, các tháng 1-11 bị gạch `-` và Tháng 12 tỷ lệ vọt lên >1000%, khiến phân tích tương quan bị méo mó.
   - **Giải pháp:** Bổ sung cơ chế phân tích kép (Dual-Perspective Analysis) trên Ma trận Giá vốn:
     * `[⚙️ Biên Chi Phí Thực Tế (CPSX)]`: Tính tỷ lệ % Tổng chi phí sản xuất phát sinh trong tháng / Doanh thu 511. Giúp KTV thấy rõ nhịp độ chi phí hoạt động thực tế từng tháng.
     * `[📒 Biên Sổ Sách (TK 632)]`: Giữ nguyên số kế toán kết chuyển Nợ 632 để làm bằng chứng kiểm toán phát hiện rủi ro Cutoff / dồn chi phí cuối năm VSA 520.
2. **Redesign UI Trợ lý Gemini AI:**
   - Khắc phục triệt để lỗi state mismatch khi đang phân tích (nút tím loading nhưng bên dưới vẫn hiện khung placeholder rỗng).
   - Thiết kế lại toàn diện 3 trạng thái:
     * **Idle:** Hero card sang trọng giới thiệu 4 nhóm chỉ số được quét kèm nút bấm nổi bật.
     * **Analyzing:** Skeleton shimmer loader với thanh tiến trình phát sáng, icon pulsing, và các bước phân tích sinh động.
     * **Completed:** Thẻ nhận xét kiểm toán chuyên nghiệp, hỗ trợ 1-click sao chép vào Clipboard để dán vào Giấy làm việc A710 / G353.
   - Nạp thông tin Ma trận Giá vốn và cảnh báo dồn chi phí cuối năm vào payload gửi lên Gemini 2.5 để AI đưa ra nhận xét sâu sắc về tính đúng kỳ và nguyên tắc phù hợp.

## 2. Kiểm thử & Nghiệm thu
- `tests/cogs-12m-matrix.test.ts`: 3 tests pass.
- `tests/gemini-prompt.test.ts`: 3 tests pass.
- `tests/gemini-service.test.ts`: 7 tests pass.
- `tests/financial-correlation-engine.test.ts`: 4 tests pass.
- `npm run typecheck`: 0 lỗi TypeScript trên cả 3 tsconfig.
