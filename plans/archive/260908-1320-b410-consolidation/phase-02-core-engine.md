---
phase: 2
title: "Core Engine (Block-based Merge)"
status: pending
priority: P1
effort: "2d"
dependencies: [1]
---

# Phase 2: Core Engine (Block-based Merge)

## Overview
Xây dựng logic gộp B410 lõi trên backend/Node.js, gọi tiến trình COM (từ kết quả của Phase 1). Engine này sẽ chịu trách nhiệm phân tích form B410 (Dòng 1 đến 11 là header, từ dòng 12 là dữ liệu), phân rã các lỗi theo "Khối" (Block) dựa vào mã Giấy Làm Việc.

## Requirements
- Functional: 
  - Không phá vỡ mã lỗi gốc ở Cột A (Ví dụ: G140.1).
  - Tự động thêm cột "TT tổng hợp" và cột "Nguồn (Người lập/File)" vào file Master.
  - Xử lý mảng (Array) các file input một cách tuần tự (Sequential) để chống treo hệ thống.
- Non-functional: Timeout xử lý không quá 30s mỗi file.

## Architecture
- `WorkingPaperGenerator` hoặc một service chuyên trách `B410Consolidator`.
- Khởi tạo File Master từ 1 file Template chuẩn. Viết Node.js child_process (Spawn PowerShell/Python) để đẩy tuần tự mảng file gốc vào.

## Related Code Files
- Create: `src/domain/workingpaper/b410/B410Consolidator.ts`
- Create: `src/domain/workingpaper/b410/B410ComWorker.ps1` (hoặc C#/.NET tool đi kèm nếu cần tốc độ, nhưng ưu tiên PowerShell/JS COM).
- Modify: N/A

## Implementation Steps
1. **Lọc Master Header:** Chuẩn bị file Master B410 với 2 cột mới (TT Master, Nguồn).
2. **Xác định Block:** Tại file nguồn, quét cột A từ dòng 12 xuống. 
   - Điểm bắt đầu Block: Dòng có chứa text định dạng mã lỗi (Ví dụ: Chứa chữ & số).
   - Điểm kết thúc Block: Dòng liền trước mã lỗi tiếp theo, hoặc khi hết dữ liệu (dấu hiệu footer).
3. **Copy Block (COM):** Thực hiện copy từng Block bằng `Range.Copy`. 
4. **Paste & Gắn Tracking:** Paste vào cuối bảng Master. Tại dòng đầu tiên của khối vừa paste, ghi số TT tổng hợp mới và ghi tên Người Lập (trích xuất từ dòng "Thực hiện: ..." ở đầu bảng hoặc từ tên file).
5. **Copy Shapes:** Copy các shape gắn liền với Block đó nếu cần thiết (theo kết luận từ Phase 1).
6. **Copy Sheet Phụ:** Quét các sheet khác ngoài sheet "B410", nếu có dữ liệu, dùng `Worksheet.Copy` sang Master. Đổi tên theo rule: `[Tên TV]_[Tên Sheet Gốc]`, cắt độ dài < 31 chars, lọc ký tự cấm `\ / ? * [ ] :`.

## Success Criteria
- [x] Logic nhận diện đúng khối lỗi (dù lỗi đó chiếm 2, 3 hay 5 dòng).
- [x] Hai lỗi của 2 người khác nhau được nối vào nhau hoàn hảo trong file Master, có cột chỉ định Nguồn.
- [x] Form gốc, mã Giấy LV không bị mất. Cột TT tổng hợp tịnh tiến đúng từ 1 đến N.

## Risk Assessment
- Rủi ro: Khó nhận dạng chính xác dòng Footer của bảng nếu form biến thể quá nhiều.
- Khắc phục: Quét dựa trên cột B/C (Thực trạng). Nếu 5 dòng liên tiếp trống rỗng ở các cột nội dung, đánh dấu là EOF (End of File) để bỏ qua phần ký tá bên dưới.