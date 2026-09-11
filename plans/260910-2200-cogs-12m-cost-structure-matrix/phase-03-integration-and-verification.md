---
phase: 3
title: "Tích hợp vào GlAnalyticsTab, Kiểm Thử Toàn Diện và Hội Tụ Hệ Thống"
status: "pending"
files_modified:
  - "src/renderer/components/Analytics/GlAnalyticsTab.tsx"
  - "tests/cogs-12m-matrix.test.ts"
---

# Phase 3: Tích hợp vào GlAnalyticsTab, Kiểm Thử Toàn Diện và Hội Tụ Hệ Thống

## Mục tiêu
Tích hợp bảng `CogsMatrix12MTable` vào giao diện tab Phân Tích Sổ Cái & Chỉ Số VSA 520, viết test suite tự động hóa kiểm tra độ chính xác của thuật toán bóc tách giá vốn trước kết chuyển 911 và đảm bảo 100% kiểm thử của toàn bộ dự án đều xanh.

## Chi tiết các bước thực hiện:

1. **Tích hợp vào `GlAnalyticsTab.tsx`**:
   - Tính toán `cogsMatrix = useMemo(() => FinancialCorrelationEngine.computeCogs12MMatrix(entries), [entries])` hoặc lấy từ `data.correlations.cogsDetailedMatrix`.
   - Bố trí component `CogsMatrix12MTable` ngay phía dưới biểu đồ Cấu trúc giá vốn (`CogsStructureStackedChart`).
   - Đảm bảo người dùng nhìn thấy Biểu đồ cột chồng phía trên $\leftrightarrow$ Ma trận số liệu chi tiết phía dưới trong cùng một phân khu thống nhất.

2. **Xây dựng Test Suite `tests/cogs-12m-matrix.test.ts`**:
   - Test case 1: Loại bỏ triệt để các bút toán kết chuyển Nợ 911 / Có 632 và Nợ 632 / Có 911.
   - Test case 2: Bóc tách đúng Nợ 621, 622, 627, 154 và Nợ 632 đối ứng Có 155, Có 156 theo đúng 12 tháng.
   - Test case 3: Phát hiện kịch bản thực tế: Tháng 1-11 có phát sinh chi phí và doanh thu nhưng giá vốn = 0, Tháng 12 dồn kết chuyển $\rightarrow$ Cờ `isLumpSumYearEnd` và `isSuspiciousDeferred` được bật chính xác.
   - Test case 4: Tự động phân loại đúng loại hình doanh nghiệp (`MANUFACTURING`, `TRADING`, `HYBRID`).

3. **Chạy toàn bộ chu trình kiểm tra chất lượng**:
   - `npm run typecheck`: 0 lỗi trên toàn bộ TypeScript workspace.
   - `npm run lint`: 0 lỗi ESLint.
   - `npm run test`: Toàn bộ các test suite Vitest pass 100%.
   - `npm run build`: Build production hoàn tất thành công.
