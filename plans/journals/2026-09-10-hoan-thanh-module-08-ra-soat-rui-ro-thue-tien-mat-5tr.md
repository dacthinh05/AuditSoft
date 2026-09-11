# Journal: Hoàn Thành Phân Hệ #08 Rà Soát Rủi Ro Chi Phí Thuế (Ngưỡng Tiền Mặt 5 Triệu Mới NĐ 181/2025 & 20 Triệu Cũ)

- **Date**: 2026-09-10
- **Author**: AuditSoft Engineering
- **Plan**: `plans/260910-0946-cash-tax-risk-scanner-5m` (Status: Completed, 4/4 phases)

## 1. Vấn Đề Được Giải Quyết
- Người dùng phản hồi: thẻ lộ trình module #08 ghi cứng mốc ">= 20 triệu" là chưa ổn, vì theo quy định mới (Nghị định 181/2025/NĐ-CP & Luật Thuế GTGT 2024), các khoản chi tiền mặt $\ge 5$ triệu đồng đã là rủi ro bị loại thuế GTGT đầu vào và không được tính vào chi phí được trừ khi quyết toán thuế TNDN (phải điều chỉnh tăng tại Chỉ tiêu B4 trên Tờ khai 03/TNDN).
- Cần xây dựng hoàn chỉnh phân hệ này thành module hoạt động thực tế (`active`) để kiểm toán viên rà soát ngay trên sổ Nhật ký chung.

## 2. Các Thay Đổi Kỹ Thuật Đã Triển Khai
1. **Chuẩn Hóa Pháp Lý & Điều Hướng (`modulesRegistry.ts`, `navigationSlice.ts`, `App.tsx`)**:
   - Chuyển `tax_risk_scanner` (#08) sang trạng thái `active` với badge `QUY ĐỊNH MỚI NĐ 181`.
   - Bổ sung `ViewKey 'taxrisk'` và route trang `TaxRiskScannerPage`.
   - Bổ sung module lộ trình 2026-2027 `ai_audit_copilot` (#09) để bảo toàn tiêu chuẩn kiểm thử.
2. **Xây Dựng Engine Thuần Nghiệp Vụ (`CashTaxRiskScanner.ts`)**:
   - Quét chứng từ tiền mặt đơn lẻ $\ge 5.000.000$ đ (hoặc $\ge 20.000.000$ đ theo quy định cũ).
   - Thuật toán gom nhóm phát hiện chia nhỏ / xé phiếu chi trong ngày cho cùng 1 nhà cung cấp có tổng $\ge$ ngưỡng.
   - Loại trừ an toàn các bút toán luân chuyển tiền nội bộ (Nợ 112 / Có 111: nộp tiền ngân hàng, Nợ 111 / Có 111).
   - Tự động tính toán tổng số tiền rủi ro, ước tính điều chỉnh tăng Chỉ tiêu B4 và thuế TNDN tăng thêm tạm tính ($20\% \times \text{B4}$).
3. **Giao Diện Phân Hệ #08 Chuẩn Enterprise SaaS (`TaxRiskScannerPage.tsx`)**:
   - Thanh chuyển đổi ngưỡng quét linh hoạt 1-click: `Mới >= 5 triệu`, `Cũ >= 20 triệu`, `Tùy chỉnh`.
   - Bộ 4 thẻ KPI tóm tắt sắc nét, zero emoji: Tổng tiền vi phạm, Chi phí B4, Thuế TNDN tăng thêm (20%), Số chứng từ vi phạm.
   - Bảng kê chi tiết từng dòng bút toán vi phạm (STT, Ngày CT, Số CT, Nhà cung cấp, Diễn giải, Định khoản, Số tiền, Phân loại rủi ro, Khuyến nghị B4).
   - Chức năng **Xuất Excel Bảng Kê Rủi Ro Thuế & B4** (`exportTaxRiskExcel.ts`) bằng ExcelJS, tải trực tiếp file `.xlsx` phục vụ hồ sơ kiểm toán.

## 3. Nghiệm Thu & Kiểm Thử
- **Unit Tests**: 100% (60/60 test files passed, 300/300 tests passed).
  - `tests/cash-tax-risk-scanner.test.ts`: 5 test cases kiểm chứng đơn lẻ 5M, 20M, gom cụm cùng ngày, khác ngày, loại trừ nộp ngân hàng.
  - `tests/export-tax-risk-excel.test.ts`: 1 test case kiểm chứng tạo workbook và các trường dữ liệu Excel.
  - `tests/hub-navigation.test.ts`: Đạt 8 active modules và ánh xạ đúng viewKey.
- **TypeScript Typecheck**: 0 errors across all tsconfigs.
- **ESLint**: 0 errors, 0 warnings.
- **Production Build**: Hoàn tất biên dịch Vite, Node & Workers trong 13s.
