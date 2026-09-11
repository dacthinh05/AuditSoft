---
title: "Phase 1: Domain Financial Correlation Engines (Gross Margin, COGS Structure, OPEX, Waterfall)"
description: "Xây dựng lõi tính toán các chỉ số tài chính tương quan chuyên sâu phục vụ kiểm toán VSA 520: Biên lãi gộp 12 tháng, Bóc tách cơ cấu chi phí giá vốn (621/622/627/154), Tỷ lệ OPEX trên doanh thu và Dòng chảy lợi nhuận Waterfall."
status: planned
priority: P1
effort: "5h"
created: 2026-09-10
---

# Phase 1: Domain Financial Correlation Engines

## 1. Mục Tiêu
Xây dựng lớp xử lý nghiệp vụ thuần túy (Domain Engine) `FinancialCorrelationEngine.ts` để tính toán 4 nhóm số liệu tương quan từ danh sách bút toán `JournalEntry[]` và `IncomeStatementData`. Toàn bộ tính toán tuân thủ nguyên tắc sử dụng kiểu dữ liệu `Money` và `BigInt` chính xác tuyệt đối.

## 2. Danh Sách Tệp Cần Tạo & Chỉnh Sửa

| Tệp | Trách Nhiệm |
|-----|-------------|
| `src/domain/analytics/types.ts` | Bổ sung các interface: `GrossMarginPoint`, `CogsStructureMonth`, `OpexRatioPoint`, `WaterfallStep`, `CorrelationAnalysisResult`. |
| `src/domain/analytics/FinancialCorrelationEngine.ts` | Lõi tính toán: Biên lãi gộp 12 tháng, Cơ cấu chi phí giá vốn 621/622/627/154, Tỷ lệ OPEX, Cầu nối lợi nhuận Waterfall. |
| `tests/financial-correlation-engine.test.ts` | Bộ unit test kiểm chứng từng công thức tài chính với các kịch bản kiểm toán thực tế. |

## 3. Chi Tiết Thuật Toán & Công Thức Kiểm Toán (VSA 520)

### 3.1. Biên Lợi Nhuận Gộp 12 Tháng (Gross Margin Correlation)
- **Doanh thu từng tháng**: Tổng phát sinh Có TK 511 trong tháng $m$.
- **Giá vốn từng tháng**: Tổng phát sinh Nợ TK 632 trong tháng $m$.
- **Lợi nhuận gộp tháng $m$**: $\text{GrossProfit}_m = \text{Revenue}_m - \text{COGS}_m$.
- **Biên lãi gộp tháng $m$ (%)**:
  $$\text{GrossMarginPct}_m = \text{Revenue}_m > 0 ? \left(\frac{\text{GrossProfit}_m}{\text{Revenue}_m} \times 100\right) : 0$$
- **Biên lãi gộp trung bình cả năm**: $\text{AnnualGrossMarginPct} = \frac{\sum \text{GrossProfit}}{\sum \text{Revenue}} \times 100\%$.
- **Nhận diện bất thường (Audit Anomaly Flag)**:
  - Cờ đỏ 1: $\text{GrossMarginPct}_m < 0$ (Kinh doanh dưới giá vốn / biên âm).
  - Cờ đỏ 2: $|\text{GrossMarginPct}_m - \text{AnnualGrossMarginPct}| > 12\%$ (Biến động biên độ lớn bất thường).

### 3.2. Bóc Tách Cơ Cấu Chi Phí Giá Vốn (COGS Cost Structure 12M)
Đối với doanh nghiệp sản xuất/xây lắp, giá thành được cấu thành từ 4 yếu tố:
- **Chi phí Nguyên vật liệu trực tiếp (NVL)**: Phát sinh Nợ TK 621 trong tháng.
- **Chi phí Nhân công trực tiếp (NCTT)**: Phát sinh Nợ TK 622 trong tháng.
- **Chi phí Sản xuất chung (SXC)**: Phát sinh Nợ TK 627 trong tháng.
- **Chi phí Dở dang / Hàng hóa thương mại**: Phát sinh Nợ TK 154 hoặc Nợ TK 632 đối ứng Có 156.
- **Tỷ trọng từng khoản mục**:
  $$\text{MaterialPct}_m = \frac{\text{NVL}_m}{\text{TotalCosts}_m} \times 100\%$$
  $$\text{LaborPct}_m = \frac{\text{NCTT}_m}{\text{TotalCosts}_m} \times 100\%$$
  $$\text{OverheadPct}_m = \frac{\text{SXC}_m}{\text{TotalCosts}_m} \times 100\%$$

### 3.3. Tỷ Lệ Chi Phí Hoạt Động Trên Doanh Thu (OPEX Ratio 12M)
- **Chi phí bán hàng**: Phát sinh Nợ TK 641 trong tháng $m$.
- **Chi phí quản lý doanh nghiệp**: Phát sinh Nợ TK 642 trong tháng $m$.
- **Tỷ lệ chi phí trên doanh thu**:
  $$\text{SellingRatio}_m = \frac{\text{CPBH}_m}{\text{Revenue}_m} \times 100\%$$
  $$\text{AdminRatio}_m = \frac{\text{CPQL}_m}{\text{Revenue}_m} \times 100\%$$
  $$\text{TotalOpexRatio}_m = \text{SellingRatio}_m + \text{AdminRatio}_m$$

### 3.4. Dòng Chảy Cầu Nối Lợi Nhuận (Profit Bridge Waterfall)
Xây dựng chuỗi các bước (Steps) từ Doanh thu về Lợi nhuận trước thuế:
1. `Doanh thu thuần (511)`: Bắt đầu (`start`, giá trị dương).
2. `Giá vốn hàng bán (632)`: Giảm trừ (`decrease`, giá trị âm).
3. `Lợi nhuận gộp`: Tiểu tổng (`subtotal`).
4. `Doanh thu tài chính (515)`: Bổ sung (`increase`, giá trị dương).
5. `Chi phí tài chính (635)`: Giảm trừ (`decrease`, giá trị âm).
6. `Chi phí bán hàng (641)`: Giảm trừ (`decrease`, giá trị âm).
7. `Chi phí quản lý doanh nghiệp (642)`: Giảm trừ (`decrease`, giá trị âm).
8. `Thu nhập & Chi phí khác (711 - 811)`: Biến động thuần (`increase`/`decrease`).
9. `Lợi nhuận trước thuế`: Kết quả cuối cùng (`total`).

## 4. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
1. `FinancialCorrelationEngine` tính chính xác từng đồng cho 12 tháng của bộ test fixture.
2. Khi Doanh thu tháng bất kỳ bằng 0, không xảy ra lỗi chia cho 0 (`division by zero`), biên lãi gộp trả về 0%.
3. Bóc tách cơ cấu chi phí giá vốn cộng lại bằng đúng 100%.
4. Cầu nối Waterfall cân đối tuyệt đối từ Doanh thu thuần về LNTT.
5. Bộ unit test `tests/financial-correlation-engine.test.ts` pass 100%.
