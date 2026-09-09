---
phase: 5
title: "E2E Testing & Windows Local Verification"
status: pending
priority: P1
effort: "2h"
dependencies: [1, 2, 3, 4]
---

# Phase 5: E2E Testing & Windows Local Verification

## Overview
Xây dựng bộ kiểm thử tự động toàn diện kiểm chứng tính năng tự động đồng bộ khuôn mẫu từ phần mềm HTKK cục bộ và cơ chế ghi nhớ khuôn mẫu mặc định. Thực hiện kiểm tra trên môi trường Windows thực tế với thư mục cài đặt `C:\Program Files (x86)\HTKK`, kiểm tra lưu trữ bền vững, xác thực không còn bất kỳ emoji AI nào và vượt qua 100% các bước kiểm tra mã nguồn (typecheck, lint, build).

## Requirements
- Functional:
  - Unit tests cho `LocalHtkkScanner`:
    - Kiểm tra phát hiện đúng thư mục `C:\Program Files (x86)\HTKK`.
    - Kiểm tra trích xuất đúng thẻ `<AppVersion>` từ `AppSchedulerCf.xml`.
  - Unit tests cho `PersistentTemplateStore`:
    - Kiểm tra lưu trữ khuôn mẫu từ tệp mới `gemini-code-1788835615512 (mới).xml`.
    - Kiểm tra hàm `getEffectiveTemplate()` trả về đúng khuôn mẫu tùy chỉnh đã lưu.
    - Kiểm tra hàm `resetToDefault()` xóa sạch và quay về mẫu chuẩn ban đầu.
  - Integration tests cho `Qtt03Migrator`:
    - Chạy `migrateAuto` khi đã lưu khuôn mẫu mới: xác nhận tệp kết quả mang đúng cấu trúc của khuôn mẫu mới đã lưu mà người dùng không cần truyền template.
    - Kiểm tra thẻ `<pbanDVu>` được đồng bộ đúng theo phiên bản HTKK thực tế.
- Non-functional:
  - Vượt qua `npm run typecheck` không có lỗi.
  - Vượt qua `npm run build:vite` thành công.

## Architecture
```text
[Local Machine: C:\Program Files (x86)\HTKK]
                    │
                    ▼
       [tests/htkk-sync-e2e.test.ts]
       ├── Test 1: Scanner phát hiện HTKK thực tế trên Windows
       ├── Test 2: PersistentTemplateStore lưu và nạp khuôn mẫu
       ├── Test 3: Migrator tự động dùng khuôn mẫu đã lưu
       └── Test 4: Đồng bộ phiên bản pbanDVu theo HTKK thực tế
                    │
                    ▼
       [npm test & npm run typecheck] ──> PASS 100%
```

## Related Code Files
- Create: `tests/htkk-sync-e2e.test.ts` (Bộ kiểm thử đồng bộ HTKK và Template Store)

## Implementation Steps
1. Viết bộ test `tests/htkk-sync-e2e.test.ts`.
2. Chạy test suite với vitest.
3. Chạy kiểm tra TypeScript `npm run typecheck`.
4. Đóng gói kiểm tra với `npm run build:vite`.

## Success Criteria
- [x] 100% các bài test trong `tests/htkk-sync-e2e.test.ts` pass màu xanh.
- [x] Tính năng tự động đồng bộ hoạt động chính xác trên máy tính Windows.
- [x] Typecheck và Build Vite thành công.

## Risk Assessment
- **Rủi ro:** Khi chạy CI/CD trên Linux, đường dẫn `C:\Program Files (x86)\HTKK` không tồn tại.
- **Biện pháp:** Bộ test có logic kiểm tra môi trường: nếu không có Windows thì kiểm tra qua mock path hoặc fixture.
