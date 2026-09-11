# Phase 1: Mở Rộng Domain Engine & Cấu Trúc Dữ Liệu Bóc Tách Chi Phí

## 1. Mục Tiêu
- Bổ sung cấu trúc dữ liệu cho phép phân tích Giá vốn theo 2 góc nhìn:
  1. `RECORDED_632`: Theo số kế toán kết chuyển Nợ 632.
  2. `INCURRED_CPSX`: Theo tổng chi phí sản xuất đầu vào thực tế (621 + 622 + 627 + 154) hoặc chi phí mua hàng 156.
- Đảm bảo trong `Cogs12MMatrixReport`, mỗi tháng đều tính sẵn:
  + `prodCostToRevenuePct`: Tỷ lệ % Tổng CPSX / Doanh thu 511.
  + `cogsToRevenuePct`: Tỷ lệ % Nợ 632 / Doanh thu 511.
  + Cờ cảnh báo thông minh: Tự động đánh dấu khi doanh nghiệp có hiện tượng dồn giá vốn cuối năm (ví dụ T12 >= 50% tổng giá vốn cả năm và các tháng trước 632 = 0).
- Cập nhật interface `FinancialMetricsPayload` và prompt generator trong `src/main/services/geminiService.ts` để nạp cả dữ liệu bóc tách CPSX hàng tháng và cảnh báo dồn T12 lên Gemini.

## 2. Các Tệp Tin Thay Đổi
- `src/domain/analytics/types.ts`:
  + Bổ sung trường trong `Cogs12MMatrixReport` và `CogsBreakdownMonthRow` (đã có sẵn `prodCostToRevenuePct`, bổ sung thêm `annualProdCostToRevenuePct`, `isLumpSumYearEnd`).
- `src/domain/analytics/FinancialCorrelationEngine.ts`:
  + Hoàn thiện logic tính toán trong `computeCogs12MMatrix`, đảm bảo `prodCostToRevenuePct` phản ánh đúng và chuẩn xác (khi doanh thu > 0).
  + Thêm thông tin tổng kết `annualProdCostToRevenuePct` vào `annualPcts`.
- `src/main/services/geminiService.ts`:
  + Bổ sung trường `cogsMatrix` vào `FinancialMetricsPayload`:
    * `isLumpSumYearEnd: boolean`
    * `monthlyProdCost: number[]`
    * `monthlyCogs632: number[]`
    * `prodCostToRevenuePctByMonth: number[]`
  + Bổ sung phân đoạn phân tích trong prompt VSA 520: hướng dẫn Gemini phát hiện việc doanh nghiệp dồn kết chuyển giá vốn cuối kỳ và đối chiếu với chi phí sản xuất thực phát sinh từng tháng.

## 3. Tiêu Chí Hoàn Thành (Pass Criteria)
- Tất cả các trường dữ liệu được gán đúng giá trị, không có `undefined` hay `NaN`.
- Hàm `computeCogs12MMatrix` trả về tỷ lệ `prodCostToRevenuePct` hợp lệ cho cả 12 tháng khi có doanh thu và chi phí phát sinh.
