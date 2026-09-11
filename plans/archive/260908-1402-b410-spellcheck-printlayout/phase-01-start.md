---
phase: 1
status: completed
priority: P1
effort: "4h"
dependencies: []
---

# Phase 1: Smart Ordering (TH on Top & Performer Positioning)

## Overview
Cải tiến logic phân rã khối trong `B410ComWorker.ps1` để phân tách hai loại mục: Nhóm lưu ý tổng hợp (`TH`) và Nhóm sai sót chi tiết khác (`D, E, F, G...`).

## Requirements
- Functional: 
  - Khối có mã `TH` từ các file nguồn phải được copy đưa lên đầu Master (bắt đầu từ dòng 12).
  - Kèm theo dòng "Thực hiện: [Tên]" ngay dưới khối TH đó.
  - Các khối chi tiết khác được gom và nối tiếp bên dưới.
  - Đánh lại số thứ tự cột TT liên tục từ 1 đến hết.
- Non-functional: Giữ nguyên vẹn mã Giấy LV (Vd: `TH.1`, `TH.2`, `E340.1`...).

## Implementation Steps
1. Trong vòng lặp đọc file nguồn của worker PowerShell, duyệt tìm tất cả các block và phân loại vào 2 mảng: `$thBlocks` và `$detailBlocks`.
2. Ghi nhóm `$thBlocks` vào Master trước.
3. Chèn dòng định dạng `Người thực hiện: ...` tương ứng.
4. Ghi tiếp nhóm `$detailBlocks`.
5. Đánh lại cột B (TT) theo chuỗi liên tục $1, 2, 3...$.

## Success Criteria
- [x] Mở file Master thấy toàn bộ các dòng TH.1, TH.2 xuất hiện trên cùng.
- [x] Dòng Người thực hiện hiển thị rõ ràng, chuẩn định dạng.