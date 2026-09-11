---
phase: 1
title: "Mở Rộng Data Contract & Aggregated Payload Mapper"
status: completed
priority: P1
effort: 1h
files_modified:
  - src/main/services/GeminiService.ts
  - src/renderer/components/Analytics/AiAuditAdvisorPanel.tsx
---

# Phase 1: Mở Rộng Data Contract & Aggregated Payload Mapper

## 1. Mục Tiêu

Mở rộng định nghĩa interface `FinancialMetricsPayload` tại `GeminiService.ts` và nâng cấp mapper tại `AiAuditAdvisorPanel.tsx` để trích xuất đầy đủ các khối dữ liệu phân tích chuyên sâu sẵn có trong `GlAnalyticsResult` đưa vào payload gửi cho Gemini.

## 2. Chi Tiết Các Bước Thực Hiện

### 2.1. Cập nhật `FinancialMetricsPayload` tại `src/main/services/GeminiService.ts`:
Bổ sung các trường có cấu trúc rõ ràng:
- `businessType?: 'MANUFACTURING' | 'TRADING' | 'HYBRID' | 'SERVICES'`: Loại hình hoạt động cốt lõi của doanh nghiệp.
- `auditorContextNote?: string`: Ghi chú bổ sung từ KTV về đặc thù đơn vị (tùy chọn).
- `kqkdYoY?: Array<{ chiTieu: string; current: number; prior: number | null; pct: number | null }>`: Số liệu KQKD so sánh năm nay vs năm trước.
- `monthlyBreakdown?: Array<{ month: number; revenue: number; cogs632: number; grossMarginPct: number; productionCost: number; prodCostToRevPct: number }>`: Bảng 12 tháng đầy đủ gồm Doanh thu 511, Giá vốn 632, CPSX thực tế phát sinh và các tỷ lệ %.
- `expenseSubaccounts?: { selling: Array<{ code: string; name: string; amount: number }>; admin: Array<{ code: string; name: string; amount: number }> }`: Các tiểu khoản chi phí 641, 642 trọng yếu.
- `cashTaxRisk?: { totalCashOverThreshold: number; countCashOverThreshold: number; penalty811Amount: number; estimatedB4Amount: number; estimatedTaxIncrease: number; auditWarnings: string[] }`: Số liệu rủi ro thuế và điều chỉnh B4.
- `relatedParties?: Array<{ name: string; relationship: string; amount: number; accounts: string[]; riskSummary: string }>`: Danh sách tóm tắt các bên liên quan phát sinh giao dịch trọng yếu.
- `paretoSummary?: { topCustomerPct: number; top5CustomersPct: number; topSupplierPct: number; top5SuppliersPct: number; warnings: string[] }`: Tỷ trọng tập trung doanh thu và chi phí mua hàng.

### 2.2. Nâng cấp Mapper tại `src/renderer/components/Analytics/AiAuditAdvisorPanel.tsx`:
- Trong hàm `handleRunAnalysis`:
  + Trích xuất dữ liệu từ `data.kqkdYoY?.rows` (lọc các chỉ tiêu trọng yếu: Doanh thu thuần, Giá vốn, Lợi nhuận gộp, Chi phí tài chính, Chi phí bán hàng, Chi phí QLDN, LNTT).
  + Trích xuất bảng 12 tháng kết hợp từ `data.trend12m`, `data.correlations?.grossMargin`, `data.correlations?.cogs12mMatrix`.
  + Trích xuất rủi ro thuế từ `data.cashTaxRisk` (tổng chi tiền mặt quá ngưỡng, phạt 811, chỉ tiêu B4 ước tính, thuế truy thu ước tính).
  + Trích xuất danh sách bên liên quan từ `data.relatedParties`.
  + Trích xuất tỷ trọng Pareto từ `data.pareto`.
  + Trích xuất loại hình `businessType` từ `data.correlations?.cogs12mMatrix?.businessType`.

### 2.3. Cập nhật hàm `anonymizePayload`:
- Đảm bảo khử định danh an toàn: Ẩn tên đối tượng bên liên quan (thay bằng `BEN_LIEN_QUAN_01`, `BEN_LIEN_QUAN_02`), giữ nguyên bản chất mối quan hệ (Cá nhân liên quan, Cổ đông lớn) và số tiền.

## 3. Tiêu Chí Nghiệm Thu (Pass Criteria)
- Toàn bộ các trường dữ liệu mới được gán đúng số liệu thực tế, không có `undefined`, không có `NaN`.
- Hàm `anonymizePayload` che giấu 100% tên DN và tên bên liên quan.
- Chạy `npm run typecheck` không có lỗi.
