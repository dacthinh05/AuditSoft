---
title: "Nâng Cấp Trợ Lý AI Gemini 2.5: Đọc Dữ Liệu Bảng Biểu Tabular Grounding Chuẩn VSA 520"
description: "Cấu trúc hóa toàn diện dữ liệu kế toán thành các bảng đối chiếu Markdown chuẩn (12M Matrix, YoY B02, Rủi ro thuế B4, Bên liên quan, Pareto) và thiết lập chỉ thị kiểm toán chống ảo giác số liệu cho Gemini 2.5."
status: completed
priority: P1
effort: 4h
branch: main
tags: [ai, gemini, analytics, vsa520, tabular-grounding, audit-advisor]
created: 2026-09-11
---

# Kế Hoạch Triển Khai: Nâng Cấp Trợ Lý AI Gemini 2.5 Đọc Dữ Liệu Tabular Grounding Chuẩn VSA 520

## 1. Bối cảnh & Vấn đề Cần Giải Quyết (Context & Problem)

Trong AuditSoft, tính năng **Trợ Lý Phân Tích Kiểm Toán AI Gemini 2.5** được thiết kế để tự động tạo bản nhận xét kiểm toán theo chuẩn mực **VSA 520 (Thủ tục phân tích)**. Tuy nhiên, qua khảo sát thực tế và phân tích mã nguồn (`GeminiService.ts` và `AiAuditAdvisorPanel.tsx`), việc đọc dữ liệu và chất lượng nhận xét của Gemini hiện gặp 3 hạn chế trọng yếu:

1. **Rơi rụng dữ liệu 12 tháng tại khâu tạo Prompt:**
   Dù giao diện đã trích xuất mảng 12 tháng Doanh thu, Giá vốn, Biên lãi gộp và CPSX thực tế, nhưng hàm `buildVsa520Prompt()` chỉ in ra 2 con số tổng năm `totalRevenue`, `totalCogs` kèm một dòng cảnh báo tháng lệch chuẩn. Gemini hoàn toàn không nhìn thấy số liệu của từng tháng nên nhận xét bị chung chung hoặc hallucinate con số.
2. **Bỏ quên toàn bộ kho dữ liệu kiểm toán đã tính sẵn:**
   Các engine nội bộ của AuditSoft đã tính toán rất chi tiết:
   - So sánh KQKD năm nay vs năm trước (`kqkdYoY` từ B02).
   - Rủi ro thuế chi tiền mặt $\ge 20$tr/5tr, phạt 811, ước tính loại trừ B4 và tăng thuế TNDN (`cashTaxRisk`).
   - Giao dịch bên liên quan chi tiết (cho vay/mượn 0%, tạm ứng tồn đọng) (`relatedParties`).
   - Tỷ trọng tập trung Top 5 khách hàng & nhà cung cấp (`pareto`).
   - Bóc tách chi phí theo yếu tố (`expenseByNature`).
   Toàn bộ kho dữ liệu này hiện tại bị bỏ qua 100%, không gửi cho Gemini.
3. **Hình thức dữ liệu thô và thiếu chỉ thị ràng buộc kiểm toán (Audit Grounding):**
   Dữ liệu hiện tại được nhồi dưới dạng bullet points rời rạc khiến LLM khó so sánh đối chiếu giữa các cột. Prompt cũng chưa có quy tắc chống ảo giác và cấu trúc đầu ra chưa gắn chặt với các Giấy làm việc thực tế (A710, G353, E300).

---

## 2. Mục Tiêu & Giải Pháp (Outcome & Architecture)

Triển khai **Phương án A (Tabular Grounding & Mở khóa Toàn bộ Dữ liệu Phân tích)**:
- **Cấu trúc hóa dữ liệu dạng Bảng Markdown:** Chuyển đổi toàn bộ số liệu 12 tháng, số liệu YoY B02, số liệu Thuế & Bên liên quan thành các bảng Markdown đối chiếu đa chiều, tận dụng năng lực suy luận bảng tính (tabular reasoning) cực mạnh của Gemini 2.5 Flash / Pro.
- **Audit Grounding & Anti-Hallucination Directives:** Buộc Gemini chỉ được nhận định dựa trên số liệu trong bảng, bắt buộc trích dẫn dẫn chứng số liệu cụ thể kèm thời điểm tháng/kỳ.
- **Phân tách nhận xét theo Giấy làm việc kiểm toán:**
  + Phần I: Đánh giá tổng quan hiệu quả kinh doanh & BCTC $\rightarrow$ Giấy làm việc **A710**.
  + Phần II: Phân tích ma trận giá vốn 12M & Rủi ro Cut-off / Phù hợp $\rightarrow$ Giấy làm việc **G353**.
  + Phần III: Phân tích chi phí OPEX & Rủi ro Thuế TNDN B4 $\rightarrow$ Giấy làm việc **E300 / B4**.
  + Phần IV: Kế hoạch thủ tục kiểm toán cơ bản đề xuất $\rightarrow$ Audit Action Plan.
- **Nâng cấp UI Renderer:** Hỗ trợ render bảng Markdown đẹp mắt trong thẻ nhận xét và bổ sung các nút sao chép 1-click theo từng phân đoạn giấy làm việc.

---

## 3. Ràng Buộc & Không Thuộc Phạm Vi (Constraints & Non-goals)

### Ràng Buộc (Constraints):
- **Bảo mật tuyệt đối (100% Anonymized):** Giữ nguyên quy tắc không gửi tên công ty, MST hoặc thông tin nhận dạng khách hàng lên Google API.
- **Mô hình BYOK:** Giữ nguyên kiến trúc client-side gọi trực tiếp Google API qua khóa người dùng, không qua server trung gian.
- **Token Budget & Latency:** Tối ưu hóa prompt trong khoảng 1.500 - 2.500 tokens để giữ tốc độ phản hồi của `gemini-2.5-flash` dưới 4 giây và nằm gọn trong gói miễn phí của Google AI Studio.
- **Xử lý An toàn (Zero-Crash Fallback):** Khi NKC không có đủ dữ liệu (ví dụ không có năm trước, không có chi tiền mặt), hệ thống tự động fallback về bảng rỗng hoặc ghi chú `N/A`, tuyệt đối không phát sinh `NaN`, `undefined`.

### Không Thuộc Phạm Vi (Non-goals):
- Không gửi raw data hàng vạn dòng NKC lên cloud.
- Không can thiệp sửa đổi số liệu sổ sách kế toán.

---

## 4. Tiêu Chí Nghiệm Thu (Acceptance Criteria)

1. `buildVsa520Prompt()` tạo ra đầy đủ 5 khối bảng Markdown đối chiếu đa chiều khi có đủ dữ liệu:
   - Bảng 1: KQKD So Sánh Kỳ Này vs Kỳ Trước (YoY).
   - Bảng 2: Ma Trận 12 Tháng (Doanh thu 511, Giá vốn 632, CPSX thực tế phát sinh, Biên gộp %, Tỷ lệ CPSX/DT).
   - Bảng 3: Chi Tiết Chi Phí Hoạt Động (OPEX 641/642).
   - Bảng 4: Cảnh Báo Rủi Ro Thuế & Ước Tính Loại Trừ B4.
   - Bảng 5: Giao Dịch Bên Liên Quan & Tập Trung Pareto.
2. Prompt không bao giờ chứa `NaN`, `undefined` hay giá trị rỗng lỗi.
3. Bản nhận xét do Gemini trả về trích dẫn chính xác các con số thực tế của từng tháng và từng chỉ tiêu.
4. Giao diện `AiAuditAdvisorPanel.tsx` hiển thị mượt mà cả bảng Markdown, có nút sao chép toàn bộ và nút sao chép riêng từng phần (A710, G353, E300).
5. 100% test suite Vitest (`tests/gemini-prompt.test.ts`, `tests/gemini-service.test.ts`) và typecheck đều đạt Pass.

---

## 5. Lộ Trình Triển Khai Chi Tiết (Phased Roadmap)

| Giai đoạn | Nội dung công việc | Tệp tin sửa đổi chính |
| :--- | :--- | :--- |
| **Phase 1** | Mở rộng Data Contract & Aggregated Payload Mapper | `src/main/services/GeminiService.ts`<br>`src/renderer/components/Analytics/AiAuditAdvisorPanel.tsx` |
| **Phase 2** | Thiết kế Prompt Engineering Bảng Biểu Tabular Grounding & Anti-Hallucination | `src/main/services/GeminiService.ts` |
| **Phase 3** | Nâng cấp UI Renderer: Hỗ trợ Bảng Markdown, Ô Ghi Chú Ngữ Cảnh & Copy Phân Đoạn | `src/renderer/components/Analytics/AiAuditAdvisorPanel.tsx`<br>`src/renderer/styles.css` |
| **Phase 4** | Kiểm thử Đơn vị, Viết Regression Tests & Nghiệm thu Toàn diện | `tests/gemini-prompt.test.ts`<br>`tests/gemini-service.test.ts` |
