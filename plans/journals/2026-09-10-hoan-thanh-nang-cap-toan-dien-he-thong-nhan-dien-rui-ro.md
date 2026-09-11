# Journal: Hoàn Thành Nâng Cấp Toàn Diện Hệ Thống Nhận Diện Rủi Ro Kiểm Toán

- **Date**: 2026-09-10
- **Author**: AuditSoft Engineering
- **Plan**: `plans/260910-1000-core-audit-risk-engine-upgrade` (Status: Completed, 4/4 phases)

## 1. Bối Cảnh & Vấn Đề Được Giải Quyết
Người dùng hỏi về gốc rễ sai lệch trong nhận diện rủi ro kiểm toán tự động. Sau khi phân tích, hệ thống được nâng cấp toàn diện theo Phương án 1 nhằm giải quyết triệt để 2 vấn đề lớn:
1. **Dương tính giả (False Positives)**:
   - Bút toán kết chuyển kỹ thuật 911 ngày 31/12 trước đây bị coi là bất thường cuối kỳ / rủi ro cutoff.
   - Các biến động số học nhỏ từ 1 triệu lên 3 triệu (+200%) gây báo động đỏ rác vì thiếu cổng lọc giá trị tuyệt đối.
2. **Âm tính giả (False Negatives)**:
   - Trước đây bỏ lọt các bẫy kiểm toán lớn: Bẫy quỹ tiền mặt ảo (tồn tiền lớn nhưng vẫn vay nợ chịu lãi), Cặp tài khoản đối ứng cấm (mua TSCĐ bằng tiền mặt, xóa nợ 131 trực tiếp), Ghi âm doanh thu 511, Treo chi phí 242/241 giấu lỗ.

## 2. Các Thay Đổi Kỹ Thuật Đã Triển Khai
1. **Khử Dương Tính Giả & Cổng Trọng Yếu Kép (`JournalAnalyticsEngine.ts`, `Trend12MAnalyzer.ts`)**:
   - `detectYearEndWindow`: Loại trừ triệt để mọi bút toán có `debitAccount.startsWith('911')` hoặc `creditAccount.startsWith('911')`.
   - `Trend12MAnalyzer`:
     - Bỏ qua bút toán kết chuyển 911 trong vòng lặp tính doanh thu / chi phí tháng.
     - Thêm **Cổng trọng yếu kép (Double Materiality Gate)**: Chỉ gắn cờ đột biến khi tăng trưởng $> 80\%$ VÀ độ chênh lệch tuyệt đối $\ge 50.000.000$ đ (hoặc $\ge 50\%$ trung bình tháng), triệt tiêu hoàn toàn báo động rác với số nhỏ.
2. **Xây Dựng 4 Bẫy Kiểm Toán & Gian Lận Mới (`FraudAuditRules.ts`, `rules.ts`)**:
   - `virtualCashExcessiveDebtRule` (`VIRTUAL_CASH_EXCESSIVE_DEBT`): Quét phát sinh/tồn quỹ tiền mặt lớn $\ge 1$ tỷ nhưng chịu chi phí lãi vay TK 635 $\ge 50$ triệu. Cảnh báo rủi ro tiền mặt ảo / rút vốn cổ đông theo VSA 240 và Thông tư 96/2015.
   - `prohibitedAccountPairsRule` (`PROHIBITED_UNUSUAL_PAIRS`): Bắt Nợ 211/213/217 - Có 111 (mua TSCĐ tiền mặt $\ge 20$tr), Nợ 642/811 - Có 131 (xóa nợ trực tiếp), Nợ 331 - Có 711 (xóa nợ phải trả vào thu nhập khác).
   - `abnormalRevenueReversalRule` (`ABNORMAL_REVENUE_REVERSAL`): Bắt Có 511 ghi số tiền âm hoặc Nợ 511 đối ứng tài khoản lạ (không qua 521 hoặc 911).
   - `expenseParkingTrapRule` (`EXPENSE_PARKING_TRAP`): Bắt việc dồn chi phí bất thường vào TK 242 hoặc 241 chiếm $> 35\%$ tổng chi phí trong kỳ để né tránh ghi nhận lỗ.
3. **Phân Tầng Rủi Ro & Gắn Nhãn Chuẩn Mực VSA (`AuditRuleEngine.ts`, `AuditPage.tsx`)**:
   - Thêm bản đồ `RULE_STANDARDS` gắn nhãn chuẩn mực kiểm toán cụ thể (VSA 240, VSA 330, VSA 520, TT 96/2015) vào từng finding.
   - Nâng cấp giao diện `AuditPage.tsx`: Bổ sung thanh công cụ lọc nhanh theo mức độ rủi ro (Tất cả, Nghiêm trọng, Cao, Trung bình, Thấp) ngay trên bảng VirtualTable.

## 3. Nghiệm Thu & Kiểm Thử
- **Unit Tests**: 100% (64/64 test files passed, 327/327 tests passed).
  - `tests/noise-cleansing.test.ts`: 4 test cases kiểm chứng loại trừ 911 khỏi year-end, kiểm chứng không báo động với biến động nhỏ $< 50$tr.
  - `tests/fraud-audit-rules.test.ts`: 10 test cases kiểm chứng 4 bẫy kiểm toán mới.
  - `tests/risks.test.ts`: 9 test cases cũ pass 100%.
- **TypeScript Typecheck**: 0 errors across all tsconfigs.
- **ESLint**: 0 errors, 0 warnings.
- **Production Build**: Biên dịch Vite, Node & Workers hoàn tất thành công trong 16s.
