---
title: "Phân Tích Giá Vốn Theo Bóc Tách Chi Phí Thực Tế Hàng Tháng & Redesign UI Trợ Lý Gemini AI"
description: "Bổ sung cơ chế phân tích biên chi phí giá vốn dựa trên phát sinh CPSX thực tế (621, 622, 627, 154, 156) hàng tháng thay vì phụ thuộc bút toán kết chuyển 632 cuối kỳ, đồng thời thiết kế lại toàn diện UI/UX Trợ lý Phân tích Kiểm toán Gemini 2.5."
status: completed
effort: 4h
branch: main
tags:
  - analytics
  - cogs
  - cpsx
  - gemini-ai
  - ui-redesign
  - vsa520
created: 2026-09-10
---

# Kế Hoạch Triển Khai: Bóc Tách Giá Vốn Theo Chi Phí Thực Tế Hàng Tháng & Redesign Trợ Lý Gemini AI

## 1. Bối cảnh & Vấn đề Cần Giải Quyết

### Vấn đề 1: Hiện tượng dồn kết chuyển Giá vốn cuối kỳ (TK 632)
Trong thực tế kế toán doanh nghiệp Việt Nam (đặc biệt là các đơn vị Sản xuất, Xây lắp, Dịch vụ):
- Kế toán thường xuyên tập hợp chi phí đầu vào hàng tháng (Nhân công 622, Chi phí sản xuất chung 627, Mua NVL 152/621, Dở dang 154) đều đặn qua các tháng 1 đến 11.
- Tuy nhiên, kế toán **không thực hiện tính giá thành và kết chuyển Nợ 632 hàng tháng** mà dồn toàn bộ 1 cục sang **Tháng 12** khi lập Báo cáo tài chính.
- **Hậu quả:** 
  + Từ Tháng 1 đến Tháng 11: Giá vốn 632 = 0, Biên gộp = 100%, tỷ lệ GV/DT = `-`.
  + Tháng 12: Giá vốn 632 vọt lên 75 tỷ (chiếm 100% cả năm), tỷ lệ GV/DT lên đến **1147.5%**, toàn bộ các tháng đều bị cờ "Treo CPSX (Chưa ghi 632)".
  + KTV không thể nhìn thấy được bức tranh hiệu quả chi phí thực tế phát sinh trong tháng so với doanh thu tạo ra.

### Vấn đề 2: Bất cập trải nghiệm trên UI Trợ lý Gemini AI
- Khi bấm phân tích (`isAnalyzing === true`), nút bấm đổi màu tím xoay spinner *"Gemini 2.5 đang phân tích..."*, nhưng bên dưới vẫn hiển thị nguyên khung nét đứt to đùng ghi *"Sẵn sàng phân tích..."* gây lệch pha trạng thái (State mismatch).
- Thiếu Skeleton loading animation trực quan, người dùng không nắm bắt được tiến trình AI đang đọc dữ liệu nào (EBITDA, 12M Trend, Ma trận chi phí, Rủi ro thuế).
- Payload gửi lên Gemini chưa truyền thông tin bóc tách chi phí phát sinh thực tế từng tháng và cờ cảnh báo dồn T12, khiến nhận định của AI chưa bắt trúng bản chất kế toán của DN.

---

## 2. Mục tiêu (Outcome)

1. **Chế độ phân tích kép trên Ma Trận Giá Vốn (Dual-Perspective Analysis):**
   - Hỗ trợ nút toggle lựa chọn giữa:
     * **`[Chi phí thực tế (CPSX)]`**: Tính tỷ lệ biên chi phí hàng tháng dựa trên Tổng chi phí sản xuất đầu vào thực tế (621 + 622 + 627 + 154) chia cho Doanh thu 511. Giúp KTV thấy rõ nhịp độ chi phí và biến động hoạt động của từng tháng 1 - 12.
     * **`[Sổ sách kết chuyển (TK 632)]`**: Giữ nguyên số Nợ 632 kế toán hạch toán để KTV dùng làm bằng chứng phát hiện rủi ro kiểm toán VSA 520 (Kế toán dồn chi phí cuối năm, vi phạm nguyên tắc phù hợp).
2. **Redesign Trợ Lý Gemini AI (VSA 520 Audit Advisor):**
   - Khi đang phân tích: Ẩn placeholder rỗng, thay thế bằng **Skeleton Shimmer Loading Card** mượt mà, hiển thị thanh tiến trình và các bước phân tích sinh động.
   - Bổ sung nút "Huỷ" nếu request kéo dài, hiển thị model tag và thông báo kết quả định dạng rõ ràng, chuyên nghiệp.
   - Bổ sung số liệu bóc tách chi phí thực tế vào prompt gửi cho Gemini để AI đưa ra nhận định chuyên sâu về tính đúng kỳ (Cutoff) và nguyên tắc phù hợp (Matching concept).

---

## 3. Ràng buộc & Không thuộc phạm vi (Constraints & Non-goals)

- **Constraints:**
  - Không làm thay đổi số liệu Nợ/Có gốc trong sổ Nhật ký chung.
  - Số liệu hiển thị ở chế độ CPSX phải tính toán chính xác từ các tài khoản đầu 6 (621, 622, 627) hoặc 154/156 đã bóc tách.
  - Sử dụng chuẩn `Money` type, không gây sai số làm tròn.
- **Non-goals:**
  - Không tự động sửa bút toán kết chuyển trong file Excel của khách hàng.
  - Không ép buộc một tỷ lệ giá thành chuẩn định mức giả lập nếu doanh nghiệp không có định mức.

---

## 4. Tiêu chí nghiệm thu (Acceptance Criteria)

1. **Ma trận Giá vốn:**
   - Khi chọn **Chi phí thực tế (CPSX)**: Các tháng 01 - 11 hiển thị tỷ lệ % CPSX / Doanh thu tương ứng (ví dụ Tháng 01: 25.5%, Tháng 02: 21.5%...), không còn bị gạch `-`.
   - Khi chọn **Sổ sách kết chuyển (TK 632)**: Giữ nguyên số Nợ 632 và các cờ cảnh báo "🔴 Dồn giá vốn T12" hoặc "🟠 Treo CPSX" chuẩn mực VSA 520.
   - Giao diện có tooltip hướng dẫn chi tiết cho KTV khi rê chuột vào tỷ lệ % của từng chế độ.
2. **UI Trợ lý Gemini:**
   - Trạng thái phân tích không còn bị lộ placeholder "Sẵn sàng phân tích".
   - Hiển thị Skeleton shimmer animation với 3 giai đoạn: Đọc EBITDA -> Phân tích Ma trận Giá vốn -> Sinh nhận xét VSA 520.
   - Nút phân tích có trạng thái loading, disabled đúng cách, hỗ trợ copy 1-click có hiệu ứng visual tick xanh.
3. **Chất lượng mã nguồn:**
   - Tất cả unit test trong `tests/` pass 100%.
   - Không có lỗi TypeScript, lint hay build regression.

---

## 5. Lộ Trình Phân Kỳ (Phases)

| Phase | Nội dung chính | Files tác động |
| :--- | :--- | :--- |
| **Phase 1** | Mở rộng Domain Engine & Cấu trúc Dữ liệu | `src/domain/analytics/FinancialCorrelationEngine.ts`<br>`src/domain/analytics/types.ts`<br>`src/main/services/geminiService.ts` |
| **Phase 2** | Nâng cấp UI Ma Trận Giá Vốn (Dual-Perspective Toggle) | `src/renderer/components/Analytics/CogsMatrix12MTable.tsx`<br>`src/renderer/styles.css` |
| **Phase 3** | Redesign toàn diện UI Trợ Lý Gemini AI & Skeleton State | `src/renderer/components/Analytics/AiAuditAdvisorPanel.tsx`<br>`src/renderer/styles.css` |
| **Phase 4** | Kiểm thử, Viết Regression Tests & Nghiệm thu | `tests/cogs-12m-matrix.test.ts`<br>`tests/gemini-prompt.test.ts` |
