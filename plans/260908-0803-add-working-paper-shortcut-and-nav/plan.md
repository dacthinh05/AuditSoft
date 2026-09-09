---
title: "Kế hoạch: Thêm nút Tạo 12 Giấy làm việc kiểm toán tại SetupPage và mở Tab điều hướng"
description: "Thêm nút shortcut Lập 12 Giấy làm việc (GLV) ngay dưới nút Đối chiếu tại SetupPage (chỉ cần Nguồn 1 hoặc 2) và mở tab WorkingPaperPage trên Header App."
status: completed
priority: P1
effort: "1h15m"
tags: [feature, ui-ux, working-paper, workflow]
created: 2026-09-08
---

# Kế hoạch: Thêm Shortcut Tạo 12 Giấy làm việc & Mở Tab Navigation

## Overview
AuditSoft NKC đã có module backend và frontend `WorkingPaperPage.tsx` (tự động điền 12 Giấy làm việc D100 -> G200 theo mẫu chuẩn kiểm toán), nhưng hiện chưa có đường dẫn trực tiếp trên giao diện để người dùng truy cập.
Kế hoạch này triển khai giải pháp Hướng A theo yêu cầu:
1. Đặt nút **"TẠO 12 GIẤY LÀM VIỆC KIỂM TOÁN (GLV)"** ngay trong thanh Dock dưới nút "BẮT ĐẦU ĐỐI CHIẾU DỮ LIỆU" ở `SetupPage.tsx`.
2. Cho phép người dùng bấm tạo Working Paper ngay cả khi **chỉ nạp 1 trong 2 file** (Trước ĐC hoặc Sau ĐC) hoặc cả hai (ưu tiên Sau ĐC).
3. Bổ sung tab **"12 Giấy Làm Việc"** trên thanh Header điều hướng toàn cục của `App.tsx`.
4. Khi bấm, tự động chuyển sang trang `WorkingPaperPage` với đường dẫn file nguồn và niên độ đã được điền sẵn từ dữ liệu nạp ở Setup.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Thêm state `workingPaperSourcePath` vào `store.ts` để truyền file nguồn mượt mà | P1 |
| 2 | Thêm nút Shortcut "Tạo 12 Giấy làm việc" tại thanh dock dưới SetupPage | P1 |
| 3 | Mở route render `<WorkingPaperPage />` và thêm tab trên Header `App.tsx` | P1 |
| 4 | Kết nối reactive: file nạp ở Setup tự động xuất hiện trong WorkingPaperPage | P1 |
| 5 | Verify typecheck sạch và 153/153 tests pass | P1 |

## Phases

| # | Phase | File chính | Trọng tâm | Status |
| 1 | [Store & State](./phase-01-start.md) | `src/renderer/state/store.ts` | Thêm `workingPaperSourcePath` & action | ✅ Completed |
| 2 | [SetupPage Shortcut](./phase-02-setup-page-shortcut-button.md) | `src/renderer/pages/SetupPage.tsx` | Nút tạo GLV dưới nút đối chiếu | ✅ Completed |
| 3 | [App Nav & Route](./phase-03-app-nav-and-view-routing.md) | `src/renderer/App.tsx`, `WorkingPaperPage.tsx` | Mở route & tab điều hướng | ✅ Completed |
| 4 | [Verification](./phase-04-verification-and-smoke-test.md) | Toàn dự án | `typecheck`, `test`, verify UX | ✅ Completed |

## Success Criteria
- [x] Người dùng thấy nút "TẠO 12 GIẤY LÀM VIỆC KIỂM TOÁN" dưới nút đối chiếu tại SetupPage.
- [x] Nút tự động nhận diện file từ Nguồn ① hoặc Nguồn ② (hoặc cả hai - ưu tiên ②).
- [x] Bấm nút chuyển thẳng sang `WorkingPaperPage` với file đã được nạp sẵn.
- [x] Header có tab điều hướng "12 Giấy Làm Việc" giúp chuyển qua lại bất kỳ lúc nào.
- [x] `npm run typecheck` 0 lỗi, `npm test` 153/153 pass.

<!-- slug: add-working-paper-shortcut-and-nav -->
