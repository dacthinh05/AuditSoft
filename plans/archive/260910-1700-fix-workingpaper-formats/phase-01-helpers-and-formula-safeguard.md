# Phase 01: Core Helpers, Bảo Vệ Công Thức & Chuẩn Hoá Style Bảng Kẻ

## Mục Tiêu
Nâng cấp `src/domain/workingpaper/helpers.ts` để:
1. Không bao giờ xoá trắng công thức hợp lệ trong template (kể cả liên kết dạng `[N]ADD!`).
2. Hỗ trợ tìm sheet linh hoạt (`findWorksheetFuzzy`) không phân biệt khoảng trắng hay hoa thường (`D 353` khớp `D353`, `E 141` khớp `E141`).
3. Chuẩn hoá các hàm gán style (`styleCellAmount`, `styleCellText`, `styleCellCode`, `styleCellDate`) để luôn có viền mỏng (`thin border`) và kế thừa font của sheet, không phá hỏng giao diện in ấn.

## Chi Tiết Công Việc

1. **Sửa `normalizeWorkbookSharedFormulas` trong `src/domain/workingpaper/helpers.ts`**:
   - Chỉ dọn dẹp các công thức thực sự bị lỗi cú pháp không parse được hoặc shared formula mồ côi.
   - Nếu công thức chứa tham chiếu ngoài `[N]Sheet!Cell`, chuyển thành tham chiếu nội bộ `Sheet!Cell` nếu `Sheet` tồn tại trong workbook (ví dụ: `[1]ADD!F1` $\rightarrow$ `ADD!F1`, `[22]ADD!F1` $\rightarrow$ `ADD!F1`).
   - Tuyệt đối không thay công thức bằng `null` khi `val.result` chưa có.

2. **Thêm hàm `findWorksheetFuzzy(wb: ExcelJS.Workbook, candidateNames: string[]): ExcelJS.Worksheet | undefined`**:
   - Chuẩn hoá tên sheet bỏ khoảng trắng, dấu gạch dưới, gạch ngang, chuyển về chữ thường để dò tìm.

3. **Nâng cấp `styleCellAmount`, `styleCellText`, `styleCellCode`, `styleCellDate`**:
   - Bổ sung tham số tuỳ chọn `withBorder = true`.
   - Thiết lập đường viền mỏng `#D1D5DB` (hoặc `thin`) cho 4 cạnh ô.
   - Nếu ô hoặc dòng đã có font sẵn, giữ nguyên font family và font size; chỉ đổi bold/italic hoặc numFmt/alignment.

## Kiểm Thử Phase 01
- Viết / chạy unit test kiểm tra `findWorksheetFuzzy` và `normalizeWorkbookSharedFormulas`.
- Đảm bảo `npm run typecheck` pass.
