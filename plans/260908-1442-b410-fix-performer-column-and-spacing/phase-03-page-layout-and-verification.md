---
phase: 3
title: "Tối ưu Phân trang In & Kiểm thử Nghiệm thu"
status: pending
priority: P1
effort: "1h"
dependencies: ["phase-02-note-spacing-and-remove-banner.md"]
---

# Phase 3: Tối ưu Phân trang In & Kiểm thử Nghiệm thu

## Overview
Cấu hình chuẩn Page Setup khổ ngang A4 (`xlLandscape`), tự động co giãn vừa khít 1 trang ngang (`FitToPagesWide = 1`), lặp lại dòng tiêu đề cột và kiểm thử thực tế với bộ file B410.

## Requirements
- Functional:
  - Thiết lập thuộc tính PageSetup:
    - `Orientation = 2` (xlLandscape - Khổ ngang A4).
    - `PaperSize = 9` (xlPaperA4).
    - `Zoom = $false`.
    - `FitToPagesWide = 1`.
    - `FitToPagesTall = $false` (để Excel tự tính ngắt trang theo chiều dọc tự nhiên, không ép dẹp trang).
    - `PrintTitleRows = "$11:$11"` (Lặp lại dòng tiêu đề cột ở đầu mỗi trang in).
    - `CenterHorizontally = $true`.
    - `PrintArea = "A1:I$finalLastRow"`.
  - Đảm bảo WrapText cho toàn bộ vùng dữ liệu: `$masterWs.Range("A11:I$finalLastRow").WrapText = $true`.
  - Tiến hành chạy kiểm thử thực tế với các file B410 trong thư mục `B410/`.
- Non-functional:
  - File Excel xuất ra mở lên mượt mà, chuyển sang chế độ *Page Break Preview* hiển thị ranh giới trang (nét đứt xanh) tự nhiên, không bị đứt đoạn vô lý.

## Architecture
```
Master Sheet ──► Set PageSetup (A4 Landscape, Fit 1 Page Wide, Repeat Row 11) ──► SaveCopyAs()
```

## Related Code Files
- Modify: `src/domain/workingpaper/b410/B410ComWorker.ps1`

## Implementation Steps
1. Mở `src/domain/workingpaper/b410/B410ComWorker.ps1`:
   - Kiểm tra và tối ưu khối thiết lập `PageSetup` ở cuối script.
   - Bổ sung lệnh thiết lập lề in chuẩn (LeftMargin, RightMargin, TopMargin, BottomMargin).
2. Chạy thử nghiệm script với các file B410 trong thư mục `B410/`.
3. Mở file master kết quả để kiểm tra:
   - Kiểm tra Cột 9 xem có đúng tên Người lập không.
   - Kiểm tra xem giữa các lưu ý có đúng 1 dòng trống không.
   - Mở Print Preview (hoặc Page Break Preview) để xác nhận không còn dòng mồ côi ở cuối trang.

## Success Criteria
- [x] Khi in hoặc xuất PDF, tài liệu luôn vừa khít 1 trang ngang (không bị rớt cột sang trang thừa).
- [x] Dòng tiêu đề cột (STT, Giấy LV, Thực trạng, Hướng xử lý, Người lập) xuất hiện ở đầu tất cả các trang in.
- [x] Toàn bộ các lưu ý được thể hiện liền mạch, không còn tình trạng dòng người thực hiện nằm trơ trọi ở đáy trang.

## Risk Assessment
- Rủi ro: Chiều cao một khối lưu ý quá dài vượt quá 1 trang A4.
- Giảm thiểu: Thuộc tính `FitToPagesTall = $false` cho phép Excel tự ngắt trang dọc một cách tự nhiên giữa các dòng text.
