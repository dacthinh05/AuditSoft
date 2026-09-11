---
title: "Matrix hover-note, gọn alerts, phân tích 641/642 và fill Excel G353/G453"
description: "Thay pill (!) bằng hover tooltip, xóa hộp alerts dày, thêm bảng chi tiết 641/642 theo tháng và fill vào sheet G353/G453."
status: pending
priority: P1
effort: "2d"
branch: main
tags: [feature, frontend, analytics]
blockedBy: []
blocks: []
created: 2026-09-10
---

# Matrix Hover-Note + Phân Tích 641/642 + Fill Excel G353/G453

## Overview

Ba việc theo ảnh người dùng: (1) bỏ dấu `(!)` trong ma trận 12 tháng, rê chuột hiện ghi chú kiểm toán ngắn; (2) xóa hộp vàng alerts dày, cân đều 8 tiêu đề cột; (3) phân tích chi phí 641/642 theo TK 4 số từng tháng trên UI và fill vào sheet phân tích trong file G200-300-400.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Ô đột biến hover hiện note ngắn, không còn `(!)` | P1 |
| 2 | Xóa hộp alerts, header cân đối, CẢ NĂM `0` → `-` | P1 |
| 3 | Bảng chi tiết 641/642 theo tháng trên UI, tỷ lệ đúng, hết `#DIV/0!` | P1 |
| 4 | Fill 2 bảng vào sheet G353/G453 của file G200-300-400 | P1 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Matrix Hover Tooltip](./phase-01-matrix-hover-tooltip.md) | Pending |
| 2 | [Expense 641 642 Analytics](./phase-02-expense-641-642-analytics.md) | Pending |
| 3 | [Excel G353 G453 Fill](./phase-03-excel-g353-g453-fill.md) | Pending |
| 4 | [Verification](./phase-04-verification.md) | Pending |

## Success Criteria

- [ ] Grep `(!)` trong `GlAnalyticsTab.tsx` rỗng; hover ô vàng thấy note ≤ 2 dòng kèm % MoM
- [ ] Không còn render hộp alerts; cùng nội dung đọc được qua hover
- [ ] Bảng 641/642 đúng TK 4 số phát sinh, Tổng/Tỷ lệ đúng, tháng DT=0 hiện `-`
- [ ] Sheet G353/G453 trong file thật được điền đúng dòng tháng; sheet vắng thì bỏ qua êm
- [ ] `typecheck`, `lint`, full tests, `build` xanh

## Red-Team Notes

- Giả định tên sheet G353/G453: filler thử alias `G353`/`G 353`, `G453`/`G 453` và **tự nhận diện 641/642 bằng nội dung header**, nên sai tên vẫn đúng dữ liệu.
- Giả định layout theo ảnh (dòng `Tháng`, dòng tháng 1–12, dòng `Cộng`): filler **dò dòng theo nội dung** thay vì row cứng.
- `warningNotes` giữ nguyên vì test cũ assert nội dung; field mới là optional.
- Template thật không có trong repo: rủi ro layout lệch được chặn bằng test workbook mock + script liệt kê sheet khi chạy thật.

## Open Questions

- "641 và 6412" được hiểu là 641 & 642 theo ảnh; "G453/G353" map theo nội dung sheet chứ không theo tên.

<!-- slug: matrix-hover-641-642-analysis -->
