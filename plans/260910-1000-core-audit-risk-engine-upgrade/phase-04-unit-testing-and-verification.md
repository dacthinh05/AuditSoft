# Phase 4: Unit Testing & Verification (Kiểm Thử Toàn Diện & Xác Minh Đóng Gói)

## 1. Mục Tiêu
Bảo đảm toàn bộ hệ thống nhận diện rủi ro sau khi nâng cấp hoạt động chính xác 100%, không bỏ lọt gian lận trọng yếu, không báo động rác, và không làm ảnh hưởng tới bất kỳ tính năng hiện hữu nào (Zero Regression).

## 2. Danh Mục Kiểm Thử Chi Tiết
1. **Kiểm thử Khử Dương Tính Giả (`tests/noise-cleansing.test.ts`)**:
   - Bút toán kết chuyển Nợ 911 / Có 632 và Nợ 511 / Có 911 ngày 31/12 không bị tính vào cụm bất thường cuối kỳ.
   - Khoản mục chi phí tăng từ 1 triệu lên 3 triệu (+200%) nhưng $< \text{CTT}$ không bị nháy đèn đỏ trong `Trend12MAnalyzer`.
   - Bút toán nộp tiền vào tài khoản ngân hàng Nợ 112 / Có 111 không bị coi là chi phí tiền mặt rủi ro.

2. **Kiểm thử 4 Bẫy Kiểm Toán Mới (`tests/fraud-audit-rules.test.ts`)**:
   - `VIRTUAL_CASH_EXCESSIVE_DEBT`: Phát hiện doanh nghiệp tồn quỹ tiền mặt lớn (Nợ/Có 111 hàng chục tỷ) nhưng phát sinh chi phí lãi vay ngân hàng Nợ 635 lớn.
   - `PROHIBITED_UNUSUAL_PAIRS`:
     - Bắt Nợ 211 / Có 111 (Mua TSCĐ bằng tiền mặt).
     - Bắt Nợ 642 / Có 131 (Xóa nợ phải thu trực tiếp).
     - Bắt Nợ 331 / Có 711 (Xóa nợ phải trả vào thu nhập khác).
   - `ABNORMAL_REVENUE_REVERSAL`: Bắt bút toán Có TK 511 ghi âm hoặc Nợ 511 đối ứng tài khoản lạ.
   - `EXPENSE_PARKING_TRAP`: Bắt việc dồn chi phí đột biến vào TK 242/241 để giấu lỗ.

3. **Kiểm tra hồi quy toàn bộ hệ thống (Full Regression Testing)**:
   - Chạy toàn bộ 60+ test files trong thư mục `tests/`.
   - Đảm bảo 100% test cases đạt kết quả Pass.

4. **Kiểm tra Typecheck, Lint & Build**:
   - `npm run typecheck` (0 errors across web, node, tests).
   - `npm run lint` (0 errors, 0 warnings).
   - `npm run build` (Biên dịch Vite, Node & Workers thành công).

## 3. Tiêu Chí Nghiệm Thu
- [x] Tất cả các test cases mới và cũ đều pass 100%.
- [x] Quá trình build hoàn tất mượt mà không có cảnh báo lỗi.
