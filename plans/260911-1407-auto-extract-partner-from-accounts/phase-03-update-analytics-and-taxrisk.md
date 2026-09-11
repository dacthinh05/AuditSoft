---
id: "phase-03"
name: "Cập nhật phân hệ Phân tích Pareto và Quét rủi ro thuế NĐ 181"
plan: "plans/260911-1407-auto-extract-partner-from-accounts/plan.md"
status: "pending"
---

# Pha 3: Cập nhật phân hệ Phân tích Pareto và Quét rủi ro thuế NĐ 181

## 1. Mục Tiêu
Đảm bảo các phân hệ phân tích sử dụng trực tiếp kết quả bóc tách đối tác mới để hiển thị và tính toán chuẩn xác.

## 2. Các Bước Thực Hiện
1. **`ConcentrationAnalyzer.ts` (Phân tích tỷ trọng Pareto Top KH & Top NCC)**:
   - Khi gom nhóm doanh thu (Có 511) và mua hàng/chi phí (Nợ 15x, 6xx / Có 331):
     * Nếu `objectCode` hoặc `customerName` đã được bóc tách $\rightarrow$ Sử dụng làm khóa gom nhóm chính xác.
     * Tránh việc gom dồn vào `NCC_LE` hay `KH_LE` khi tài khoản đã ghi rõ `3311ABC`.
2. **`CashTaxRiskScanner.ts` (Rà soát chi tiền mặt rủi ro NĐ 181)**:
   - Trong thuật toán gom cụm chia nhỏ phiếu chi cùng ngày (`SPLIT_SAME_DAY`):
     * Khóa gom cụm hiện tại là `dateNormalized | partnerIdent`.
     * Khi tài khoản Có 111 đối ứng Nợ `3311ABC`, `partnerIdent` sẽ nhận diện đúng là `ABC` (hoặc tên công ty từ CDFS).
     * Nhờ đó phát hiện chính xác các bút toán chi tiền mặt cùng ngày cho cùng 1 nhà cung cấp dù sổ không có cột mã đối tượng riêng.
3. **`ParetoQuery.ts` & SQL Engines (nếu dùng DuckDb / In-Memory)**:
   - Đồng bộ cột `partner_code` và `partner_name` đã bóc tách.

## 3. Tiêu Chí Nghiệm Thu
- [ ] Bảng Top Nhà Cung Cấp hiển thị danh sách các đối tác bóc tách được (vd `ABC`, `XYZ`, `DBL`...).
- [ ] Cụm rủi ro xé phiếu chi tiền mặt gom nhóm chính xác theo từng nhà cung cấp.
