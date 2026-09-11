---
title: "Sửa nhận diện NKC: detect trên paste, null thay 0, match tên sheet tolerant"
description: "Clipboard paste được auto-detect cột, cột không nhận giữ null cho user chọn, sheet NKC_TrcDC được nhận đúng."
status: pending
priority: P1
effort: "4h"
branch: main
tags: [bugfix, frontend, import]
blockedBy: []
blocks: []
created: 2026-09-10
---

# Sửa Nhận Diện NKC (Sheet + Cột)

## Overview

File thực tế (10 cột NGÀY→TÊN KH, sheet `NKC`/`NKC_TrcDC`) đã nằm trong từ điển alias nhưng 3 điểm rơi làm sai: paste hardcode map 0–5, `?? 0` gán cột 0 âm thầm (2 nơi), tên sheet match cứng.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Paste auto-detect + null thay 0 | P1 |
| 2 | Match tên sheet tolerant + verify | P1 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Paste Detect Null Mapping](./phase-01-paste-detect-null-mapping.md) | Pending |
| 2 | [Sheet Match Verify](./phase-02-sheet-match-verify.md) | Pending |

## Success Criteria

- [ ] Paste header của user → 10/10 cột tự khớp (kể cả khi thứ tự cột đảo hoặc có dòng tiêu đề)
- [ ] Cột không nhận → `-- Chưa chọn --` đỏ, không gán cột 0
- [ ] Sheet `NKC_TrcDC` được nhận làm NKC ở mọi luồng (setup, working paper)
- [ ] typecheck, lint, tests, build xanh

## Red-Team Notes

- `columnMapper.ts` không import node API (chỉ `domain/clean` + types) nên renderer import trực tiếp an toàn.
- PasteModal đã tách `dataRows` (mất header) — detect phải chạy trên full matrix: đổi `onApply` truyền thêm matrix hoặc detect trong modal rồi truyền mapping.
- Đổi `?? 0` → `null` làm badge "Đã khớp" rớt khi thiếu cột: đúng ý (báo đỏ để user chọn tay).

## Open Questions

- Không còn. Ảnh chụp lệch code hiện tại có thể do bản dev dở — 3 điểm rơi trên là việc thật đã xác minh.

<!-- slug: nkc-recognition-fix -->
