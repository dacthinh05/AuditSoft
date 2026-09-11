---
title: "B410 Consolidation Module (COM Engine)"
description: "Gộp các file B410 tự động bằng Excel COM, giữ nguyên định dạng, ảnh neo theo khối và mã giấy làm việc."
status: pending
priority: P1
effort: "4d"
tags: ["b410", "excel-com", "powershell", "ui"]
created: 2026-09-08
---

# B410 Consolidation Module (COM Engine)

## Overview
Module giúp Trưởng nhóm kiểm toán (AuditSoft) tự động gộp nhiều file B410 (`.xls` và `.xlsx`) của các thành viên thành một file B410 Master duy nhất. Chức năng sử dụng 100% **Excel COM (qua PowerShell/VBScript hoặc tiến trình nền)** làm engine sao chép chính (`Range.Copy`, `Worksheet.Copy`) để đảm bảo không phá vỡ merged cells, kích thước dòng, rich text và vị trí ảnh nổi (floating shapes). 

Hệ thống sẽ định vị các sai sót theo từng "khối" dựa vào cột mã Giấy Làm Việc, đồng thời thêm tự động các cột truy vết nguồn gốc (TT tổng hợp, Nguồn/Người lập) mà không làm mất mã lỗi gốc của kiểm toán viên.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Chứng minh (Spike) khả năng copy ảnh neo và sheet đính kèm qua COM | P1 |
| 2 | Hoàn thiện Engine gộp B410 nhận diện lỗi theo "khối" (Blocks) | P1 |
| 3 | Tích hợp UI Kéo/Thả, báo cáo lỗi và xử lý ngoại lệ an toàn | P2 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Spike (COM Engine Edge Cases)](./phase-01-start.md) | pending |
| 2 | [Phase 2: Core Engine (Block-based Merge)](./phase-02-core-engine.md) | pending |
| 3 | [Phase 3: UI Integration & Error Handling](./phase-03-ui-integration.md) | pending |

## Success Criteria

- [ ] File Master B410 không bị lỗi "We found a problem..." khi mở bằng Excel.
- [ ] Chữ, rich-text, bảng, chiều cao dòng và hình ảnh/shape gắn trong các khối lỗi được copy chính xác, vị trí ảnh dịch chuyển đúng theo vị trí đích.
- [ ] Sheet đính kèm được bê nguyên vẹn qua Master và đổi tên tự động để chống trùng lặp.
- [ ] Mã Giấy LV (Vd: G140.1) được giữ nguyên, có thêm cột TT Master và cột Nguồn truy vết.
- [ ] Giao diện (UI) hoạt động mượt mà, báo cáo rõ bao nhiêu file thành công/thất bại sau mỗi đợt kéo thả.

<!-- slug: b410-consolidation -->