---
phase: 4
title: "Kiểm Thử Đơn Vị, Viết Regression Tests & Nghiệm Thu Toàn Diện"
status: completed
priority: P1
effort: 1h
files_modified:
  - tests/gemini-prompt.test.ts
  - tests/gemini-service.test.ts
---

# Phase 4: Kiểm Thử Đơn Vị, Viết Regression Tests & Nghiệm Thu Toàn Diện

## 1. Mục Tiêu

Xây dựng test suite toàn diện cho hệ thống Prompt Tabular Grounding mới, đảm bảo 100% không phát sinh lỗi `NaN`, `undefined`, kiểm tra tính an toàn khử định danh (Anonymization) và nghiệm thu chất lượng toàn bộ dự án với các bài kiểm tra TypeScript, lint và build.

## 2. Chi Tiết Các Bước Thực Hiện

### 2.1. Cập nhật và Bổ sung Unit Tests tại `tests/gemini-prompt.test.ts`:
- **Test Case 1: Prompt chứa đầy đủ 5 bảng Markdown khi có đủ payload:**
  + Kiểm tra sự hiện diện của Bảng 1 (KQKD YoY), Bảng 2 (12M Doanh thu - Giá vốn - CPSX), Bảng 3 (OPEX), Bảng 4 (Rủi ro thuế & B4), Bảng 5 (Bên liên quan & Pareto).
  + Kiểm tra định dạng bảng `| Khoản Mục BCTC |`, `| Tháng | Doanh Thu 511 |`.
- **Test Case 2: Xử lý an toàn khi thiếu dữ liệu:**
  + Trường hợp không có năm trước (`kqkdYoY` là null/undefined) $\rightarrow$ Prompt vẫn tạo bảng với ghi chú hoặc chuyển sang trạng thái an toàn, không sinh `NaN`.
  + Trường hợp không phát sinh chi tiền mặt quá ngưỡng (`cashTaxRisk` rỗng) $\rightarrow$ Bảng thuế ghi rõ không phát sinh.
  + Trường hợp doanh nghiệp không có bên liên quan $\rightarrow$ Bảng bên liên quan hiển thị thông báo an toàn.
- **Test Case 3: Kiểm tra Anti-Hallucination & Audit Grounding Directives:**
  + Đảm bảo prompt chứa chỉ thị cấm bịa số liệu, bắt buộc trích dẫn số liệu từ các bảng và chia đủ 4 phần chuẩn mực (A710, G353, E300, Thủ tục kiểm toán).
- **Test Case 4: Khử định danh 100%:**
  + Kiểm tra tên công ty và tên các bên liên quan được mã hóa thành `DOANH_NGHIEP_KIEM_TOAN_A`, `BEN_LIEN_QUAN_01` mà không để lộ chuỗi gốc.

### 2.2. Kiểm tra `tests/gemini-service.test.ts`:
- Kiểm tra `testGeminiConnection` và `generateGeminiAuditReview` với payload mở rộng.
- Đảm bảo các test case cũ vẫn pass 100%.

### 2.3. Chạy Kiểm Tra Toàn Bộ Hệ Thống:
- `npx vitest run tests/gemini-prompt.test.ts tests/gemini-service.test.ts`
- `npm run typecheck`
- `npm run lint` (nếu có)
- `npm run test` (chạy toàn bộ test suite dự án)

## 3. Tiêu Chí Nghiệm Thu (Pass Criteria)
- 100% unit test của Gemini pass.
- Không có lỗi typecheck TypeScript.
- Toàn bộ test suite dự án pass, không có regression.
