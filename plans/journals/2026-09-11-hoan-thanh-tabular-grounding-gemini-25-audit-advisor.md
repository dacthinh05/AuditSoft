# Nhật Ký Kỹ Thuật: Hoàn Thành Nâng Cấp Trợ Lý AI Gemini 2.5 Đọc Dữ Liệu Tabular Grounding Chuẩn VSA 520

- **Ngày thực hiện:** 2026-09-11
- **Phân hệ:** Analytics & AI Audit Advisor (VSA 520)
- **Mã kế hoạch:** `plans/260911-1410-gemini-tabular-grounding-audit-advisor`
- **Trạng thái:** Hoàn thành 100%

---

## 1. Bối Cảnh & Vấn Đề Giải Quyết
Trước đây, trợ lý AI Gemini 2.5 gặp phải tình trạng nhận xét chung chung hoặc tự bịa số liệu (hallucination) do:
1. Rơi rụng dữ liệu: Mặc dù payload có mảng 12 tháng Doanh thu, Giá vốn, CPSX, nhưng prompt chỉ in 2 số tổng năm.
2. Bỏ quên kho dữ liệu phân tích đã tính sẵn của AuditSoft: So sánh KQKD YoY (B02), Rủi ro thuế chi tiền mặt (NĐ 181/TT 78), Phạt 811, Chỉ tiêu loại trừ B4, Giao dịch bên liên quan, Tỷ trọng tập trung Pareto.
3. Thiếu chỉ thị ràng buộc kiểm toán (Audit Grounding Directives) và UI chưa parse được Markdown Table.

## 2. Các Thay Đổi Kiến Trúc & Triển Khai
1. **Mở rộng Data Contract (`FinancialMetricsPayload`):**
   - Bổ sung `businessType`, `auditorContextNote`, `kqkdYoY`, `monthlyBreakdown`, `cashTaxRisk`, `relatedParties`, `pareto`.
   - Khử định danh an toàn 100% thông tin doanh nghiệp, khách hàng/nhà cung cấp và bên liên quan (`DOANH_NGHIEP_KIEM_TOAN_A`, `BEN_LIEN_QUAN_01`, `KHACH_HANG_LON_NHAT`).
2. **Tabular Grounding Prompt Engineering (`buildVsa520Prompt`):**
   - Cấu trúc 5 Bảng Markdown chuẩn đối chiếu đa chiều:
     + Bảng 1: KQKD So Sánh Niên Độ (YoY B02).
     + Bảng 2: Ma Trận 12 Tháng Doanh Thu 511, Giá Vốn 632, CPSX Thực Tế.
     + Bảng 3: Chi Phí Hoạt Động (OPEX 641/642).
     + Bảng 4: Cảnh Báo Rủi Ro Thuế TNDN & Điều Chỉnh Chỉ Tiêu B4.
     + Bảng 5: Giao Dịch Bên Liên Quan & Tập Trung Pareto.
   - Thiết lập chỉ thị Audit Grounding nghiêm ngặt: Bắt buộc trích dẫn số liệu cụ thể kèm thời điểm tháng/kỳ, cấm bịa đặt số liệu ngoài bảng.
   - Chuẩn hóa 4 phân đoạn đầu ra gắn với các Giấy làm việc kiểm toán: A710, G353, E300, Thủ tục kiểm toán chi tiết.
3. **Nâng Cấp UI Renderer & Action Buttons (`AiAuditAdvisorPanel.tsx` & `styles.css`):**
   - Bổ sung `renderMarkdownTable` chuyển đổi bảng Markdown thành HTML Table chuẩn đẹp mắt, responsive.
   - Thêm ô nhập ghi chú bối cảnh thực tế cuộc kiểm toán (tùy chọn).
   - Thêm cụm nút sao chép nhanh 1-click phân đoạn: *Sao chép toàn bộ*, *Copy A710*, *Copy G353*, *Copy E300*.

## 3. Kết Quả Kiểm Thử & Nghiệm Thu
- `tests/gemini-prompt.test.ts`: 4/4 tests pass (bao gồm kiểm thử 5 bảng Markdown, fallback an toàn và khử định danh).
- `tests/gemini-service.test.ts`: 7/7 tests pass.
- Toàn bộ test suite dự án: 85 test files (386 tests) pass 100%.
- TypeScript `npm run typecheck`: 0 lỗi.
