# Phase 01: Xây dựng hàm Export Workbook cho Data Profiler & Cutoff

## Mục tiêu
Tạo module xuất Excel chuyên dụng cho Data Profiler và tích hợp vào xuất tổng hợp.

## File tác động
- `src/infrastructure/excel/exportDataProfiler.ts` (mới)
- `src/infrastructure/excel/exportWorkbook.ts`

## Chi tiết thực hiện
1. Viết `exportDataProfiler.ts`:
   - Hàm `buildProfilerWorkbook(summary: ProfileSummary, filteredRows?: DiffRow[], filterDesc?: string): ExcelJS.Workbook`
   - Sheet 1: `Tong hop Phan tich & Cutoff`
     - Tiêu đề kiểm toán chuẩn mực: "BÁO CÁO TRỰC QUAN HÓA DỮ LIỆU & PHÂN TÍCH RỦI RO KHÓA SỔ (DATA PROFILING & CUTOFF)"
     - Bảng 1: Phân tầng rủi ro giá trị (LOW, MEDIUM, HIGH, KEY_ITEM).
     - Bảng 2: Phân bổ dòng tiền 12 tháng (T01-T12).
     - Bảng 3: Nhận diện rủi ro kiểm toán đặc biệt: Cutoff 31/12 và Nghiệp vụ số tiền tròn chẵn (>=10tr).
   - Sheet 2: `Chi tiet chung tu loc` (nếu có bộ lọc tháng / tier / cutoff).
2. Cập nhật `exportWorkbook.ts`:
   - Thêm hàm `writeProfilerSheet(wb, summary)` vào danh sách sheet của `buildReportWorkbook`.
   - Kết quả: file đối chiếu tổng hợp từ 8 sheet nâng lên 9 sheet.

## Tiêu chí nghiệm thu
- Workbook có format đẹp, có định dạng số tiền `#,,##0`, kẻ khung viền chuẩn kiểm toán.
