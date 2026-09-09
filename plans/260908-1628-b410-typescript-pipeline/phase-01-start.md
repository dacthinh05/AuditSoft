---
phase: 1
title: "B410 Parser & Shape/Image Filter"
status: pending
priority: P1
effort: "1h"
dependencies: []
---

# Phase 1: B410 Parser & Shape/Image Filter

## Overview
Xây dựng module `B410Parser.ts` và `B410ShapeFilter.ts` bằng TypeScript sử dụng `exceljs` để đọc các file Excel nguồn, nhận diện sheet B410 linh hoạt, bóc tách các dòng lưu ý và lọc sạch các shape ẩn/rác.

## Requirements
- Functional:
  - Khai báo interface `B410Types.ts` đầy đủ (`B410Issue`, `B410Image`, `B410ParsedFile`, `B410ShapeFilterCriteria`).
  - Hàm nhận diện sheet B410:
    - Chuyển tên sheet về chữ thường, bỏ dấu tiếng Việt, bỏ khoảng trắng và ký tự đặc biệt.
    - Chấp nhận: `saisot&luuy`, `saisotvaluuy`, `b410`, `b410tonghop`, `luuykiemtoan`.
    - Ưu tiên sheet có chứa đồng thời các cột `GLV`, `Thực trạng`, `Hướng xử lý`, `Ý kiến khách hàng`.
  - Hàm lọc shape độc lập (`filterValidShapes`):
    - Loại bỏ: `visible === false`, `width <= 2 || height <= 2`, nằm trên hàng/cột ẩn, nằm ngoài toạ độ dòng dữ liệu, dạng control/button/OLE, ảnh trùng hash/buffer.
    - Giữ lại: ảnh PNG/JPEG hợp lệ, neo tại dòng lưu ý và cột D:E.
  - Trích xuất mỗi lưu ý thành `B410Issue`:
    - Đọc text đầy đủ (kể cả ô gộp D:E hay F:H).
    - Giữ nguyên xuống dòng, dấu gạch đầu dòng, số tiền, ngày tháng, trích dẫn văn bản pháp luật.
    - Đính kèm mảng `images: B410Image[]` đã được lọc.
- Non-functional:
  - Không ném exception làm gián đoạn batch; ghi cảnh báo vào log.

## Architecture
```
[Excel File Buffer] ──► ExcelJS.Workbook ──► Find-B410Sheet
                                                  │
                      ┌───────────────────────────┴───────────────────────────┐
                      ▼                                                       ▼
           [Table Row Scanner]                                      [ws.getImages()]
           ├─ Col B (STT) / Col C (GLV)                                       │
           ├─ Col D:E (Finding)                                               ▼
           ├─ Col F:H (Recommendation)                             [B410ShapeFilter]
           └─ Col I (Customer Comment)                             ├─ Reject rác/hidden/size<=2
                      │                                            └─ Accept valid in D:E
                      └───────────────────────────┬───────────────────────────┘
                                                  ▼
                                            B410Issue[]
```

## Related Code Files
- Create: `src/domain/workingpaper/b410/B410Types.ts`
- Create: `src/domain/workingpaper/b410/B410ShapeFilter.ts`
- Create: `src/domain/workingpaper/b410/B410Parser.ts`

## Implementation Steps
1. Tạo `src/domain/workingpaper/b410/B410Types.ts`: Định nghĩa toàn bộ interfaces cho Pipeline.
2. Tạo `src/domain/workingpaper/b410/B410ShapeFilter.ts`: Viết hàm lọc shape thuần túy không phụ thuộc COM.
3. Tạo `src/domain/workingpaper/b410/B410Parser.ts`: Đọc file bằng ExcelJS, nhận diện sheet, quét bảng và map ảnh vào từng issue tương ứng.

## Success Criteria
- [x] Nhận diện chính xác sheet B410 bất kể tên sheet là `Sai sot & luu y`, `Sai sót & lưu ý`, hay `B410`.
- [x] Bóc tách đầy đủ các mục lưu ý từ file `Cuori` và các file mẫu.
- [x] Lọc sạch 100% các shape rác hoặc shape ẩn.
