# Phase 3: Redesign Toàn Diện UI Trợ Lý Gemini AI & Skeleton State

## 1. Mục Tiêu
- Giải quyết dứt điểm tình trạng State Mismatch ở Image #2 (khi đang phân tích thì nút hiển thị tím xoay spinner nhưng bên dưới vẫn trơ trọi khung placeholder nét đứt "Sẵn sàng phân tích...").
- Xây dựng trải nghiệm phân tích kiểm toán AI đẳng cấp, chuẩn mực:
  1. **Trạng thái Chưa phân tích (Idle State):**
     - Hero Card gọn gàng, trang nhã, màu sắc violet/purple tinh tế.
     - Nút "✨ Tạo Nhận Xét Kiểm Toán VSA 520 (Gemini 2.5)" nổi bật, có icon và tag model trực quan.
     - Giới thiệu 4 nhóm dữ liệu cốt lõi mà AI sẽ quét: EBITDA 132/2020, Xu hướng 12M, Ma trận Giá vốn Cutoff, và Bóc tách OPEX.
  2. **Trạng thái Đang phân tích (Analyzing / Loading State):**
     - Ẩn hoàn toàn placeholder rỗng.
     - Hiển thị **Skeleton Shimmer Loading Card** với thanh tiến trình phát sáng (Glowing Pulse Bar).
     - Hiển thị 3 chip động thể hiện các bước AI đang thẩm định:
       * 🔄 *Đang phân tích bộ chỉ số EBITDA & Khống chế lãi vay...*
       * 🔄 *Đang mổ xẻ Ma trận Giá vốn 12M & Rủi ro dồn chi phí cuối năm...*
       * 🔄 *Đang tổng hợp thủ tục phân tích VSA 520...*
  3. **Trạng thái Đã phân tích (Completed State):**
     - Card kết quả với Typography kiểm toán rõ ràng: Highlight các rủi ro trọng yếu, tô đậm số liệu và tài khoản.
     - Action Bar tiện ích:
       * Nút *"Sao chép nhận xét"* (kèm toast feedback khi bấm).
       * Nút *"Phân tích lại"*.
       * Gợi ý KTV dán thẳng vào Giấy làm việc A710 / G353.
  4. **Truyền số liệu Ma trận Giá vốn vào Gemini Payload:**
     - Tại `AiAuditAdvisorPanel.tsx`, trích xuất `cogs12mMatrix` đưa vào payload gửi lên `geminiAnalyze`.
     - Nhờ đó, Gemini sẽ tự động nhận diện hiện tượng: *"Doanh nghiệp dồn giá vốn 75 tỷ vào Tháng 12, trong khi các tháng 1-11 chi phí SX thực tế phát sinh từ 1-3 tỷ/tháng nhưng chưa kết chuyển 632, khuyến nghị KTV kiểm tra thủ tục Cutoff và tính đúng kỳ theo Chuẩn mực VSA 520."*

## 2. Các Tệp Tin Thay Đổi
- `src/renderer/components/Analytics/AiAuditAdvisorPanel.tsx`
- `src/renderer/styles.css`
- `src/main/services/geminiService.ts`

## 3. Tiêu Chí Hoàn Thành (Pass Criteria)
- UI mượt mà, không bao giờ xuất hiện đồng thời nút "Đang phân tích..." và khung "Sẵn sàng phân tích...".
- Skeleton loading hiển thị đẹp mắt, không giật layout.
- Prompt gửi lên Gemini chứa đầy đủ dữ liệu ma trận giá vốn và cảnh báo dồn cuối năm.
