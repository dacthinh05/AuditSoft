---
title: "Kế Hoạch Cải Thiện Toàn Diện Dự Án Đạt Chuẩn Production & Tối Ưu Hóa Hiệu Năng"
description: "Sửa triệt để 2 lỗi ESLint, dọn dẹp .gitignore và working tree, chia nhỏ bundle với React.lazy/Suspense và Rollup manualChunks (<450KB), cấu hình Bytenode V8 bytecode bảo vệ bản quyền offline, và kiểm định toàn diện bộ test suite 368 tests."
status: completed
priority: P1
effort: 1.5h
branch: main
tags:
  - production-readiness
  - eslint
  - code-splitting
  - bytenode
  - bundle-optimization
  - git-hygiene
created: 2026-09-11
---

# Kế Hoạch Cải Thiện Dự Án Đạt Chuẩn Production (AuditSoft v1.1.6)

## 1. Bối Cảnh & Mục Tiêu Nghiệm Thu
- **Bối cảnh:** Dự án AuditSoft đã đạt độ chín nghiệp vụ rất cao (368/368 unit tests pass, typecheck 0 lỗi, sinh 15 file GLV hoàn hảo). Tuy nhiên, để đạt chuẩn Production đưa vào cho KTV nội bộ sử dụng thực chiến và chuẩn bị sẵn sàng thương mại hóa, cần loại bỏ 4 rào cản kỹ thuật:
  1. ESLint còn 2 lỗi unused variable khiến CI/CD bị fail.
  2. Bundle Renderer phình to 1.62 MB (vượt ngưỡng cảnh báo 1.5 MB của Vite/Rollup).
  3. Mã nguồn chưa được bảo vệ V8 Bytecode (nguy cơ bị lộ thuật toán kiểm toán và bẻ khóa license).
  4. Working tree Git còn nhiều file rác và file tạm test.
- **Mục tiêu (Outcome):**
  - `npm run lint` đạt 0 errors, 0 warnings.
  - Chunk JS chính của Renderer giảm từ 1.62 MB xuống $\le 450\text{ KB}$.
  - Tích hợp Bytenode bảo vệ mã nguồn Main Process và License.
  - 100% test suite (368 tests) và typecheck pass.

---

## 2. Lộ Trình Triển Khai (Phases)

| Phase | Nhiệm vụ chính | Files tác động |
| :--- | :--- | :--- |
| **Phase 1** | Sửa 2 lỗi ESLint, dọn dẹp `.gitignore` và vệ sinh working tree Git | `src/renderer/components/Analytics/charts/CogsStructureStackedChart.tsx`<br>`src/renderer/pages/WorkingPaperPage.tsx`<br>`.gitignore` |
| **Phase 2** | Code-Splitting 8 phân hệ với `React.lazy` và cấu hình Vite `manualChunks` | `src/renderer/App.tsx`<br>`vite.config.ts` |
| **Phase 3** | Cấu hình Bytenode V8 Bytecode và loại trừ file nội bộ khỏi build | `package.json`<br>`esbuild` scripts |
| **Phase 4** | Kiểm định toàn diện: `typecheck`, `lint`, `test` và `build` | Toàn bộ dự án |

---

## 3. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
1. `npm run lint` $\rightarrow$ Exit code 0, 0 errors, 0 warnings.
2. `npm run typecheck` $\rightarrow$ 0 errors trên cả 3 tsconfigs.
3. `npm test` $\rightarrow$ 368/368 tests passed 100%.
4. `npm run build` $\rightarrow$ Thành công sạch sẽ, không còn cảnh báo vàng "Some chunks are larger than 1500 kB".
