# Nhật Ký: Lập Kế Hoạch Bảng Phân Tích Đối Ứng (D390, E290) & Tự Động Hóa Bút Toán AJE (x41 & CHITIETDC)

**Ngày thực hiện:** 2026-09-11
**Mục tiêu:** Xây dựng kế hoạch thực hiện 4 pha để hoàn thiện tính năng sinh Giấy làm việc (GLV) trên tinh thần bảo tồn tính khả dụng hiện tại, tập trung vào đối ứng D390/E290 và luồng bút toán AJE.

## Các Hạng Mục Kế Hoạch Đã Soạn Thảo

1. **Thư mục kế hoạch:** `plans/260911-1045-wp-counterparts-and-all-ajes/`
2. **Các tài liệu pha chi tiết:**
   - `plan.md`: Tài liệu tổng quan kiến trúc, sơ đồ luồng dữ liệu Mermaid, và quản lý rủi ro non-regression.
   - `phase-01-d390-e290-counterparts.md`: Phân tích đối ứng 3 số Đợt 1 và Cả năm cho TK 131 (`D 390`) và TK 331 (`E290`).
   - `phase-02-fill-aje-sheets.md`: Xây dựng `OpenXmlPackageEditor.fillAjeSheet` và đổ AJE vào `D341`, `E241`, `E341`, `E441`.
   - `phase-03-master-chitietdc-and-leadsheet-adj.md`: Đổ 100% AJE vào Master `CHITIETDC` và liên kết Cột 5 (NetAdj) $\rightarrow$ Cột 6 (Sau KT) trên các bảng Leadsheet `*10`.
   - `phase-04-verification-and-testing.md`: Kịch bản kiểm thử tự động Vitest và kiểm thử mở thực tế trên Microsoft Excel COM.

3. **Kiểm tra trạng thái hệ thống:**
   - `npm run typecheck`: 0 lỗi.
   - Vitest suite `tests/unit/counterpartExtractor.test.ts`: Passed 100%.
