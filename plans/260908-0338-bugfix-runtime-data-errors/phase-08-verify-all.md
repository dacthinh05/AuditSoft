---
phase: 8
title: "Verify: Toàn bộ test + typecheck sau khi fix"
status: completed
priority: P1
effort: "10m"
dependencies: [2, 3, 4, 5, 6, 7]
---

# Phase 8: Verify — toàn bộ test + typecheck

## Overview
Chạy toàn bộ test suite và typecheck sau khi tất cả bugs đã được fix. Đảm bảo không có regression.

## Implementation Steps
1. `npm run typecheck` — phải clean
2. `npm test` — phải 153/153 pass (hoặc nhiều hơn nếu test mới được thêm)
3. Smoke check thủ công: mở app, load file NKC mẫu, chạy đối chiếu, kiểm tra kết quả

## Todo
- [ ] `npm run typecheck` → 0 errors
- [ ] `npm test` → tất cả pass, không regression
- [ ] Kiểm tra tab "Lỗi dữ liệu" hiển thị THIEU_TK_NO/CO nếu có
- [ ] Kiểm tra kết quả `balanced` trong tab đối chiếu NKC↔CĐSPS
- [ ] Kiểm tra console không còn worker terminate oan

## Success Criteria
- [ ] TypeScript clean
- [ ] Tất cả tests pass
- [ ] Không có bug mới được tạo ra
