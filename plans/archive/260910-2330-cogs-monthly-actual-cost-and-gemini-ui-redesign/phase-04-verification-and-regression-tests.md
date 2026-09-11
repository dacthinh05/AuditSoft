# Phase 4: Kiểm Thử, Viết Regression Tests & Nghiệm Thu

## 1. Mục Tiêu
- Bổ sung các unit test case trong `tests/cogs-12m-matrix.test.ts` để kiểm tra:
  + Tính toán chính xác `prodCostToRevenuePct` cho các tháng có phát sinh CPSX và doanh thu (kể cả khi 632 = 0).
  + Kiểm tra tính toán `annualProdCostToRevenuePct` cho cả năm.
  + Kiểm tra logic cờ cảnh báo dồn giá vốn cuối năm (`isLumpSumYearEnd`).
- Bổ sung unit test case trong `tests/gemini-prompt.test.ts` để kiểm tra:
  + Dữ liệu Ma trận giá vốn và cảnh báo dồn cuối năm được đưa đầy đủ vào prompt VSA 520 gửi cho Gemini.
  + Đảm bảo prompt không rò rỉ thông tin nhạy cảm (tuân thủ khử định danh).
- Chạy toàn bộ test suite `npx vitest run` đảm bảo không có test nào bị fail.
- Chạy `npm run typecheck` đảm bảo 100% sạch lỗi TypeScript.

## 2. Các Tệp Tin Thay Đổi
- `tests/cogs-12m-matrix.test.ts`
- `tests/gemini-prompt.test.ts`

## 3. Tiêu Chí Hoàn Thành (Pass Criteria)
- Tất cả unit tests trong `tests/cogs-12m-matrix.test.ts` và `tests/gemini-prompt.test.ts` pass 100%.
- Toàn bộ test suite chạy thành công không có lỗi hồi quy (no regressions).
