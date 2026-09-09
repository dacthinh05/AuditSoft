---
phase: 3
status: completed
priority: P1
effort: "4h"
dependencies: [2]
---

# Phase 3: Page Setup & Print to View Optimization

## Overview
Tối ưu hóa toàn bộ trang in của sheet B410 Master bằng COM PageSetup sau khi đã đổ hết dữ liệu.

## Requirements
- Functional:
  - Khổ giấy: Khổ ngang A4 (`Orientation = xlLandscape`, `PaperSize = xlPaperA4`).
  - Khóa chiều ngang vừa vặn 1 trang: `FitToPagesWide = 1`, `FitToPagesTall = $false` / `0` (chiều dọc kéo dài tự nhiên theo số dòng).
  - Đặt lại vùng in: `PrintArea = "A1:I" + $lastRow`.
  - Lặp lại dòng tiêu đề khi in nhiều trang: `PrintTitleRows = "$11:$11"`.
  - Căn giữa trang in ngang: `CenterHorizontally = $true`.
  - Bật căn lề tiêu chuẩn và tự co giãn chiều cao dòng (`WrapText = $true`, `AutoFit` theo nội dung).
- Non-functional: Mở lên ở chế độ xem nào (Normal hay Page Break Preview) cũng cân đối tuyệt đối.

## Implementation Steps
1. Sau khi kết thúc vòng lặp ghi toàn bộ block vào Master, lấy dòng cuối cùng `$lastRow`.
2. Gọi `$masterWs.PageSetup` để cấu hình các thuộc tính trên.
3. Thiết lập độ rộng cột chuẩn (Col A: 3, B: 5, C: 12, D: 35, E: 35, F: 30, G: 30, H: 20, I: 20).

## Success Criteria
- [x] Bật Ctrl + P (Print Preview) trên file Master thấy toàn bộ bảng biểu từ A đến I nằm trọn vẹn trong trang in, không có cột nào bị rớt sang trang sau.
- [x] Dòng tiêu đề [TT | Giấy LV | Thực trạng...] tự động xuất hiện ở đầu tất cả các trang in.