# Phase 2: Bổ sung Auto-load Sổ NKC & ModuleGateBanner vào TaxRiskScannerPage.tsx

## Mục tiêu
Đảm bảo khi KTV bấm vào phân hệ rủi ro thuế từ Hub hay thanh breadcrumb thì dữ liệu tự động sẵn sàng:
1. **`src/domain/nkcRequirements.ts`**:
   - Thêm `taxrisk: 'BEFORE'` vào `MODULE_DATA_REQUIREMENTS`.
2. **`src/renderer/components/TaxRisk/TaxRiskScannerPage.tsx`**:
   - Import `ModuleGateBanner` và đặt ở đầu container:
     `<ModuleGateBanner requirement="BEFORE" moduleName="Rà soát rủi ro thuế NĐ 181" />`.
   - Bổ sung `useEffect` auto-load `glSnapshot` qua `window.auditsoft.auditAnalyze({ filePath })` khi `filePath` tồn tại nhưng `glSnapshot` chưa được nạp.
   - Thêm indicator loading khi đang phân tích: `Đang quét rủi ro chi tiền mặt...`.

## File tác động
- `src/domain/nkcRequirements.ts`
- `src/renderer/components/TaxRisk/TaxRiskScannerPage.tsx`
