---
phase: 1
title: "Giao diện Sắp Xếp File Ghép"
status: pending
priority: P1
effort: "1h"
dependencies: []
---

# Phase 1: Giao diện Sắp Xếp File Ghép

## Overview
Bổ sung tính năng kéo thả (HTML5 Drag & Drop) sắp xếp thứ tự các file trong bảng danh sách của `B410DropZone.tsx`, thêm 2 nút `↑ Lên` / `↓ Xuống`, và tự động đẩy file được chọn làm "Trưởng Nhóm" lên vị trí đầu tiên.

## Requirements
- Functional:
  - Thêm state `draggedIndex: number | null` để xử lý kéo thả reorder.
  - Mỗi hàng thẻ file hỗ trợ:
    - Thuộc tính `draggable={!isProcessing}`.
    - Xử lý sự kiện `onDragStart`, `onDragOver`, `onDrop` để hoán đổi vị trí trực quan.
    - Hai nút bấm nhỏ gọn `↑` (Lên) và `↓` (Xuống) cho phép người dùng click nhanh mà không bắt buộc phải kéo chuột.
  - Khi người dùng click nút "Trưởng Nhóm" trên một file:
    - Gán file đó làm `masterTemplate`.
    - Tự động di chuyển file đó lên đầu mảng `files` (Index 0).
  - Khi bấm "BẮT ĐẦU TỔNG HỢP":
    - Truyền `sourceFiles` theo đúng thứ tự mảng `files` hiện tại trong UI.
- Non-functional:
  - Giao diện mượt mà, phản hồi ngay lập tức, không làm giật lag hay mất trạng thái file.

## Architecture
```
[User Drag / Click ↑ ↓] ──► setFiles(reordered) ──► UI cập nhật thứ tự
                                                              │
[Click Trưởng Nhóm] ──────► file moves to Index 0 ────────────┤
                                                              ▼
[Bấm Tổng Hợp] ───────────► consolidateB410({ sourceFiles: files.map(f => f.path) })
```

## Related Code Files
- Modify: `src/renderer/components/B410Consolidation/B410DropZone.tsx`

## Implementation Steps
1. Trong `B410DropZone.tsx`:
   - Thêm các hàm `handleMoveUp(index: number)` và `handleMoveDown(index: number)`.
   - Thêm các hàm `handleItemDragStart`, `handleItemDragOver`, `handleItemDrop`.
   - Cập nhật hàm `handleSetAsMasterTemplate` để tự động đưa file Trưởng Nhóm lên vị trí số 1 (`[target, ...rest]`).
   - Thêm 2 nút điều hướng `↑` và `↓` cạnh mỗi thẻ file.
2. Kiểm tra tương tác trên giao diện, đảm bảo di chuyển file mượt mà.

## Success Criteria
- [x] Kéo thả file bất kỳ vào vị trí khác hoạt động trơn tru.
- [x] Bấm `↑` đưa file lên trên 1 bậc, `↓` đưa file xuống dưới 1 bậc.
- [x] Bấm "Trưởng Nhóm" đưa file đó lên ngay dòng đầu tiên của danh sách.

## Risk Assessment
- Rủi ro: Kéo thả file từ máy tính vào thẻ file bị xung đột với kéo thả đổi vị trí giữa các thẻ.
- Giảm thiểu: Phân biệt sự kiện: `e.dataTransfer.types.includes('Files')` là nạp file từ máy tính, còn `draggedIndex !== null` là reorder nội bộ.
