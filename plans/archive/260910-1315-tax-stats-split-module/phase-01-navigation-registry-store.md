# Phase 1: Navigation + Registry + Shared Store

## Goal
Dựng khung điều hướng cho module Thuế mới và kênh share dữ liệu GL→Thuế, chưa đụng UI 2 page.

## Changes
1. `src/renderer/state/slices/navigationSlice.ts`: thêm `'taxstats'` vào `ViewKey`.
2. `src/renderer/config/modulesRegistry.ts`:
   - `viewKey` union thêm `'taxstats'`.
   - Entry `analytics_vsa520`: title → `Phân Tích Sổ NKC — VSA 520 & Đồ Thị Tương Quan`, category giữ `reconcile`, description/highlights **xóa mọi chữ thuế/XML**, badge giữ `CHUẨN MỰC VSA 520`.
   - Entry mới `tax_stats_vsa520`, code `06`, category `tax`, title `Thống Kê Thuế GTGT/TNCN & Đối Chiếu Sổ NKC`, badge `ĐỐI CHIẾU THUẾ`, accent `#0d9488`/bg `#f0fdfa`, highlights: kéo thả XML/ZIP 01/GTGT-05/TNCN, đối chiếu 511/334, bảng chênh lệch + ghi chú kiểm toán.
   - `wp_generator` code `06`→`07`, `tax_risk_scanner` code `07`→`08`.
3. `src/renderer/state/slices/taxStatsSlice.ts` (mới): `{ glSnapshot: { filePath: string; journals: JournalRowDTO[] } | null; taxData: IngestedTaxDeclarations | null; setGlSnapshot; setTaxData; clearTaxData }`. Wire vào `store.ts` + export type.
4. `src/renderer/components/Analytics/analyticsMappers.ts` (mới): move `dtoToEntries`, `dtoToKqkd` từ `PreliminaryAnalyticsPage.tsx` sang (export, giữ nguyên logic).
5. `src/renderer/pages/HubPage.tsx`: thêm case icon `tax_stats_vsa520` (dùng `IconFileText`).
6. `tests/hub-navigation.test.ts`: `5`→`6`, thêm `expect(activeIds).toContain('tax_stats_vsa520')`.

## Acceptance
- `getActiveModules().length === 6`; `getModuleByView('taxstats')?.id === 'tax_stats_vsa520'`.
- `npm run typecheck` pass.

## Verify
`npm run typecheck` + `npx vitest run tests/hub-navigation.test.ts`
