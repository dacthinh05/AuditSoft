---
phase: 3
title: "Đánh Số TT Liên Tục & Kiểm Thử"
status: pending
priority: P1
effort: "0.5h"
dependencies: ["phase-02-fast-contiguous-table-copy.md"]
---

# Phase 3: Đánh Số TT Liên Tục & Kiểm Thử

## Overview
Quét lại cột B (TT) trên toàn bộ bảng Master và đánh số thứ tự liên tục 1, 2, 3, 4, 5... xuyên suốt tất cả các file gộp, không bao giờ bị reset về 1 hay nhảy lộn xộn; tiến hành kiểm thử thực tế.

## Requirements
- Functional:
  - Trước khi ghi số TT mới: Xóa sạch nội dung cũ của Cột B trong phạm vi bảng vừa paste (`Range("B...").ClearContents()`).
  - Quét từng dòng của bảng:
    - Nếu ô tại Cột C (Giấy LV) có chứa mã (ký tự chữ hoặc số) và không phải là dòng "Người thực hiện" hay "Tổng cộng":
      - Điền `$script:ttCounter` vào Cột B (căn giữa).
      - Tăng `$script:ttCounter++`.
  - Giữ biến đếm `$script:ttCounter` liên tục xuyên suốt từ file đầu tiên đến file cuối cùng.
  - Bẻ gãy các liên kết ngoài (`BreakLink`) và lưu file chuẩn `.xlsx` (mã 51).
- Non-functional:
  - Không bao giờ để cột TT có số trùng lặp giữa các KTV khác nhau.

## Architecture
```
File 1 (Trưởng Nhóm): TT = 1, 2, 3... 30
           │
           ▼ (tiếp tục tăng)
File 2 (Thành Viên):  TT = 31, 32, 33... 35
```

## Related Code Files
- Modify: `src/domain/workingpaper/b410/B410ComWorker.ps1`

## Implementation Steps
1. Trong `B410ComWorker.ps1`:
   - Hoàn thiện vòng lặp đánh số TT cột B với điều kiện lọc chuẩn xác.
2. Chạy test kiểm thử thực tế với bộ file Cuori + Regent + Rotong:
   - Đổi thứ tự file trên UI.
   - Bấm gộp.
   - Kiểm tra kết quả trong file Excel đầu ra.

## Success Criteria
- [x] Số thứ tự ở Cột B tăng dần đều 1, 2, 3, 4, 5... từ đầu đến cuối bảng.
- [x] Không có hiện tượng reset về 1 khi chuyển sang phần việc của KTV tiếp theo.
- [x] File mở lên nhanh, không có cảnh báo external link.

## Risk Assessment
- Rủi ro: Dòng có mã phụ như `TH.1.1` bị bỏ sót không đánh số.
- Giảm thiểu: Regex `^[A-Za-z0-9]` khớp với mọi ký tự bắt đầu bằng chữ hoặc số.
