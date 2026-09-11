---
phase: 3
title: "Tích hợp Bảng Điều Khiển Trợ Lý AI tại Phân Hệ Phân Tích Sơ Bộ VSA 520"
status: "pending"
files_modified:
  - "src/renderer/components/Analytics/AiAuditAdvisorPanel.tsx"
  - "src/renderer/components/Analytics/GlAnalyticsTab.tsx"
  - "src/renderer/styles.css"
---

# Phase 3: Tích hợp Bảng Điều Khiển Trợ Lý AI tại Phân Hệ Phân Tích Sơ Bộ VSA 520

## Mục tiêu
Tạo bảng điều khiển `AiAuditAdvisorPanel.tsx` đặt ngay trong tab Phân tích Sổ cái & Chỉ số VSA 520, giúp KTV chỉ với 1 click có thể sinh ngay bản nhận xét phân tích tài chính chuyên sâu để dán vào Giấy làm việc kiểm toán.

## Chi tiết các bước thực hiện:

1. **Xây dựng `AiAuditAdvisorPanel.tsx`**:
   - Nhận dữ liệu `GlAnalyticsResult` (EBITDA, Trend 12M, Correlation Doanh thu/Giá vốn, Tỷ lệ chi phí 641/642, Pareto).
   - Nút hành động chính:
     - `✨ Tạo Nhận Xét Kiểm Toán VSA 520 (Gemini 2.5)`
     - Nếu chưa có API key: Hiển thị lời nhắc thân thiện kèm nút *"Cấu hình Gemini API"* để mở thẳng modal Setting.
     - Đang xử lý: Thanh tiến trình/loading động với thông điệp *"Gemini 2.5 đang phân tích biến động chỉ số tài chính..."*.
   - Khung hiển thị kết quả phân tích AI:
     - Bố cục theo 4 phần chuẩn mực kiểm toán:
       1. **Đánh giá tổng quan hiệu quả hoạt động & EBITDA**.
       2. **Các điểm biến động bất thường trọng yếu (Anomaly Analysis)**: Điểm mặt các tháng có biên gộp hoặc chi phí tăng vọt.
       3. **Đánh giá rủi ro tuân thủ Thuế & Cắt kỳ doanh thu (Cutoff)**.
       4. **Đề xuất thủ tục kiểm toán cơ bản cần bổ sung (Audit Recommendations)**.
   - Các nút tiện ích:
     - **"Sao chép nội dung"**: Copy toàn bộ văn bản nhận xét vào Clipboard để dán sang Excel/Word.
     - **"Phân tích lại"**: Sinh lại bản nhận xét mới nếu KTV muốn xem góc nhìn khác.

2. **Tích hợp vào `GlAnalyticsTab.tsx`**:
   - Đặt bảng AI Panel ở vị trí trực quan phía trên hoặc ngay sau bảng ma trận 12 tháng.
   - Thêm tab hoặc accordion gập mở linh hoạt để không chiếm dụng diện tích khi KTV chỉ muốn soi bảng số liệu.

3. **CSS Styling**:
   - Khung thẻ `.ai-advisor-card`: Viền màu tím ánh kim/xanh AI (`#8b5cf6`), bóng đổ mềm, định dạng typographic sắc nét dễ đọc.
