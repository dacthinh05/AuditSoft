# Phase 2: TaxStatsPage + Gọn Analytics Page

## Goal
Module Thuế chạy độc lập end-to-end; trang Phân Tích về GL-only, hết chồng drop handler.

## Changes
1. `src/renderer/components/Analytics/TaxStatsPage.tsx` (mới):
   - Header banner riêng (viền accent `#0d9488`, tiêu đề Thống Kê Thuế, không chữ VSA 520 sai ngữ cảnh).
   - Đọc `filePath` từ store + `glSnapshot`/`taxData` từ `taxStatsSlice`.
   - Effect: khi `filePath` đổi và `glSnapshot?.filePath !== filePath` và có `auditAnalyze` → chạy phân tích 1 lần, `setGlSnapshot({filePath, journals})`. Loading riêng của page.
   - `handleTaxFilesSelected`: `importTaxXmlFiles` → `setTaxData`; recon = `TaxCrossReconciler.reconcile(entriesFromSnapshot, vat, pit)`; `entries` rỗng khi chưa có snapshot (recon vẫn chạy ra rows thuế, cột GL = 0).
   - `hasGl = glSnapshot != null && glSnapshot.filePath === filePath && journals.length > 0`. Nếu `!hasGl` → banner CTA "Chưa có dữ liệu Sổ NKC — cột Doanh thu 511 / Lương 334 hiển thị `-`. [Nạp Sổ NKC]" (nút gọi `pickWorkbook` + `inspectWorkbook` + `setMeta('BEFORE')` như analytics page cũ).
   - Render `TaxAnalyticsTab` với prop mới `hasGlData: boolean`.
   - Drop handler: KHÔNG có wrapper Excel — chỉ `TaxDropZone` sở hữu drop.
2. `src/renderer/components/Analytics/TaxAnalyticsTab.tsx`: thêm prop `hasGlData`; khi `false`, cột GL (511/NKC, 334) render `-` mờ thay vì số 0.
3. `src/renderer/components/Analytics/PreliminaryAnalyticsPage.tsx` (strip):
   - Xóa `activeSubTab` + switcher UI, xóa `taxData`/`taxReconResult` state, `handleTaxFilesSelected`, tax imports (`IngestedTaxDeclarations`, `TaxCrossReconciler`, `TaxAnalyticsTab`).
   - Dùng `analyticsMappers` thay hàm local; sau phân tích thành công gọi `setGlSnapshot({filePath, journals: res.journals || []})`; giữ lại logic recon-cũ thì XÓA (thuộc về trang Thuế).
   - Header title → `Phân Tích Sổ NKC & Đồ Thị Tương Quan Tài Chính`; drag handlers về Excel-only (xóa guard `activeSubTab` vì không còn tab Thuế).
   - Render trực tiếp `GlAnalyticsTab` (bỏ nhánh `activeSubTab === 'gl'`).
4. `src/renderer/App.tsx`: thêm `{view === 'taxstats' && <TaxStatsPage />}` + import.

## Acceptance
- Vào Phân Tích: không còn nút sub-tab, không còn chữ Thuế/XML trong header; drop XML báo đúng lỗi Excel.
- Vào Thuế: drop XML nạp được; chưa nạp NKC → banner CTA + cột GL `-`; đã nạp NKC → cột đối chiếu có số.
- Chuyển qua lại 2 trang không mất `taxData`.

## Verify
`npm run typecheck`; smoke bằng `npm run dev` kiểm tra 2 flow trên.
