# Plan: Tách Thống Kê Thuế Thành Module Riêng + UI Dễ Xem

- **Status**: completed
- **Constraints**: Thêm 1 `ViewKey` + 1 entry registry + 1 route App; `TaxCrossReconciler` cần cả NKC lẫn XML nên GL snapshot share qua zustand slice; không sửa engine parse; typecheck/lint/tests/build phải xanh.
- **Non-goals**: Không sửa `EtaxXmlParser`/`TaxCrossReconciler`; không redesign toàn app; không thêm chart thuế; không đụng B410/Sampling/QTT03.
- **Acceptance**: Hub 6 module active; trang Phân Tích không còn chữ Thuế/sub-tab; trang Thuế drop XML nạp được, chưa có NKC thì cột 511/334 hiện `-` + CTA; full suite pass.

## Phases Roadmap

| # | Phase | Mô tả | Trạng thái |
|---|-------|-------|------------|
| 1 | [Phase 1: Navigation + Registry + Shared Store](./phase-01-navigation-registry-store.md) | Thêm ViewKey, entry registry 06, slice taxStats, mappers chung, icon Hub, test 5→6 | Completed |
| 2 | [Phase 2: TaxStatsPage + Gọn Analytics Page](./phase-02-tax-stats-page-and-strip-analytics.md) | Page Thuế độc lập + degraded mode; Analytics page GL-only; route App | Completed |
| 3 | [Phase 3: UI Thuế Dễ Xem Chuẩn SaaS](./phase-03-tax-ui-readability.md) | KPI cards, sticky cột, '-' ô 0, xóa emoji | Completed |
| 4 | [Phase 4: Verification](./phase-04-verification.md) | typecheck + lint + 248 tests + build | Completed |
## Architecture

```
Hub (6 cards) ─┬─ analytics ─→ PreliminaryAnalyticsPage (GL-only)
               │                  │  auditAnalyze(filePath)
               │                  └─▶ glSnapshot ──┐
               └─ taxstats ──→ TaxStatsPage         │ (zustand taxStatsSlice)
                                 │  pickTaxFiles / importTaxXmlFiles
                                 └─▶ taxData + recon ◀──┘ (glSnapshot.journals)
```

Degraded mode: `glSnapshot == null` hoặc khác `filePath` → cột 511/334 render `-` + banner CTA "Nạp Sổ NKC để đối chiếu chéo".
