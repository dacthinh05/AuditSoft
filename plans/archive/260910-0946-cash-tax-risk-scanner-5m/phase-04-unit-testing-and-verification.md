# Phase 4: Unit Testing & Verification (Kiểm Thử Độc Lập & Xác Minh Đóng Gói)

## 1. Mục Tiêu
Đảm bảo toàn bộ mã nguồn của phân hệ rà soát rủi ro chi phí thuế #08 được kiểm thử chặt chẽ về mặt nghiệp vụ kế toán - thuế, bảo toàn 100% độ tin cậy của hệ thống, không có bất kỳ regression nào xảy ra với các phân hệ khác.

## 2. Danh Mục Kiểm Thử
1. **Kiểm thử đơn vị Engine (`tests/cash-tax-risk-scanner.test.ts`)**:
   - Quét chứng từ đơn lẻ chi tiền mặt $\ge 5$ triệu: phát hiện Nợ 642 / Có 111 số tiền 7.000.000 đ.
   - Kiểm tra mốc 20 triệu: phát hiện các khoản $\ge 20$ triệu khi bật chế độ 20M.
   - Kiểm tra gom cụm chia nhỏ trong ngày:
     - 3 phiếu chi trong ngày 15/04/2026 cho cùng NCC "Công ty TNHH Vật Tư A" lần lượt là 2tr, 2tr, 1.5tr (tổng 5.5tr $\ge 5$tr) -> nhận diện cụm rủi ro.
     - 2 phiếu chi khác ngày cho cùng NCC -> không bị coi là chia nhỏ trong ngày.
   - Kiểm tra loại trừ: Nợ 112 / Có 111 (Nộp tiền mặt vào tài khoản ngân hàng) không bị báo rủi ro.
   - Kiểm tra tính toán Chỉ tiêu B4 và thuế TNDN tăng thêm (20%).

2. **Kiểm thử Navigation & Registry (`tests/hub-navigation.test.ts`)**:
   - Xác nhận 8 active modules trong registry.
   - Xác nhận module `tax_risk_scanner` trả về đúng viewKey `taxrisk`.

3. **Kiểm thử Xuất Excel (`tests/export-tax-risk-excel.test.ts`)**:
   - Tạo workbook bằng `buildTaxRiskWorkbook`, xác nhận các cột, tiêu đề và số dòng phát sinh.

4. **Kiểm thử Typecheck, Lint & Build**:
   - `npm run typecheck` (0 errors across web, node, tests).
   - `npm run lint` (0 errors, 0 warnings).
   - `npm test` (100% tests pass).
   - `npm run build` (Biên dịch Vite, Node & Workers thành công).

## 3. Tiêu Chí Nghiệm Thu
- [x] Mọi kiểm thử tự động đều đạt kết quả Pass.
- [x] Quá trình build production hoàn tất không có cảnh báo lỗi.
