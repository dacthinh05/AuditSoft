# Phase 02: Stepper Theo Bước + Banner Khóa Module + Section Chuẩn NKC

## 1. Mục Tiêu
User mở app là thấy ngay: đang ở bước mấy, cần làm gì tiếp, module nào khóa vì sao, và file NKC phải chuẩn thế nào — tất cả inline, không cần tài liệu ngoài.

## 2. Việc Làm
1. `src/renderer/pages/SetupPage.tsx` — thêm stepper 3 bước trên đầu trang:
   - Bước 1: Nhập NKC TRƯỚC điều chỉnh (trạng thái từ `isBeforeReady`).
   - Bước 2: Nhập NKC SAU điều chỉnh (từ `isAfterReady`).
   - Bước 3: Đối chiếu & dùng các module.
   - Mỗi bước hiển thị Đạt/Chưa đạt + nút cuộn tới thẻ nguồn tương ứng.
2. Component mới `src/renderer/components/ModuleGateBanner.tsx`:
   - Props: `requirement: 'BEFORE' | 'BOTH'`, tự đọc store (`before.cfg/pasted`, `after.cfg/pasted`).
   - Chưa đủ điều kiện → banner vàng: thiếu gì + nút "Về Bước 1/2" (điều hướng về SetupPage); đủ → render `null`.
   - Gắn vào đầu `PreliminaryAnalyticsPage`, `TaxStatsPage`, `SamplingTab` (BEFORE) và `ResultsPage` (BOTH).
3. Component mới `src/renderer/components/NkcSpecSection.tsx` (đặt dưới stepper trong SetupPage):
   - Bảng 6 cột bắt buộc + ví dụ tên cột thường gặp (Ngày CT, Số CT, Diễn giải, TK Nợ, TK Có, Số tiền).
   - 4 quy tắc xử lý dòng (bỏ qua/loại/giữ + gắn cờ) dùng đúng mã `LOI_NGAY, LOI_TIEN, THIEU_TK_NO, THIEU_TK_CO`.
   - Nút "Tải file NKC mẫu" — sinh `.xlsx` tối thiểu tại runtime (dùng `exceljs` đã có trong deps) gồm hàng tiêu đề + 5 dòng ví dụ hợp lệ + 2 dòng lỗi minh họa.
   - Preflight sau khi chọn file nhưng trước khi nhận: gọi `inspectWorkbook` + `standardizeSource` sẵn có, hiện `dataRows / blankRows / zeroOrBadAmountRows / errorRows`; nút "Nhận file" chỉ enable khi `dataRows > 0`.
4. Styling theo `src/renderer/styles.css` hiện tại (Tailwind classes như `DbConnectionModal`), không thêm lib.

## 3. Nghiệm Thu
- Chưa nạp → banner hiện đúng trang, nút điều hướng đúng.
- Nạp BEFORE → banner BEFORE biến mất, banner BOTH còn.
- File mẫu mở được bằng Excel, nạp lại pass preflight.
- `tsc` web 0 lỗi.
