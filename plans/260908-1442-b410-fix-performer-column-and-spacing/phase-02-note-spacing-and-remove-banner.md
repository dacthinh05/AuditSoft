---
phase: 2
title: "Khoảng cách Lưu ý & Bỏ Banner Ngang"
status: pending
priority: P1
effort: "1h"
dependencies: ["phase-01-start.md"]
---

# Phase 2: Khoảng cách Lưu ý & Bỏ Banner Ngang

## Overview
Chèn đúng 1 dòng trống giữa mỗi khối lưu ý để tạo khoảng cách rõ ràng, và loại bỏ dòng banner ngang `Người thực hiện: ...` chèn giữa bảng (nguyên nhân gây ra lỗi ngắt trang mồ côi ở cuối trang).

## Requirements
- Functional:
  - Loại bỏ hoàn toàn đoạn code chèn dòng chữ `Người thực hiện: ...` vào giữa cột D:
    - Vì thông tin Người lập đã nằm chuẩn mực tại Cột 9 của từng dòng lưu ý, việc chèn thêm dòng banner ngang ở giữa bảng làm nát cấu trúc lưới Excel và khiến ngắt trang bị đứt đoạn.
  - Sau mỗi khối lưu ý (kể cả khối TH hay khối chi tiết):
    - Tự động bỏ cách **đúng 1 dòng trống** trước khi ghi khối tiếp theo (`$script:destRow++`).
  - Chuẩn hóa mã GLV: Xóa khoảng trắng thừa (VD: `E 440.1` -> `E440.1`, `TH 1` -> `TH1`).
- Non-functional: Giữ nguyên vẹn toàn bộ hình ảnh đính kèm, định dạng rich-text và các dòng chi tiết bên trong mỗi khối.

## Architecture
```
[Ghi Lưu ý 1 (TH1)] 
        │
        ▼
[Dòng trống ngăn cách (1 row)]
        │
        ▼
[Ghi Lưu ý 2 (G140.1)] (Cột 9 có tên người lập, không có banner ngang chen giữa)
```

## Related Code Files
- Modify: `src/domain/workingpaper/b410/B410ComWorker.ps1`

## Implementation Steps
1. Mở `src/domain/workingpaper/b410/B410ComWorker.ps1`:
   - Xóa bỏ khối:
     ```powershell
     if ($blk.PerformerText -and ($blk.PerformerText -ne $lastPerformer)) {
         # ... chèn vào cột 4 dòng Người thực hiện ...
     }
     ```
   - Trong hàm `Write-BlocksToMaster`:
     Sau khi ghi xong 1 block:
     ```powershell
     $script:destRow += $bHeight
     # Chèn đúng 1 dòng trống ngăn cách giữa các lưu ý
     $script:destRow++
     $script:ttCounter++
     ```
   - Cập nhật hàm chuẩn hóa mã GLV: `$cleanCode = $cText -replace '\s+', ''`.

## Success Criteria
- [x] Mỗi khối lưu ý trên sheet Master cách nhau bằng đúng 1 dòng trống.
- [x] Không còn dòng chữ `Người thực hiện: ...` chèn chen ngang giữa bảng.
- [x] Mã GLV được chuẩn hóa liền mạch (`TH1`, `E240.1`...).

## Risk Assessment
- Rủi ro: Hình ảnh đính kèm bị lệch vị trí khi có dòng trống.
- Giảm thiểu: Tọa độ paste hình ảnh `TopLeftCell` được tính tương đối theo `$script:destRow` của từng block nên hình ảnh sẽ di chuyển đồng bộ cùng với khối dữ liệu.
