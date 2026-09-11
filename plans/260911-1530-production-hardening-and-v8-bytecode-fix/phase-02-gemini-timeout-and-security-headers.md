# Phase 2: Gia Cố An Ninh & Timeout Kết Nối Gemini AI (MED-01 & MED-02)

## 1. Mục Tiêu
Bảo vệ trải nghiệm người dùng không bao giờ bị đơ (infinite loading state) khi mạng internet gián đoạn, đồng thời loại bỏ nguy cơ lộ Google Gemini API Key trên đường truyền hoặc trong log mạng nội bộ.

## 2. Phân Tích Kỹ Thuật
- Hiện tại trong `src/main/services/GeminiService.ts`:
  1. Hàm `testGeminiConnection` và `generateGeminiAuditReview` dùng `fetch()` không có tham số `signal`. Khi máy chủ Google Generative AI phản hồi chậm hoặc rớt gói tin TCP, request sẽ chờ không giới hạn.
  2. URL endpoint sử dụng: `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${cleanKey}`.
  3. Theo khuyến nghị chuẩn của Google Cloud và REST Security, API key nên được gửi qua header `x-goog-api-key: <API_KEY>`. Điều này giữ cho URL sạch (`https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent`), tránh việc key bị lưu vào browser history, proxy log, CDN log hoặc log lỗi hệ thống.

## 3. Các Bước Thực Hiện
1. **Cập nhật `testGeminiConnection`**:
   - URL: `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent` (không kèm `?key=`).
   - Headers:
     ```typescript
     headers: {
       'Content-Type': 'application/json',
       'x-goog-api-key': cleanKey,
     }
     ```
   - Thêm timeout: `signal: AbortSignal.timeout(15000)` (15 giây cho lệnh ping kiểm tra kết nối).
   - Xử lý lỗi Timeout riêng: `"Hết thời gian chờ phản hồi (Timeout). Vui lòng kiểm tra lại kết nối mạng."`
2. **Cập nhật `generateGeminiAuditReview`**:
   - URL: loại bỏ `?key=`.
   - Headers: bổ sung `'x-goog-api-key': cleanKey`.
   - Thêm timeout: `signal: AbortSignal.timeout(60000)` (60 giây cho bài phân tích tài chính dài 2.500 tokens).
   - Bắt lỗi `TimeoutError` hoặc `name === 'AbortError'` để thông báo rõ ràng cho kiểm toán viên.
3. **Cập nhật Unit Tests**:
   - Kiểm tra `tests/gemini-service.test.ts` hoặc `tests/gemini-prompt.test.ts` để đảm bảo không bị ảnh hưởng.

## 4. Tiêu Chí Hoàn Thành (Acceptance Criteria)
- [ ] Không còn chuỗi `?key=` trong URL của `GeminiService.ts`.
- [ ] Header `x-goog-api-key` được đính kèm ở mọi request gọi lên Google API.
- [ ] Cả 2 hàm test kết nối và sinh nhận xét đều tự động hủy request sau thời gian timeout định trước.
- [ ] Toàn bộ unit tests liên quan đến Gemini pass 100%.
