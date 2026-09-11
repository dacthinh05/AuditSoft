---
phase: 1
title: "Xây dựng Gemini Service, Anonymizer, IPC Handlers và State Slice"
status: "pending"
files_modified:
  - "src/main/services/GeminiService.ts"
  - "src/shared/ipc.ts"
  - "src/preload/index.ts"
  - "src/main/index.ts"
  - "src/renderer/state/slices/aiSlice.ts"
  - "src/renderer/state/store.ts"
---

# Phase 1: Xây dựng Gemini Service, Anonymizer, IPC Handlers và State Slice

## Mục tiêu
Thiết lập toàn bộ hạ tầng gọi API Google Gemini 2.5 từ Electron Main process, cơ chế khử định danh số liệu an toàn, đăng ký kênh IPC và tạo Zustand slice để quản lý API key và trạng thái phân tích.

## Chi tiết các bước thực hiện:

1. **Xây dựng `src/main/services/GeminiService.ts`**:
   - URL endpoint: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`.
   - Model mặc định: `gemini-2.5-flash`. Hỗ trợ thêm `gemini-2.5-pro`.
   - Hàm `testConnection(apiKey: string, model: string)`: Gửi 1 prompt ngắn gọn để xác thực API key.
   - Hàm `generateAuditReview(params: AuditReviewParams)`:
     - Nhận các số liệu tổng hợp (EBITDA, Doanh thu/Giá vốn 12M, Tỷ lệ chi phí 641/642, Pareto, Lệch thuế).
     - Áp dụng bộ lọc khử định danh (Anonymizer): Xóa bỏ tên riêng, MST, địa chỉ khách hàng.
     - Ghép vào System Prompt đóng vai **"Chuyên gia Kiểm toán Độc lập Cấp cao (Senior Audit Partner)"**, yêu cầu nhận xét theo chuẩn mực VSA 520, chỉ rõ rủi ro, phân tích tính hợp lý và gợi ý thủ tục kiểm toán chuyên sâu.
     - Xử lý timeout, rate limit (HTTP 429), lỗi mạng.

2. **Cập nhật IPC Bridge (`src/shared/ipc.ts` & `src/preload/index.ts` & `src/main/index.ts`)**:
   - `IPC.geminiTestConnection`: Kiểm tra key.
   - `IPC.geminiAnalyze`: Tạo phân tích chuyên sâu.
   - Phơi bày qua `window.auditsoft.geminiTestConnection` và `window.auditsoft.geminiAnalyze`.

3. **Tạo State Slice `src/renderer/state/slices/aiSlice.ts`**:
   - Lưu trữ `apiKey` trong `localStorage` (key: `auditsoft_gemini_api_key`).
   - Lưu `selectedModel`: mặc định `'gemini-2.5-flash'`.
   - `isConfigModalOpen`: boolean.
   - `cachedReview`: chuỗi kết quả phân tích gần nhất kèm thời gian.
   - Tích hợp vào `src/renderer/state/store.ts`.
