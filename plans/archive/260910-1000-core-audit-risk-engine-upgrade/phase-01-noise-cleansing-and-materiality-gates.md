# Phase 1: Noise Cleansing & Materiality Gates (Khử Dương Tính Giả & Cổng Trọng Yếu Kép)

## 1. Mục Tiêu
Triệt tiêu tận gốc hiện tượng báo động giả (False Positives) gây quá tải thông tin cho kiểm toán viên (Alert Fatigue), loại bỏ các bút toán kết chuyển kỹ thuật cuối kỳ và các biến động số học nhỏ không trọng yếu.

## 2. Các Thay Đổi Cụ Thể
1. **Loại trừ triệt để bút toán kết chuyển 911 khỏi phân tích cuối kỳ**:
   - Trong `src/main/analytics/JournalAnalyticsEngine.ts` (`detectYearEndWindow`) và `src/main/risks/rules/JournalEntryRules.ts` (`yearEndJournalClusterRule`):
     - Bút toán có `debitAccount.startsWith('911')` hoặc `creditAccount.startsWith('911')` là bút toán kết chuyển kỹ thuật bắt buộc theo VAS/TT200 vào ngày 31/12.
     - Không được tính các bút toán này vào cụm bút toán bất thường cuối kỳ (chỉ phân tích các giao dịch phát sinh thực với khách hàng/nhà cung cấp/đối tác).
2. **Cổng lọc "Trọng yếu kép" (Double Materiality Gate) trong `Trend12MAnalyzer.ts`**:
   - Hiện tại: `growth > 80% && currentVal > avgMonthlyNum` $\rightarrow$ bị bẫy số học khi số tiền quá nhỏ (từ 1tr lên 3tr = +200% vẫn bị báo động đỏ).
   - Nâng cấp điều kiện phát hiện đột biến:
     ```ts
     const diffFromPrev = currentVal - prevVal
     const isMaterialJump = Math.abs(diffFromPrev) >= 50_000_000 || Math.abs(diffFromPrev) >= avgMonthlyNum * 0.5
     if (growth > 80 && currentVal > avgMonthlyNum && isMaterialJump) {
       anomalyMonths.push(m + 1)
     }
     ```
     Đồng thời điều kiện vượt mức trung bình năm $1.5 \times$ cũng phải thỏa mãn độ chênh lệch tuyệt đối $\ge 50.000.000$ đ (hoặc $\ge 0.1 \times \text{tổng năm}$).
3. **Loại trừ 911 trong Ma trận 12 tháng**:
   - Đảm bảo các định nghĩa tài khoản (Doanh thu 511, Chi phí 6xx...) trong `Trend12MAnalyzer` không bị cộng đúp với các bút toán đối ứng 911.

## 3. Tiêu Chí Nghiệm Thu
- [x] Bút toán kết chuyển 911 vào ngày 31/12 không còn bị tính vào `YEAR_END_JOURNAL_CLUSTER`.
- [x] Các tháng có số tiền nhỏ dưới 50 triệu (dù MoM tăng 200%–300%) không bị nháy đèn đỏ bất thường.
- [x] Các test case cũ trong `accounting-analytics-engines.test.ts` và `risks.test.ts` vẫn pass 100%.
