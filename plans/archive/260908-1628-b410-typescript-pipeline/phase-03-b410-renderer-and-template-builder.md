---
phase: 3
title: "B410 Renderer & Master Template Builder"
status: pending
priority: P1
effort: "1h"
dependencies: ["phase-02-b410-normalizer-and-height-calculator.md"]
---

# Phase 3: B410 Renderer & Master Template Builder

## Overview
Xây dựng module `B410Renderer.ts` nhận mảng các lưu ý đã chuẩn hóa, mở file Master Template bằng ExcelJS, ghi các lưu ý vào bảng theo chuẩn cấu trúc 4 cột merge, chèn hàng trống 12.75pt, đặt ảnh an toàn và copy các sheet phụ đính kèm.

## Requirements
- Functional:
  - Cấu trúc cột Master chuẩn:
    - B: STT (đánh số liên tục từ 1 đến N).
    - C: GLV.
    - D:E: Gộp (Thực trạng Doanh nghiệp).
    - F:H: Gộp (Hướng xử lý).
    - I: Ý kiến khách hàng.
    - Giữ nguyên chiều rộng cột của template Master (không lấy từ nguồn).
  - Quy tắc đặt Chiều cao hàng & Chèn ảnh:
    - Gán `row.height = calculatedHeight` **TRƯỚC KHI** gọi lệnh `addImage()`.
    - Thêm ảnh vào workbook bằng `masterWb.addImage({ buffer, extension })`.
    - Đặt ảnh neo tại ô D với tọa độ giới hạn trong D:E, giữ nguyên tỷ lệ khung hình.
    - Tuyệt đối không để ảnh vượt quá hàng trống hoặc đè lên hàng tiếp theo.
  - Quy tắc hàng trống ngăn cách:
    - Sau mỗi lưu ý: chèn đúng **1 hàng trống** có chiều cao `12.75 pt`.
    - Hàng trống tiếp tục được gộp D:E và F:H, giữ hệ thống viền chuẩn.
  - Dòng Người thực hiện:
    - Khi thay đổi KTV hoặc ở cuối nhóm: chèn dòng `Người thực hiện: [Họ tên] - SĐT: [Số]`.
    - Gộp D:E, font Cambria 10, đậm, nghiêng, gạch chân.
    - Sau đó chèn 1 hàng trống `12.75 pt`.
  - Giữ lại các sheet phụ:
    - Đọc các sheet đính kèm ngoài sheet B410 và copy nguyên vẹn sang Master.
  - Xuất file `.xlsx` hiện đại bằng `masterWb.xlsx.writeFile(outputPath)`.
- Non-functional:
  - Không sử dụng Excel COM trong bước này. Toàn bộ Render chạy bằng JavaScript tốc độ < 1 giây.

## Architecture
```
B410NormalizedIssue[] ──► B410Renderer ──► Master Workbook (ExcelJS)
                              ├─ Clear old data (A12+)
                              ├─ Render Issue Rows (Col B..I)
                              ├─ Set row.height BEFORE addImage
                              ├─ Place image in D:E
                              ├─ Render Blank Row (12.75pt, Merged, Bordered)
                              ├─ Render Performer Footer (Cambria 10, Bold, Italic, Underline)
                              └─ Copy Extra Sheets & Save .xlsx
```

## Related Code Files
- Create: `src/domain/workingpaper/b410/B410Renderer.ts`
- Modify: `src/domain/workingpaper/b410/B410Consolidator.ts`
- Modify: `src/main/index.ts`

## Implementation Steps
1. Xây dựng `B410Renderer.ts` với hàm `renderMasterB410(...)`.
2. Cập nhật `B410Consolidator.ts` để kết nối Pipeline `Parser -> Normalizer -> Renderer`.
3. Kiểm tra tích hợp với IPC Electron.

## Success Criteria
- [x] Xuất file `.xlsx` chuẩn mở được trên Microsoft Excel mà không có bất kỳ cảnh báo nào.
- [x] Không có ảnh đè nát chữ, chiều cao hàng tự động mở rộng theo ảnh.
- [x] Cấu trúc 4 cột merge D:E và F:H hoàn toàn thẳng tắp.
- [x] Sau mỗi mục là đúng 1 hàng trống cao 12.75pt.
