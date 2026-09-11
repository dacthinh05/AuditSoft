# Plan: Nâng Cấp Hệ Thống Rà Soát Rủi Ro Thuế Toàn Diện & Tổng Hợp Chi Phí Loại Trừ Chỉ Tiêu B4 QTT 03/TNDN

## 1. Bối Cảnh & Vấn Đề (Problem Statement)
Module **#04: Rà Soát Rủi Ro Thuế & B4 QTT 03/TNDN** hiện tại mới chỉ quét duy nhất một hành vi: **Chi tiền mặt vi phạm điều kiện thanh toán qua ngân hàng (Nghị định 181/2025 và NĐ 209/2013)**.
Trong thực tế kiểm toán và quyết toán thuế TNDN, cơ quan thuế loại trừ chi phí tính thuế tại **Chỉ tiêu B4** ở nhiều chuyên đề rủi ro khác:
1. **Tiền phạt vi phạm hành chính, phạt chậm nộp thuế, vi phạm hợp đồng (TK 811)**: Theo Điều 4 Thông tư 96/2015/TT-BTC, 100% các khoản phạt vi phạm hành chính không được trừ vào chi phí tính thuế TNDN.
2. **Chi phí không có hóa đơn, chứng từ hợp pháp / Chi phí mua hàng lẻ (TK 641, 642, 627, 154)**: Không có số hóa đơn, chứng từ chi không hợp lệ.
3. **Chi phí trang phục, phúc lợi, hiếu hỉ vượt trần**: Vượt quá 5 triệu đồng/người/năm (bằng tiền mặt) hoặc chi phúc lợi vượt quá 1 tháng lương bình quân thực tế.
4. **Chi phí lãi vay vượt trần 30% EBITDA (Nghị định 132/2020/NĐ-CP)**: Doanh nghiệp có giao dịch liên kết.

## 2. Mục Tiêu (Outcome)
Mở rộng module #04 thành **Hệ thống Quét Toàn Diện 5 Chuyên Đề Rủi Ro Thuế & Tổng Hợp B4**:
- Quét tự động sổ NKC theo 5 nhóm rủi ro chuẩn mực kế toán và thuế Việt Nam.
- Tổng hợp bảng kê chi tiết và tổng hợp số tiền điều chỉnh tăng thu nhập chịu thuế tại **Chỉ tiêu B4 Tờ khai QTT 03/TNDN**.
- Bổ sung bộ lọc phân loại chuyên đề (Filter Tabs) trên giao diện.
- Xuất file Excel Báo cáo Rà soát Rủi ro Thuế & Phụ lục B4 chuyên nghiệp đính kèm hồ sơ kiểm toán.

- [x] **Phase 1: Nâng cấp Domain Engine `CashTaxRiskScanner` thành `ComprehensiveTaxRiskScanner`**
  - Mở rộng types (`src/domain/analytics/types.ts`): Bổ sung các nhóm rủi ro `PENALTY_811`, `NO_INVOICE`, `WELFARE_OTHER`.
  - Mở rộng thuật toán quét trong `src/domain/analytics/CashTaxRiskScanner.ts`:
    - Quét phạt VPHC trên TK 811 (diễn giải: phạt, truy thu, chậm nộp, vi phạm giao thông, phạt thuế...).
    - Quét chi phí không hóa đơn trên 641, 642, 627.
    - Tích hợp chi tiền mặt >= 5tr (NĐ 181) và chia nhỏ cùng ngày.
    - Tính tổng số tiền loại trừ Chỉ tiêu B4 theo từng nhóm và toàn bộ.

- [x] **Phase 2: Nâng cấp UI `TaxRiskScannerPage.tsx` — Chuyên Đề & Bộ Thẻ KPI B4**
  - Thêm thanh tab chuyên đề rủi ro: `Tất cả vi phạm`, `Chi tiền mặt >= 5tr`, `Chia nhỏ cùng ngày`, `Phạt VPHC (811)`, `Không hóa đơn`.
  - Nâng cấp 4 thẻ KPI:
    - Thẻ 1: Tổng chi phí không được trừ (B4)
    - Thẻ 2: Thuế TNDN dự kiến tăng thêm (20%)
    - Thẻ 3: Chi tiền mặt vi phạm (NĐ 181)
    - Thẻ 4: Tiền phạt & chi phí loại trừ khác
  - Cập nhật badge nhận diện loại rủi ro trên từng dòng bảng kê.

- [x] **Phase 3: Nâng cấp Export Excel Báo Cáo Rủi Ro Thuế & B4 (`exportTaxRiskExcel.ts`)**
  - Sheet 1: Bảng tổng hợp các khoản chi phí không được trừ theo từng sắc thuế / chuyên đề (Chỉ tiêu B4).
  - Sheet 2: Danh sách chi tiết các bút toán vi phạm kèm căn cứ pháp lý (Thông tư 96, NĐ 181, NĐ 132).

- [x] **Phase 4: Kiểm thử, Typecheck & Nghiệm thu**
  - Viết unit test cho engine quét toàn diện rủi ro thuế (`tests/comprehensive-tax-risk.test.ts`).
  - Chạy `npx tsc -p tsconfig.web.json --noEmit` & `vitest run`.
