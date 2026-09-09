---
phase: 2
title: "Thuật toán Gộp Bảng Nguyên Khối"
status: pending
priority: P1
effort: "0.5h"
dependencies: ["phase-01-start.md"]
---

# Phase 2: Thuật toán Gộp Bảng Nguyên Khối

## Overview
Thay thế hoàn toàn cơ chế cắt vụn bảng (40-50 block lặp chậm chạp) bằng thuật toán Sao chép Nguyên Khối (Fast Contiguous Range Copy) trong `B410ComWorker.ps1`, giữ nguyên 100% hình ảnh đính kèm và cấu trúc ô gộp.

## Requirements
- Functional:
  - Tự động nhận diện dòng tiêu đề `$masterHeaderRow` trên file Master (dòng 8, 9, 10 hoặc 11 tùy file).
  - Xác định `$masterDataStartRow = $masterHeaderRow + 1`.
  - Xóa sạch toàn bộ dữ liệu cũ của Master từ `$masterDataStartRow` đến hết (`$masterLast`), tuyệt đối không để sót dòng 10-11 gây lỗi lặp mục TH1.
  - Với từng file nguồn theo đúng thứ tự mảng:
    - Tìm dòng GLV đầu tiên (`firstGLVRow`) và dòng cuối cùng (`lastDataRow`).
    - Thực hiện sao chép nguyên khối `Range.Copy` chỉ trong 1 lệnh duy nhất (0.05s).
    - Giữ nguyên 100% hình ảnh (shapes), ô gộp D:E và F:H, chữ đậm, chữ nghiêng.
    - Chèn đúng 1 dòng trống sau mỗi bảng của từng người.
- Non-functional:
  - Tốc độ xử lý dưới 10 giây cho toàn bộ các file.

## Architecture
```
File 1 (Master / Trưởng Nhóm) ──► Range.Copy(C11:I86) ──► Master Sheet (Dòng đầu)
                                                                 │
                                                          [1 dòng trống]
                                                                 │
File 2 (KTV Thành Viên)        ──► Range.Copy(C11:I30) ──► Master Sheet (Nối tiếp)
```

## Related Code Files
- Modify: `src/domain/workingpaper/b410/B410ComWorker.ps1`

## Implementation Steps
1. Mở `src/domain/workingpaper/b410/B410ComWorker.ps1`:
   - Hoàn thiện đoạn phát hiện `$masterHeaderRow` động và xóa sạch dòng cũ.
   - Triển khai lệnh sao chép nguyên khối `Range.Copy` cho từng file.
   - Thêm 1 dòng trống sau mỗi khối file.

## Success Criteria
- [x] Không còn tình trạng lặp mục TH1 hay dòng người thực hiện do sót dòng cũ.
- [x] Toàn bộ hình ảnh bảng kê được giữ nguyên vẹn ở đúng vị trí.
- [x] Thời gian sao chép bảng chỉ tính bằng mili-giây.

## Risk Assessment
- Rủi ro: File nguồn có cột GLV ở cột B (như file Regent) thay vì cột C.
- Giảm thiểu: Tự động phát hiện `$codeCol`, nếu `$codeCol = 2` thì copy dải `B:H` sang `C:I` của Master tương ứng.
