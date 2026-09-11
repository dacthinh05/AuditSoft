---
phase: 4
title: "Kiểm Thử Tự Động Hóa, Xác Minh Toàn Diện & Đóng Gói"
status: "pending"
files_modified:
  - "tests/gemini-service.test.ts"
  - "tests/ai-audit-advisor.test.ts"
---

# Phase 4: Kiểm Thử Tự Động Hóa, Xác Minh Toàn Diện & Đóng Gói

## Mục tiêu
Viết test suite kiểm thử đơn vị và tích hợp cho toàn bộ luồng xử lý của Gemini Service, bộ lọc khử định danh (Anonymizer), state slice và đảm bảo hệ thống vượt qua 100% các tiêu chuẩn kiểm tra chất lượng.

## Chi tiết các bước thực hiện:

1. **Xây dựng Test Suite `tests/gemini-service.test.ts`**:
   - Kiểm tra bộ lọc khử định danh Anonymizer: Ẩn đúng tên công ty, mã số thuế, địa chỉ mà vẫn giữ nguyên số liệu tài chính.
   - Kiểm tra cấu trúc JSON Request gửi lên Google Gemini REST endpoint.
   - Kiểm tra xử lý lỗi mạng, thiếu API key, mã HTTP 400/401/429.
   - Kiểm tra logic format phản hồi thành các mục nhận xét chuẩn VSA 520.

2. **Xây dựng Test Suite `tests/ai-audit-advisor.test.ts`**:
   - Kiểm tra quản lý state `aiSlice`: lưu và nạp API key từ storage.
   - Kiểm tra model mặc định là `gemini-2.5-flash`.
   - Kiểm tra render component và các tương tác mở modal cấu hình.

3. **Chạy toàn bộ chu trình kiểm tra chất lượng**:
   - `npm run typecheck`: 0 lỗi trên toàn bộ TypeScript configurations.
   - `npm run lint`: 0 lỗi ESLint.
   - `npm run test`: Toàn bộ các test suite Vitest pass 100%.
   - `npm run build`: Build production hoàn tất thành công.
