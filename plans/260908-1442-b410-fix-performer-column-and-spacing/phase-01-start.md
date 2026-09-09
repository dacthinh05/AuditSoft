---
phase: 1
title: "Trích xuất Người lập & Điền Cột 9"
status: pending
priority: P1
effort: "1h"
dependencies: []
---

# Phase 1: Trích xuất Người lập & Điền Cột 9

## Overview
Cải tiến thuật toán nhận diện KTV trong `B410ComWorker.ps1` để trích xuất sạch tên Người lập (kèm số điện thoại nếu có), loại bỏ hoàn toàn việc điền tên file nguồn vào Cột 9.

## Requirements
- Functional:
  - Viết hàm chuẩn hóa `Extract-PerformerCleanName`:
    - Quét tìm trong các ô header hoặc ô chốt nhóm: chuỗi có dạng `Người thực hiện: [Tên] - [SĐT]` hoặc `Thực hiện: [Tên]`.
    - Loại bỏ các từ khóa thừa như `Người thực hiện:`, `Thực hiện:`, `KTV:`.
    - Giữ lại họ tên và SĐT (VD: `Văn Hiệp - 0905 271 989`, `Lê Trúc`).
    - Nếu không tìm thấy trong nội dung mà phải lấy từ tên file nguồn: Chỉ lấy phần tên KTV ở cuối tên file (VD: `B410 - XCEL WOOD - Gia Cuong` -> `Gia Cường`), tuyệt đối không để nguyên cả cụm tên file dài dòng.
  - Điền giá trị này vào Cột 9 (`Nguon / Nguoi lap`) tại mỗi dòng lưu ý tương ứng.
- Non-functional: Đảm bảo font chữ ở Cột 9 gọn gàng, căn lề giữa/trái cân đối.

## Architecture
```
[File nguồn B410] ──► Quét text người lập ──► Extract-PerformerCleanName() ──► Gán vào Cột 9
                                                                               (Không chèn tên file)
```

## Related Code Files
- Modify: `src/domain/workingpaper/b410/B410ComWorker.ps1`

## Implementation Steps
1. Mở `src/domain/workingpaper/b410/B410ComWorker.ps1`:
   - Bổ sung hàm helper `function Extract-PerformerCleanName($rawText, $fileName)`.
   - Cập nhật logic thu thập `$blockInfo`: thêm trường `PerformerCleanName`.
   - Tại vị trí ghi dữ liệu vào Master:
     `$masterWs.Cells.Item($script:destRow, 9).Value2 = $blk.PerformerCleanName`.

## Success Criteria
- [x] Cột 9 của sheet `Sai Sot & Luu Y` hiển thị sạch sẽ tên KTV/Người lập.
- [x] Không còn xuất hiện chuỗi tên file dài `B410 - Pro-Concepts (01.01 - 30.06.2026) - Hiệp`.

## Risk Assessment
- Rủi ro: File nguồn không ghi tên KTV ở bất kỳ đâu.
- Giảm thiểu: Fallback thông minh lấy token cuối cùng của tên file sau dấu gạch ngang `-` (thường là tên người như `Gia Cuong`, `Ngu`, `Hiep`).
