# Journal: Tách Module Thống Kê Thuế + UI Dễ Xem

- **Date**: 2026-09-10
- **Scope**: `auditsoft-nkc` — module Thuế độc lập (view `taxstats`, mã 06)

## 1. Vấn đề
- Thống kê thuế (XML GTGT/TNCN) bị gom chung trong trang Phân Tích dưới dạng sub-tab, drop handler 2 tầng chồng nhau gây lỗi nuốt event XML.
- Bảng thuế khó xem: 8 cột không sticky, số 0 dày đặc, emoji rải rác.

## 2. Thay đổi
1. **Khung điều hướng**: `ViewKey 'taxstats'`, entry registry `tax_stats_vsa520` (06, category `tax`, accent teal), `wp_generator`→07, `tax_risk_scanner`→08; entry `analytics_vsa520` thu gọn về Sổ NKC thuần túy.
2. **Shared store**: slice `taxStatsSlice` (`glSnapshot` + `taxData`); `analyticsMappers.ts` tách `dtoToEntries`/`dtoToKqkd` dùng chung; `PreliminaryAnalyticsPage` cache journals sau mỗi lần phân tích, `TaxStatsPage` dùng lại để đối chiếu chéo.
3. **Trang Thuế độc lập** (`TaxStatsPage.tsx`): banner riêng, degraded mode khi thiếu NKC (cột 511/334 hiện `-` + CTA nạp sổ), mỗi page 1 drop handler duy nhất — hết lỗi chồng event vĩnh viễn.
4. **UI SaaS**: 4 KPI cards, sticky cột Kỳ Khai, ô 0 → `-` mờ, số monospace đậm `#0f172a`, lệch đỏ/khớp xanh, zero emoji (grep xác nhận).

## 3. Nghiệm thu
- `typecheck`: 0 errors · `lint`: 0 errors/warnings · `vitest`: 47 files / 248 tests pass · `npm run build`: thành công.
- Lưu ý môi trường: trong lúc cook có tiến trình khác sửa `SetupPage.tsx` (db-connector WIP) gây lỗi typecheck thoáng qua; tự hết sau khi file ghi xong. Không đụng vào WIP của họ.

## 4. Follow-up
- Smoke thủ công 2 flow (drop XML ở trang Thuế, CTA nạp NKC) khi chạy `npm run dev`.
- Cân nhắc biểu đồ thuế theo tháng nếu user yêu cầu (đã loại khỏi scope lần này).
