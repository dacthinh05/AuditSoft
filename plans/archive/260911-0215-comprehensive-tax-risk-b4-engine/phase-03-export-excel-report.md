# Phase 3: Nâng cấp Export Excel Báo Cáo Rủi Ro Thuế & B4 (exportTaxRiskExcel.ts)

## Mục tiêu
Tạo file Excel chuẩn mực phục vụ kẹp vào Giấy làm việc kiểm toán và bộ hồ sơ Quyết toán thuế:
1. **Sheet 1 (`TongHop_ChiPhi_B4`)**:
   - Bảng tổng hợp theo từng chuyên đề:
     1. Chi tiền mặt >= 5 triệu vi phạm TT ngân hàng (NĐ 181/2025).
     2. Tiền phạt vi phạm hành chính, phạt thuế, chậm nộp (Điều 4 TT 96/2015).
     3. Chi phí không có hóa đơn hợp pháp / bảng kê không chuẩn.
     4. Chi phúc lợi / trang phục không hợp lệ.
   - Dòng tổng cộng: Ước tính số tiền điều chỉnh tăng Chỉ tiêu B4 trên Tờ khai 03/TNDN.
2. **Sheet 2 (`ChiTiet_ButToan_ViPham`)**:
   - Toàn bộ danh sách chứng từ với đầy đủ: STT, Ngày, Số CT, NCC, Diễn giải, Định khoản Nợ/Có, Số tiền, Phân loại rủi ro, Căn cứ pháp lý.

## File tác động
- `src/renderer/components/TaxRisk/exportTaxRiskExcel.ts`
