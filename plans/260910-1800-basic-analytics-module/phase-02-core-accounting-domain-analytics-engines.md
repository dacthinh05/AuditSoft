---
title: "Phase 2: Core Accounting Domain Analytics Engines"
description: "Xây dựng 4 engine phân tích kế toán lõi hoạt động trực tiếp trên Sổ Nhật ký chung (NKC) và Báo cáo KQKD trước điều chỉnh: EbitdaCalculator, RelatedPartyScanner, ConcentrationAnalyzer và Trend12MAnalyzer."
status: planned
priority: P1
effort: "8h"
created: 2026-09-10
---

# Phase 2: Core Accounting Domain Analytics Engines

## 1. Mục Tiêu
Xây dựng toàn bộ các thuật toán phân tích kế toán và kiểm toán theo chuẩn mực VSA 520 (Thủ tục phân tích) và Nghị định 132/2020/NĐ-CP, hoạt động trực tiếp trên dữ liệu `JournalEntry[]` và `IncomeStatementData` đã được nạp từ file Excel kế toán.

## 2. Danh Sách Tệp Cần Tạo

| Tệp Mới Trong AuditSoft | Trách Nhiệm |
|-------------------------|-------------|
| `src/domain/analytics/types.ts` | Khai báo các interface kết quả phân tích: `EbitdaResult`, `RelatedPartyFinding`, `ParetoReport`, `Trend12MMatrix`. |
| `src/domain/analytics/EbitdaCalculator.ts` | Bóc tách chi phí lãi vay, khấu hao 214, lợi nhuận thuần HĐKD, tính EBITDA và trần 30% theo Nghị định 132/2020/NĐ-CP. |
| `src/domain/analytics/RelatedPartyScanner.ts` | Quét giao dịch nghi ngờ bên liên quan (cho vay/mượn không tính lãi suất, tạm ứng 141 tồn đọng lớn). |
| `src/domain/analytics/ConcentrationAnalyzer.ts` | Phân tích tỷ trọng Pareto % của Top Khách hàng (TK 511) và Top Nhà cung cấp (TK 15x, 6xx, 331). |
| `src/domain/analytics/Trend12MAnalyzer.ts` | Ma trận biến động 12 tháng x các tài khoản trọng yếu, tính tăng trưởng MoM và cảnh báo tháng đột biến. |
| `tests/accounting-analytics-engines.test.ts` | Bộ unit test kiểm tra tính chính xác của 4 engine với dữ liệu mẫu. |

## 3. Chi Tiết Thuật Toán & Code Snippets

### 3.1. `EbitdaCalculator.ts` (Nghị định 132/2020/NĐ-CP)
- **Lãi vay phát sinh (Borrowing Costs)**:
  - Lọc các dòng NKC có Nợ TK bắt đầu bằng `635` và diễn giải chứa regex `/lãi\s+vay|tiền\s+vay|lai\s+vay|interest/i` (hoặc toàn bộ Nợ 635 đối ứng 111, 112, 338, 341 nếu không chia tiểu khoản).
- **Lãi tiền gửi, cho vay (Interest Income)**:
  - Lọc các dòng NKC có Có TK bắt đầu bằng `515` và diễn giải chứa regex `/lãi\s+(tiền\s+gửi|cho\s+vay)|lai\s+tien\s+gui/i` (hoặc Nợ 112 đối ứng Có 515).
- **Khấu hao TSCĐ**:
  - Tổng phát sinh Có TK `214` (đối ứng các tài khoản chi phí 627, 641, 642...).
- **Lợi nhuận thuần HĐKD**:
  - Lấy từ Chỉ tiêu Mã số `30` của `IncomeStatementData`.
  - Fallback nếu không có KQKD: $\text{LNTT HĐKD} = \text{Có 511} - \text{Nợ 632} - \text{Nợ 641} - \text{Nợ 642} + \text{Có 515} - \text{Nợ 635}$.
- **Công thức tính**:
  $$\text{NetInterest} = \text{InterestExpense} - \text{InterestIncome}$$
  $$\text{EBITDA} = \text{OperatingProfit} + \text{NetInterest} + \text{Depreciation}$$
  $$\text{Cap30} = \text{EBITDA} > 0 ? (\text{EBITDA} \times 30 / 100) : 0n$$
  $$\text{DisallowedInterest} = \text{NetInterest} > \text{Cap30} ? (\text{NetInterest} - \text{Cap30}) : 0n$$

### 3.2. `RelatedPartyScanner.ts` (VSA 550)
- **Quy tắc 1: Cho vay / Cho mượn không lãi suất (Interest-Free Lending)**:
  - Quét các giao dịch Nợ `128` hoặc Nợ `1388` đối ứng Có `111`, `112`.
  - Kiểm tra xem đối tượng này trong cả năm có bất kỳ phát sinh Có `515` (Doanh thu lãi cho vay) hay không. Nếu không có -> Gắn cờ cảnh báo: `"Cho vay/mượn vốn không tính lãi suất - Rủi ro ấn định thuế theo Luật QLT"`.
- **Quy tắc 2: Đi vay / Mượn tiền không trả lãi (Interest-Free Borrowing)**:
  - Quét các giao dịch Có `341` hoặc Có `3388` đối ứng Nợ `111`, `112`.
  - Kiểm tra xem có chi phí lãi vay Nợ `635` tương ứng hay không.
- **Quy tắc 3: Tạm ứng cá nhân tồn đọng kéo dài (TK 141)**:
  - Quét các đối tượng có số dư Nợ TK `141` vượt quá Mức trọng yếu tổng thể (PM) hoặc $> 100.000.000$ VNĐ mà không có hoàn ứng trong vòng 6 tháng.

### 3.3. `ConcentrationAnalyzer.ts` (Pareto Analysis)
- **Top Khách hàng**:
  - Nhóm theo `customerName` hoặc `objectCode` trên các bút toán Nợ `131`, `111`, `112` đối ứng Có `511`.
  - Sắp xếp giảm dần theo số tiền doanh thu.
  - Tính % doanh thu của từng khách hàng: $\frac{\text{Doanh số KH}_i}{\text{Tổng doanh thu 511}} \times 100\%$.
  - Tính % tích lũy. Cảnh báo rủi ro Going Concern (VSA 570) nếu Top 1 khách hàng $> 30\%$ hoặc Top 5 khách hàng $> 70\%$.
- **Top Nhà cung cấp**:
  - Nhóm theo nhà cung cấp trên các bút toán Nợ `15x`, `632`, `641`, `642` đối ứng Có `331`, `111`, `112`.
  - Tính tỷ trọng % mua hàng và % tích lũy.

### 3.4. `Trend12MAnalyzer.ts` (Ma trận biến động 12 tháng)
- Duyệt qua từng `entry` trong `entries: JournalEntry[]`, sử dụng trường `entry.month` (1 đến 12).
- Khởi tạo mảng `monthlyBuckets[12]`:
  + `revenue`: Tổng phát sinh Có TK 511
  + `inventoryPurchase`: Tổng phát sinh Nợ TK 152, 153, 155, 156 đối ứng 331, 111, 112
  + `cogs`: Tổng phát sinh Nợ TK 632
  + `sellingExpense`: Tổng phát sinh Nợ TK 641
  + `adminExpense`: Tổng phát sinh Nợ TK 642
  + `financialExpense`: Tổng phát sinh Nợ TK 635
  + `financialIncome`: Tổng phát sinh Có TK 515
  + `otherExpenses`: Tổng phát sinh Nợ TK 811
- Tính tốc độ tăng trưởng tháng sau so với tháng trước:
  $$\text{MoM Growth} = \frac{\text{Value}_{M} - \text{Value}_{M-1}}{\text{Value}_{M-1}} \times 100\%$$
- Gắn cờ cảnh báo nếu:
  + Doanh thu tháng bất kỳ tăng $> 50\%$ so với mức trung bình 11 tháng còn lại.
  + Biên lợi nhuận gộp $(\text{Doanh thu} - \text{Giá vốn}) / \text{Doanh thu}$ âm hoặc biến động lớn hơn 15% giữa các tháng liền kề.

## 4. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
1. `EbitdaCalculator` tính chính xác từng đồng số liệu EBITDA trên bộ test fixture (đã biết trước kết quả mong đợi).
2. `RelatedPartyScanner` phát hiện chính xác các bút toán cho vay 0% lãi suất và không báo sai (false positive) đối với các khoản vay có phát sinh lãi đều đặn.
3. `ConcentrationAnalyzer` xếp hạng đúng Top 5, Top 10 khách hàng và nhà cung cấp, tổng % tích lũy của toàn bộ danh sách bằng đúng 100%.
4. `Trend12MAnalyzer` phân bổ chính xác từng tháng 1..12, tổng cộng 12 tháng khớp 100% với số phát sinh cả năm trên Bảng CDFS.
5. Bộ unit tests `tests/accounting-analytics-engines.test.ts` chạy thành công 100%.
