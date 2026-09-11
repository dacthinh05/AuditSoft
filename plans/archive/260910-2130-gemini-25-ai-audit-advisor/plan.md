---
title: "Tích hợp Trợ Lý Kiểm Toán AI Gemini 2.5 (BYOK) Phân Tích Chuyên Sâu Báo Cáo Tài Chính Chuẩn VSA 520"
date: "2026-09-10"
status: "completed"
mode: "standard"
tags:
  - ai
  - gemini
  - byok
  - analytics
  - vsa520
  - settings
---

# Kế Hoạch Triển Khai: Trợ Lý Kiểm Toán AI Gemini 2.5 Phân Tích Chuyên Sâu BCTC

## 1. Bối cảnh & Mục tiêu (Outcome)
Trong quy trình kiểm toán độc lập theo chuẩn mực **VSA 520 (Thủ tục phân tích)**, kiểm toán viên mất rất nhiều thời gian (2 - 4 tiếng) để tự viết các đoạn văn nhận xét, giải trình biến động bất thường, đánh giá tỷ số tài chính và đề xuất thủ tục kiểm toán chi tiết vào Giấy làm việc (A710, G353, G453...).

Mục tiêu của kế hoạch này là:
1. Tích hợp **Google Gemini 2.5** (mặc định model `gemini-2.5-flash`, tùy chọn `gemini-2.5-pro`) vào AuditSoft theo mô hình **BYOK (Bring Your Own Key)**.
2. Thiết lập nút cấu hình **"✨ AI Gemini"** ngay cạnh nút Cập nhật phần mềm trên thanh Topbar, kèm popup hướng dẫn chi tiết người dùng lấy API key miễn phí từ Google AI Studio trong 1 phút.
3. Tích hợp bảng điều khiển **"Trợ Lý Phân Tích Kiểm Toán AI (VSA 520)"** tại phân hệ Phân Tích Sơ Bộ: Tự động trích xuất các chỉ số tài chính đã tính sẵn (EBITDA, Biên gộp 12M, Tỷ lệ chi phí 641/642, Pareto, Lệch thuế) $\rightarrow$ Khử định danh (Anonymize) $\rightarrow$ Gửi lên Gemini 2.5 $\rightarrow$ Trả về bản thảo nhận xét kiểm toán chuyên sâu chuẩn mực chỉ trong 3 giây.
4. Cho phép KTV sao chép 1-click hoặc dán thẳng vào Hồ sơ kiểm toán.

---

## 2. Ràng buộc & Giới hạn (Constraints & Non-goals)

### Constraints:
- **Bảo mật tuyệt đối**: Tuyệt đối KHÔNG gửi dữ liệu sổ sách thô (raw NKC). Chỉ gửi các số liệu chỉ số tổng hợp (Aggregated Indicators) đã được khử định danh (ẩn tên DN, MST thành `[DOANH_NGHIEP]`).
- **Mặc định model Gemini 2.5**: Sử dụng `gemini-2.5-flash` làm mặc định (bản mới nhất của Google, hỗ trợ suy luận sắc bén và tốc độ xử lý tức thì).
- **Mô hình BYOK**: API key được lưu an toàn tại máy cá nhân (`localStorage`), gọi trực tiếp từ Node/Electron sang Google API, không qua bất kỳ máy chủ trung gian nào. Tác giả không tốn chi phí vận hành server AI.
- **Opt-in 100%**: Người dùng không có key vẫn sử dụng toàn bộ tính năng phần mềm Offline bình thường.

### Non-goals:
- Không lưu trữ dữ liệu phân tích của khách hàng lên cloud.
- Không tự động thay đổi số liệu kế toán — AI chỉ đóng vai trò phân tích, nhận xét và khuyến nghị thủ tục kiểm toán.

---

## 3. Tiêu chí nghiệm thu (Acceptance Criteria)
1. **Nút Topbar**: Nút `✨ AI Gemini` hiển thị trang trọng cạnh nút Cập nhật trên Topbar. Có dot xanh nhận diện khi đã lưu API key.
2. **Modal Cấu hình Setting**:
   - Ô nhập API key có nút ẩn/hiện và nút xóa key.
   - Bộ chọn Model: Mặc định `gemini-2.5-flash`, tùy chọn `gemini-2.5-pro`.
   - Nút "Kiểm tra kết nối" (Ping thử Gemini API và báo trạng thái tức thì).
   - Hướng dẫn trực quan 3 bước lấy API key miễn phí kèm link mở thẳng `https://aistudio.google.com/app/apikey`.
3. **Bảng Phân Tích AI tại Phân Hệ VSA 520**:
   - Nút "Tạo Nhận Xét Kiểm Toán VSA 520 (Gemini 2.5)".
   - Tự động cảnh báo nếu chưa cấu hình key và hỗ trợ mở nhanh modal Setting.
   - Kết quả phản hồi hiển thị định dạng chuyên nghiệp:
     1. Đánh giá tổng quan hiệu quả kinh doanh & EBITDA.
     2. Cảnh báo các tháng biến động bất thường trọng yếu (Biên lãi gộp, OPEX).
     3. Đánh giá rủi ro đối chiếu doanh thu & thuế GTGT/TNCN.
     4. Gợi ý các thủ tục kiểm toán cơ bản cần thực hiện thêm (VSA 500/520).
   - Nút "Sao chép nhận xét" (Copy to Clipboard).
4. **Độ ổn định hệ thống**: Toàn bộ test suite Vitest, typecheck, lint và build production đều đạt 100% Pass.

---

## 4. Các giai đoạn thực hiện (Phased Execution)

* **Phase 1: Xây dựng Gemini Service & IPC Handlers (Tầng Main & Preload)**
  - Tạo service `src/main/services/GeminiService.ts` phụ trách gọi REST API `generativelanguage.googleapis.com` (generateContent, testConnection).
  - Tích hợp hàm khử định danh (Anonymizer).
  - Đăng ký IPC handlers trong `src/main/index.ts` và preload bridge trong `src/preload/index.ts`.
  - Tạo state slice `src/renderer/state/slices/aiSlice.ts`.

* **Phase 2: Xây dựng AI Settings Modal & Nút Cấu Hình Topbar (Tầng Header)**
  - Tạo component `src/renderer/components/Settings/AiConfigModal.tsx`.
  - Bổ sung nút cấu hình AI kế nút cập nhật tại `src/renderer/App.tsx`.
  - Viết hướng dẫn lấy API key từ Google AI Studio kèm link mở trình duyệt ngoài.

* **Phase 3: Tích hợp Bảng Nhận Xét AI tại Phân Hệ Phân Tích Sơ Bộ (VSA 520)**
  - Tạo component `src/renderer/components/Analytics/AiAuditAdvisorPanel.tsx`.
  - Nhúng vào `src/renderer/components/Analytics/PreliminaryAnalyticsPage.tsx` hoặc tab `GlAnalyticsTab.tsx`.
  - Xây dựng prompt chuẩn mực kế toán - kiểm toán Việt Nam (VAS / TT200 / VSA 520).

* **Phase 4: Kiểm thử, Tự động hóa & Hoàn tất (Verification & Tests)**
  - Viết unit test cho GeminiService, Anonymizer và AI State Slice.
  - Chạy `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.
