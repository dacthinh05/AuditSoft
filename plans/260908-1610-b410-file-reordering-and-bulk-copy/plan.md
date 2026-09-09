---
title: "Sắp Xếp Thứ Tự File B410 Bằng Kéo Thả & Gộp Nguyên Khối Tốc Độ Cao"
description: "Nâng cấp module B410: bổ sung tính năng Kéo - Thả / Lên - Xuống sắp xếp thứ tự các file ghép, tự động đưa file Trưởng Nhóm lên vị trí đầu tiên, và tối ưu hóa sao chép nguyên khối bảng bảo toàn 100% hình ảnh và đánh số thứ tự TT liên tục không bị reset."
status: pending
priority: P1
effort: "2h"
tags: ["b410", "drag-and-drop", "ui", "excel-com", "powershell"]
created: 2026-09-08
---

# Sắp Xếp Thứ Tự File B410 Bằng Kéo Thả & Gộp Nguyên Khối Tốc Độ Cao

## Overview
Kế hoạch này giải quyết triệt để 2 vấn đề lớn được người dùng yêu cầu:
1. **Kiểm soát Thứ tự Ghép File:** Khi nạp các file B410 vào, file của **Trưởng nhóm / Master phải luôn nằm trên cùng**, và người dùng có thể **kéo - thả (drag & drop)** hoặc bấm nút **Lên / Xuống (↑ / ↓)** để tự quyết định KTV nào làm trước, KTV nào làm sau. Thứ tự trên giao diện sẽ quyết định chính xác 100% thứ tự nối tiếp trong file Master.
2. **Khắc phục lỗi cấu trúc bảng & STT:** Đảm bảo dữ liệu cũ trên file Master được xóa sạch từ đúng dòng sau tiêu đề (không để sót dòng 10-11 tạo ra mục trùng lặp), copy nguyên khối cực nhanh giữ nguyên hình ảnh, và đánh số thứ tự cột TT (Col B) liên tục từ 1, 2, 3... xuyên suốt, không bị nhảy lộn xộn hay reset về 1.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Bổ sung Drag & Drop reorder và nút điều hướng ↑ / ↓ trong danh sách file B410, tự động đưa Trưởng Nhóm lên vị trí số 1 | P1 |
| 2 | Tối ưu hóa thuật toán copy nguyên khối (Fast Range Copy) giữ nguyên 100% hình ảnh, ô gộp và định dạng | P1 |
| 3 | Khắc phục lỗi xóa sót dòng trên Master và đánh số thứ tự TT liên tục không bao giờ bị reset | P1 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Giao diện Sắp Xếp File Ghép](./phase-01-start.md) | Pending |
| 2 | [Phase 2: Thuật toán Gộp Bảng Nguyên Khối](./phase-02-fast-contiguous-table-copy.md) | Pending |
| 3 | [Phase 3: Đánh Số TT Liên Tục & Kiểm Thử](./phase-03-sequential-tt-and-verification.md) | Pending |

## Success Criteria

- [ ] Người dùng có thể dùng chuột kéo thả từng thẻ file để đổi vị trí, hoặc bấm nút `↑` và `↓`.
- [ ] Khi bấm nút "Trưởng Nhóm", file đó tự động được đẩy lên vị trí đầu tiên (Index 0).
- [ ] Thứ tự gộp trong file Excel Master khớp 100% với thứ tự file hiển thị trên giao diện.
- [ ] Không còn hiện tượng lặp lại mục TH1 hay dòng người thực hiện do xóa sót dòng cũ.
- [ ] Cột B (TT) đánh số liên tục 1, 2, 3, 4, 5... xuyên suốt toàn bộ các file.
- [ ] Thời gian gộp toàn bộ các file chỉ mất dưới 15 giây.

<!-- slug: b410-file-reordering-and-bulk-copy -->
