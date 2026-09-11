# Phase 01: Xây Dựng Lõi Tính Toán Thống Kê & Phân Phối Dữ Liệu (Domain Profiling Engine)

## 1. Mục Tiêu
Xây dựng module thuần TypeScript `src/domain/profiling/dataProfiler.ts` để phân tích và thống kê dữ liệu sổ cái/chênh lệch kiểm toán chỉ trong 1 lượt duyệt duy nhất O(N). Đảm bảo thời gian tính toán <25ms trên 60.000 dòng dữ liệu thực tế.

## 2. Yêu Cầu Kỹ Thuật & Cấu Trúc Dữ Liệu

### Các chỉ số cần tính toán:
1. **Phân phối theo tháng (Monthly Distribution)**:
   - Thống kê 12 tháng (Tháng 1 đến Tháng 12) gồm: tổng phát sinh, số lượng dòng, số lượng chênh lệch.
   - Điểm nhận diện đột biến ngày khóa sổ 31/12 (`cutoffCount`, `cutoffAmount`).
2. **Phân tầng giá trị (Amount Tier Bucketing)**:
   - Tier 1 (`LOW`): Dưới 50 triệu (các giao dịch thường nhật/nhỏ lẻ).
   - Tier 2 (`MEDIUM`): Từ 50 triệu đến 500 triệu (nghiệp vụ trung bình).
   - Tier 3 (`HIGH`): Từ 500 triệu đến 2 tỷ (nghiệp vụ giá trị lớn).
   - Tier 4 (`KEY_ITEM`): Trên 2 tỷ (các nghiệp vụ trọng yếu cần soát xét kỹ).
3. **Chất lượng dữ liệu & Rủi ro (Data Quality & Risk Flags)**:
   - Số dòng chênh lệch / Tổng số dòng.
   - Số dòng nghiệp vụ tròn số (chia hết cho 10.000.000đ hoặc 100.000.000đ).
   - Top các cặp tài khoản đối ứng có phát sinh lớn nhất.

## 3. Danh Sách File
- **Tạo mới**: `src/domain/profiling/dataProfiler.ts`
- **Tạo mới**: `src/domain/profiling/dataProfiler.test.ts`

## 4. Các Bước Thực Hiện
1. Khai báo các interface: `MonthlyBucket`, `AmountTierBucket`, `ProfileSummary`.
2. Viết hàm `profileDiffRows(rows: DiffRow[]): ProfileSummary`.
3. Viết unit test kiểm thử:
   - Dữ liệu rỗng trả về cấu trúc mặc định an toàn.
   - Tính chuẩn xác số lượng theo 12 tháng.
   - Đếm đúng số lượng và số tiền các giao dịch ngày 31/12.
   - Phân loại đúng các tầng số tiền.
4. Chạy `vitest run src/domain/profiling/dataProfiler.test.ts` để kiểm chứng.
