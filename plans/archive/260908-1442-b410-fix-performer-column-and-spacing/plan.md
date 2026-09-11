---
title: "Chuẩn hóa Cột Người Lập, Khoảng Cách Lưu Ý & Phân Trang In B410 Master"
description: "Khắc phục triệt để 3 lỗi trên sheet Sai Sot & Luu Y của B410 Master: điền tên KTV vào Cột 9 (loại bỏ tên file nguồn), chèn 1 dòng trống giữa các lưu ý, loại bỏ dòng banner ngang gây lỗi ngắt trang mồ côi ở đáy trang in."
status: pending
priority: P1
effort: "3h"
tags: ["b410", "excel-com", "powershell", "print-layout", "working-paper"]
created: 2026-09-08
---

# Chuẩn hóa Cột Người Lập, Khoảng Cách Lưu Ý & Phân Trang In B410 Master

## Overview
Kế hoạch này giải quyết dứt điểm 3 lỗi trọng tâm được phát hiện trong file tổng hợp B410 Master (`Sai Sot & Luu Y`):
1. **Cột 9 ("Nguon / Nguoi lap"):** Đang bị điền tên file nguồn dài dòng (`B410 - Pro-Concepts...`). Cần trích xuất chính xác **Tên Người lập / KTV** (kèm SĐT nếu có) và điền vào cột này.
2. **Khoảng cách giữa các lưu ý:** Hiện các lưu ý đang dính liền nhau. Cần chèn **đúng 1 dòng trống** giữa mỗi khối lưu ý để bảng thoáng và rõ ràng.
3. **Phân trang in ấn & Triệt tiêu dòng mồ côi:** Loại bỏ dòng banner `Người thực hiện: ...` chèn ngang giữa bảng (vốn gây ra lỗi ngắt trang mồ côi nằm lẻ loi ở dòng cuối cùng của Trang 1). Tối ưu hóa Page Setup (A4 Landscape, Fit to 1 Page Wide, lặp dòng tiêu đề cột 11) đảm bảo trang in chuẩn mực hồ sơ kiểm toán.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Trích xuất sạch tên Người lập/KTV và điền vào Cột 9 (loại bỏ tên file nguồn) | P1 |
| 2 | Chèn đúng 1 dòng trống ngăn cách giữa các khối lưu ý | P1 |
| 3 | Loại bỏ dòng banner ngang trong bảng & Tối ưu Page Setup A4 Landscape không còn lỗi ngắt trang mồ côi | P1 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Trích xuất Người lập & Điền Cột 9](./phase-01-start.md) | Pending |
| 2 | [Phase 2: Khoảng cách Lưu ý & Bỏ Banner Ngang](./phase-02-note-spacing-and-remove-banner.md) | Pending |
| 3 | [Phase 3: Tối ưu Phân trang In & Kiểm thử Nghiệm thu](./phase-03-page-layout-and-verification.md) | Pending |

## Success Criteria

- [ ] Cột 9 trên sheet `Sai Sot & Luu Y` hiển thị tên KTV lập (VD: `Văn Hiệp - 0905 271 989`, `Lê Trúc`, `Quỳnh`), không còn chứa tên file nguồn.
- [ ] Mỗi khối lưu ý cách nhau bằng đúng 1 dòng trống.
- [ ] Không còn dòng banner ngang `Người thực hiện: ...` chèn chen ngang giữa bảng gây rách layout.
- [ ] Ở chế độ *Page Break Preview* và *Print Preview*, toàn bộ nội dung hiển thị vừa vặn trong chiều ngang A4 Landscape, tiêu đề lặp lại ở đầu mọi trang in, đáy trang in không bao giờ bị cụt dòng.

<!-- slug: b410-fix-performer-column-and-spacing -->
