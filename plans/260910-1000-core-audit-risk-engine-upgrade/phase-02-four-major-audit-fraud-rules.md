# Phase 2: Four Major Audit Fraud Rules (4 Bẫy Kiểm Toán & Gian Lận Cốt Lõi)

## 1. Mục Tiêu
Xây dựng 4 audit rules chuyên sâu mới theo chuẩn mực kiểm toán Việt Nam (VSA 240, VSA 330, VSA 520) trong thư mục `src/main/risks/rules/` và đăng ký vào `defaultRiskRules()`.

## 2. Chi Tiết 4 Bẫy Kiểm Toán Mới
1. **Rule 1: Bẫy Quỹ Tiền Mặt Ảo (`VIRTUAL_CASH_EXCESSIVE_DEBT`)**:
   - **Bản chất**: Doanh nghiệp duy trì dòng tiền mặt dồi dào trên sổ sách (phát sinh Nợ/Có TK 111 hàng chục tỷ) nhưng đồng thời lại phát sinh chi phí lãi vay ngân hàng lớn (Nợ TK 635 $\ge 50$ triệu) hoặc nợ vay ngân hàng lớn (TK 341).
   - **Ý nghĩa kiểm toán**: Quỹ tiền mặt "ảo" trên sổ sách nhưng thực tế đã bị rút ra cho chủ doanh nghiệp/cổ đông mượn. Doanh nghiệp thiếu vốn lưu động thực tế nên phải vay ngân hàng chịu lãi. Rủi ro bị loại chi phí lãi vay tương ứng với phần tiền mặt nhàn rỗi theo Thông tư 96/2015/TT-BTC.
   - **Mức độ**: `HIGH`.

2. **Rule 2: Cặp Tài Khoản Đối Ứng Bất Thường / Cấm (`PROHIBITED_UNUSUAL_PAIRS`)**:
   - **Bản chất**: Quét toàn bộ sổ NKC để phát hiện các cặp định khoản vi phạm nguyên tắc kế toán hoặc tiềm ẩn rủi ro rất cao:
     - `Nợ 211, 213, 217 / Có 111` ($\ge 20$ triệu): Mua TSCĐ thanh toán bằng tiền mặt.
     - `Nợ 642, 811 / Có 131`: Xóa sổ nợ phải thu khách hàng trực tiếp vào chi phí mà không qua trích lập dự phòng (TK 2293) và không có hồ sơ pháp lý xóa nợ.
     - `Nợ 331 / Có 711`: Xóa nợ phải trả người bán vào thu nhập khác bất thường.
     - `Nợ 111 / Có 511` ($\ge 50$ triệu): Thu tiền mặt bán hàng số lượng lớn không qua công nợ hoặc kiểm soát hóa đơn.
   - **Mức độ**: `CRITICAL` hoặc `HIGH`.

3. **Rule 3: Bút Toán Đảo / Ghi Âm Doanh Thu (`ABNORMAL_REVENUE_REVERSAL`)**:
   - **Bản chất**: Phát hiện các bút toán:
     - `Có TK 511` có số tiền $< 0$ (ghi âm doanh thu).
     - `Nợ TK 511` đối ứng với các tài khoản bất thường (không phải TK 521 chiết khấu/giảm giá, và không phải TK 911 kết chuyển).
   - **Ý nghĩa kiểm toán**: Thủ thuật ghi giảm doanh thu ngoài quy trình, hủy hóa đơn không hợp lệ hoặc điều chỉnh hồi tố để trốn thuế TNDN.
   - **Mức độ**: `HIGH`.

4. **Rule 4: Bẫy Treo Chi Phí Giấu Lỗ (`EXPENSE_PARKING_TRAP`)**:
   - **Bản chất**: Phát hiện các khoản chi phí phát sinh lớn bị "gửi gắm" (treo) vào các tài khoản tài sản tạm thời thay vì đưa vào kết quả kinh doanh trong kỳ:
     - Phát sinh Nợ TK 242 (Chi phí trả trước) hoặc Nợ TK 241 (XDCB dở dang) chiếm tỷ trọng bất thường so với tổng chi phí hoạt động (6xx).
     - Dấu hiệu làm đẹp BCTC, giấu lỗ để vay vốn ngân hàng hoặc đấu thầu.
   - **Mức độ**: `MEDIUM` hoặc `HIGH`.

## 3. Cấu Trúc File & Tích Hợp
- Tạo mới file `src/main/risks/rules/FraudAuditRules.ts`.
- Export 4 rules và đăng ký vào `src/main/risks/rules.ts` (`defaultRiskRules`).
- Bổ sung các helpers tính toán cần thiết vào `src/main/analytics/JournalAnalyticsEngine.ts` (ví dụ `detectExcessiveCashWithDebt`, `detectProhibitedPairs`, `detectNegativeRevenueEntries`).

## 4. Tiêu Chí Nghiệm Thu
- [x] 4 rules mới được kích hoạt trơn tru trong pipeline chạy rủi ro.
- [x] Bắt trúng các mẫu dữ liệu thực tế: bút toán ghi âm 511, cặp 642/131, quỹ tiền mặt lớn khi có vay nợ.
- [x] Không gây ảnh hưởng xấu tới hiệu năng chạy phân tích (O(n) qua Map).
