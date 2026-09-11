# Phase 2: Domain Cash Tax Risk Engine (Thuật Toán Quét Rủi Ro Chi Tiền Mặt & B4)

## 1. Mục Tiêu
Xây dựng engine thuần nghiệp vụ kiểm toán `CashTaxRiskScanner` tại `src/domain/analytics/CashTaxRiskScanner.ts` để phân tích toàn bộ sổ Nhật ký chung (NKC), phát hiện các khoản chi tiền mặt vi phạm điều kiện thanh toán không dùng tiền mặt theo mốc 5 triệu mới (Nghị định 181/2025) và 20 triệu cũ (Nghị định 209/2013), ước tính giá trị loại trừ Chỉ tiêu B4.

## 2. Quy Tắc Nghiệp Vụ & Thuật Toán
1. **Tiêu chuẩn nhận diện bút toán chi tiền mặt liên quan mua hàng hóa/dịch vụ/chi phí**:
   - `creditAccount` bắt đầu bằng `111` (Tiền mặt: 1111, 1112...).
   - `debitAccount` thuộc các nhóm:
     - Hàng tồn kho: `151, 152, 153, 154, 155, 156, 157, 158`.
     - Tài sản cố định & XDCB: `211, 213, 217, 241`.
     - Chi phí trả trước: `242`.
     - Chi phí hoạt động: `621, 622, 623, 627, 635, 641, 642, 811`.
     - Thanh toán cho người bán: `331`.
     - Thuế GTGT đầu vào: `133, 1331, 1332`.
   - Loại trừ các bút toán luân chuyển tiền nội bộ hợp pháp (Nợ 112 / Có 111: nộp tiền mặt vào ngân hàng).

2. **Hai dạng rủi ro cốt lõi**:
   - **Dạng 1: Chi tiền mặt đơn lẻ $\ge$ Ngưỡng (`SINGLE_OVER_THRESHOLD`)**:
     - Số tiền của 1 chứng từ/dòng bút toán $\ge 5.000.000$ đ (hoặc $\ge 20.000.000$ đ).
     - Ghi chú kiểm toán: *Chi tiền mặt $\ge$ ngưỡng bắt buộc thanh toán qua ngân hàng theo NĐ 181/2025 / Luật Thuế GTGT 2024. Rủi ro bị loại thuế GTGT đầu vào và loại chi phí hợp lý khi quyết toán TNDN (cộng Chỉ tiêu B4).*
   - **Dạng 2: Chia nhỏ / Xé phiếu chi trong ngày cùng nhà cung cấp (`SPLIT_SAME_DAY`)**:
     - Gom nhóm theo cặp khóa `(postingDate + partner/nhà cung cấp)`.
     - Từng phiếu nhỏ hơn ngưỡng, nhưng tổng chi trong ngày cho cùng 1 đối tượng $\ge$ ngưỡng.
     - Ghi chú kiểm toán: *Có dấu hiệu tách nhỏ phiếu chi tiền mặt trong cùng ngày cho cùng 1 nhà cung cấp để lách quy định thanh toán không dùng tiền mặt (tổng trong ngày $\ge$ ngưỡng).*

3. **Tổng hợp & Ước tính ảnh hưởng thuế**:
   - `totalRiskAmount`: Tổng giá trị chi tiền mặt vi phạm.
   - `estimatedB4Adjustment`: Số tiền chi phí dự kiến bị loại trừ khi tính thuế TNDN (điều chỉnh tăng thu nhập chịu thuế tại Chỉ tiêu B4).
   - `estimatedTaxPayableIncrease`: Thuế TNDN dự kiến tăng thêm tạm tính ($20\% \times \text{B4}$).

## 3. Cấu Trúc Types & Files
- Tạo file `src/domain/analytics/CashTaxRiskScanner.ts`.
- Bổ sung types vào `src/domain/analytics/types.ts`:
  - `CashRiskItem`
  - `CashRiskCluster`
  - `CashTaxRiskResult`
- Viết test suite `tests/cash-tax-risk-scanner.test.ts` kiểm chứng:
  - Bút toán đơn lẻ 5 triệu, 20 triệu.
  - Cụm tách hóa đơn trong ngày (ví dụ 3 phiếu chi 2 triệu, tổng 6 triệu $\ge 5$ triệu).
  - Loại trừ bút toán nộp tiền vào ngân hàng (Nợ 112 / Có 111).
  - Khả năng chuyển đổi mốc ngưỡng 5M vs 20M.

## 4. Tiêu Chí Nghiệm Thu
- [x] `CashTaxRiskScanner.scan()` xử lý mượt mà và chính xác dữ liệu mảng `JournalEntry[]`.
- [x] 100% test cases trong `cash-tax-risk-scanner.test.ts` pass.
