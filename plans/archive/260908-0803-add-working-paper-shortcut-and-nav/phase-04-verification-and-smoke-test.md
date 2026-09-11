---
phase: 4
title: "Verification & Smoke Test: Toàn bộ build, typecheck và kiểm thử trải nghiệm"
status: completed
priority: P1
effort: "15m"
dependencies: [1, 2, 3]
---

# Phase 4: Verification & Smoke Test

## Overview
Xác minh toàn diện giải pháp bằng kiểm tra kiểu (`npm run typecheck`), chạy bộ kiểm thử tự động (`npm test` 153/153 pass), và kiểm tra luồng người dùng (chọn file Nguồn ①/②, bấm nút tạo Working Paper, quan sát dữ liệu chuyển sang WorkingPaperPage).

## Implementation Steps
1. Chạy `npm run typecheck` để đảm bảo 0 lỗi TypeScript ở cả 3 tsconfig: web, node, tests.
2. Chạy `npm test` để xác nhận không có bất kỳ regression nào trong 153 unit/integration tests hiện tại.
3. Kiểm tra các kịch bản trải nghiệm:
   - Kịch bản 1: Chưa nạp file nào → Nút "Tạo 12 Giấy làm việc" ở SetupPage bị disable hoặc hiển thị gợi ý nạp file.
   - Kịch bản 2: Chỉ nạp Nguồn ① (Trước ĐC) → Nút sáng lên, ghi rõ dùng file Nguồn ①. Bấm nút → chuyển sang trang Working Paper với file Nguồn ① đã điền sẵn.
   - Kịch bản 3: Chỉ nạp Nguồn ② (Sau ĐC) → Nút sáng lên, ghi rõ dùng file Nguồn ②. Bấm nút → chuyển sang trang Working Paper với file Nguồn ② đã điền sẵn.
   - Kịch bản 4: Nạp cả 2 nguồn → Nút ưu tiên dùng file Nguồn ② (Sau ĐC). Bấm nút → chuyển sang trang Working Paper với file Nguồn ② đã điền sẵn.
   - Kịch bản 5: Bấm trực tiếp tab "12 Giấy Làm Việc" trên header bất kỳ lúc nào để vào trang.

## Success Criteria
- [ ] `npm run typecheck` → 0 errors
- [ ] `npm test` → 153/153 passed
- [ ] Giao diện nhất quán, trực quan, không có lỗi render console
