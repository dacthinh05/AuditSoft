---
title: "B410 Smart Ordering, Spellcheck & Print Layout Optimization"
description: "Sắp xếp phần TH lên đầu trang, chuẩn hóa chính tả nội dung và tối ưu cân đối trang in Print to View."
status: pending
priority: P1
effort: "2d"
tags: ["b410", "spellcheck", "print-layout", "excel-com"]
created: 2026-09-08
---

# B410 Smart Ordering, Spellcheck & Print Layout Optimization

## Overview
Kế hoạch nâng cấp module Tổng Hợp B410 với 3 mục tiêu trọng tâm:
1. **Cấu trúc thứ tự chuẩn:** Đưa toàn bộ các khối lưu ý `TH` lên đầu bảng (ngay sau dòng tiêu đề 11), đặt dòng Người thực hiện nằm ngay dưới phần việc TH tương ứng, sau đó mới nối tiếp các sai sót chi tiết khác (`D, E, F, G...`).
2. **Chuẩn hóa chính tả & ký tự:** Chuẩn hóa Unicode NFC, sửa khoảng trắng dấu câu, từ ngữ kế toán/kiểm toán trong ô Thực trạng và Hướng xử lý.
3. **Cân đối trang in (Print to View / Page Layout):** Tự động thiết lập vùng in (PrintArea), khóa vừa khít 1 trang ngang (Fit to 1 Page Wide), lặp lại dòng tiêu đề (PrintTitleRows 11:11) và căn giữa trang in để tài liệu xuất bản đẹp mắt, chuyên nghiệp.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Sắp xếp khối TH lên đầu bảng và đặt dòng Người thực hiện đúng vị trí | P1 |
| 2 | Tự động chuẩn hóa chính tả, Unicode và khoảng trắng dấu câu | P1 |
| 3 | Tối ưu hóa Page Setup và Print to View (khổ ngang A4, vừa khít lề, lặp tiêu đề) | P1 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Smart Ordering (TH on Top)](./phase-01-start.md) | pending |
| 2 | [Phase 2: Text & Spellcheck Normalizer](./phase-02-spellcheck-normalizer.md) | pending |
| 3 | [Phase 3: Page Setup & Print to View Optimization](./phase-03-page-layout-print.md) | pending |

## Success Criteria

- [ ] Các khối có mã `TH` (Lưu ý tổng hợp/Hồ sơ cần cung cấp) luôn xuất hiện ở đầu bảng B410 Master.
- [ ] Dòng Người thực hiện nằm ngay dưới nhóm mục của kiểm toán viên đó.
- [ ] Cột TT được đánh lại thứ tự liên tục 1, 2, 3...
- [ ] Câu chữ trong Thực trạng và Hướng xử lý không bị lỗi khoảng trắng hay lỗi font Unicode tổ hợp.
- [ ] Khi bật chế độ Page Break Preview hoặc bấm Print Preview (Ctrl + P), toàn bộ cột A-I nằm trọn vẹn trong 1 trang ngang (Landscape A4), không bị rớt cột sang trang 2, dòng tiêu đề tự lặp lại ở mọi trang in.

<!-- slug: b410-spellcheck-printlayout -->