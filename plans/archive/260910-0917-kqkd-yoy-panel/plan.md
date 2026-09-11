---
title: "Panel KQKD năm nay vs năm trước + đồ thị"
description: "Thay panel GDBLQ trống bằng bảng KQKD YoY theo mã số B02 và grouped-bar chart, giữ cảnh báo GDBLQ dạng gọn."
status: pending
priority: P1
effort: "1d"
branch: main
tags: [feature, frontend, analytics]
blockedBy: []
blocks: []
created: 2026-09-10
---

# Panel KQKD Năm Nay vs Năm Trước + Đồ Thị

## Overview

Panel phải trong grid EBITDA/GDBLQ thường trống vì scan mù đối tác trên NKC thuần. Thay bằng bảng KQKD YoY (ưu tiên số B02, fallback cộng dồn NKC theo map TK) + grouped-bar chart; findings GDBLQ (nếu có) thành dải gọn + mở rộng trong cùng card.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Helper dựng dòng KQKD YoY 2 nguồn + test | P1 |
| 2 | Panel UI bảng + chart, dải GDBLQ gọn | P1 |
| 3 | Verify typecheck/lint/tests/build + smoke | P1 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Kqkd Yoy Engine](./phase-01-kqkd-yoy-engine.md) | Pending |
| 2 | [Kqkd Yoy Ui Chart](./phase-02-kqkd-yoy-ui-chart.md) | Pending |
| 3 | [Verification](./phase-03-verification.md) | Pending |

## Success Criteria

- [ ] File có sheet KQKD 2 năm: bảng đủ Năm nay/Năm trước/Chênh lệch/% + chart 2 cột
- [ ] Chỉ NKC: Năm nay đúng, Năm trước `-`, có hướng dẫn nạp BCTC
- [ ] Có GDBLQ: dải cảnh báo + mở rộng đầy đủ, không mất thông tin
- [ ] typecheck, lint, full tests, build xanh

## Red-Team Notes

- Nguồn B02 thiếu mã số nào → dòng đó fallback NKC từng phần, không bỏ cả bảng.
- NKC không tách được lãi vay trong 635 → dòng lãi vay chỉ hiện khi có B02, NKC thuần để `-`.
- Chart với 12 dòng B02 sẽ rối: chỉ vẽ 6 dòng chính (10, 11, 60, 25, 26, 70), bảng giữ đủ.

## Open Questions

- Dải GDBLQ: đếm + mở rộng (mặc định), liệt kê 3 dòng đầu luôn là fallback nếu user muốn.

<!-- slug: kqkd-yoy-panel -->
