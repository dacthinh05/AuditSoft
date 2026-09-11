# Phase 3: Excel G353/G453 Fill

## Overview

- Priority: P1, Status: Pending
- Điền breakdown 641/642 theo tháng vào sheet phân tích của file G200-300-400 (tên dự kiến G353/G453).

## Key Insights

- Template do người dùng cấp lúc chạy, không có trong repo; mọi filler hiện tại đều `getWorksheet` + guard `if (ws)` nên sheet vắng thì bỏ qua êm.
- Layout theo ảnh: dòng header chứa `Tháng`, các dòng tháng 1–12 ở cột đầu, dòng `Cộng`; cột TK 4 số động + `Tổng`/`Doanh thu`/`Tỷ lệ`.
- Sheet nào là 641/sheet nào là 642 chưa chắc: **nhận diện bằng nội dung header** (quét thấy `641`/`642`), không phụ thuộc tên sheet.

## Requirements

- Thử các alias `G353`/`G 353` và `G453`/`G 453`; sheet nào vắng thì bỏ qua, không throw.
- Dò dòng header (chứa `Tháng`), map cột: header khớp `/64\d{2}/` → cột TK; header chứa `Tổng`, `Doanh thu`, `Tỷ lệ` → cột tương ứng.
- Dò dòng tháng theo cột đầu = 1–12, dòng `Cộng` theo chữ `Cộng`.
- Ghi giá trị số (tỷ lệ ghi số thập phân, không ghi công thức → không `#DIV/0!`); style bằng helpers `styleCellAmount` hiện có.
- Dùng `analyzeTransactions` từ phase 2, không viết lại logic cộng dồn.

## Architecture

- `src/domain/workingpaper/fillers/G200_ExpenseFiller.ts`: thêm mục 7–8 sau G490, gọi helper nội bộ `fillMonthlyExpenseSheet(ws, prefix)`; helper nhận diện prefix qua nội dung sheet khi cả 2 sheet đều mở được.
- Không đổi `SectionFillResult`; sheet vắng không push vào `sheetsUpdated` (đúng convention các filler khác).

## Related Code Files

- Modify: `src/domain/workingpaper/fillers/G200_ExpenseFiller.ts`
- Create: `tests/g353-g453-fill.test.ts` (workbook mock in-memory bằng exceljs, dựng đúng layout ảnh)

## Implementation Steps

1. Viết helper dò header/cột/dòng theo nội dung.
2. Viết `fillMonthlyExpenseSheet` dùng `analyzeTransactions`.
3. Móc vào `fillExpenseWorkingPaper` sau G490.
4. Test mock: giá trị tháng đúng ô, tỷ lệ đúng, tháng DT=0 không lỗi, sheet vắng không throw.
5. Ghi chú câu lệnh kiểm tra sheet thật: mở file mẫu, liệt kê `wb.worksheets.map(w => w.name)`.

## Todo List

- [x] Helper dò layout theo nội dung
- [x] Fill + móc vào G200 filler
- [x] Test workbook mock + case sheet vắng
- [x] Hướng dẫn xác minh trên file thật

## Success Criteria

- Test mock: đúng ô đúng số, đúng tỷ lệ, êm khi thiếu sheet.
- Chạy với file thật có sheet: `sheetsUpdated` chứa G353/G453; không sheet: kết quả cũ không đổi.

## Risk Assessment

- Layout file thật lệch ảnh (tên cột khác): mitigation là match chứa chuỗi (`includes`) + fallback bỏ qua; vòng verify trên file thật sẽ lộ và sửa trong 1 iteration.
- Ghi đè công thức sẵn của user: mitigation chỉ ghi vùng giá trị tháng/Tổng/DT/Tỷ lệ đã dò được, không đụng dòng khác.

## Security Considerations

- Đọc/ghi file local do user chọn; không thay đổi gì ngoài 2 sheet mục tiêu.

## Next Steps

- Phase 4 verify toàn bộ + smoke trên file thật cùng user.
