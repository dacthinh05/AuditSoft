---
title: "Nới quét mẫu đặc biệt tự động VSA 530"
description: "Mở rộng tiêu chí checkSpecificRisk, Top-N bù khi quét trắng, ghi chú khi không phát hiện."
status: pending
priority: P1
effort: "4h"
branch: main
tags: [feature, sampling]
blockedBy: []
blocks: []
created: 2026-09-10
---

# Nới quét mẫu đặc biệt tự động VSA 530

## Overview

Checkbox "Cho phần mềm tự chọn" chạy đúng nhưng 5 tiêu chí quá hẹp nên sổ sạch ra Dòng 6 = 0. Nới vừa phải + giải thích khi trắng.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Tiêu chí rộng hơn, Top-N bù, note khi trắng | P1 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 2 | [Engine Broaden](./phase-02-engine-broaden.md) | Pending |
| 3 | [Ui Note Verify](./phase-03-ui-note-verify.md) | Pending |

## Success Criteria

- [ ] Sổ có dòng tháng 12/tròn ≥50tr/từ khóa → Dòng 6 > 0 đúng dòng
- [ ] Sổ sạch → Dòng 6 = Top-10 dưới KCM + note nguồn gốc rõ ràng
- [ ] Tắt checkbox → Dòng 6 = 0 và note "đã tắt" như cũ
- [ ] typecheck, lint, full tests, build xanh

<!-- slug: risk-auto-pick-broaden -->
