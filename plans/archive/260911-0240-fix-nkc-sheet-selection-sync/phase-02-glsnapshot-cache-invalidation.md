# Phase 2: Đồng bộ sheetName vào glSnapshot & Store Slice (taxStatsSlice.ts)

## Mục tiêu
Đảm bảo bộ nhớ đệm cache biết rõ dữ liệu journals thuộc về sheet nào:
1. **`src/renderer/state/slices/taxStatsSlice.ts`**:
   - Cập nhật interface `GlSnapshot`:
     ```ts
     export interface GlSnapshot {
       filePath: string
       sheetName?: string
       journals: JournalRowDTO[]
     }
     ```
2. **`src/renderer/components/Analytics/TaxStatsPage.tsx` & `TaxRiskScannerPage.tsx`**:
   - Kiểm tra cache: `glSnapshot.filePath === filePath && (!sheetName || glSnapshot.sheetName === sheetName)`.
   - Nếu `sheetName` thay đổi, tự động xóa snapshot cũ và kích hoạt `auditAnalyze({ filePath, sheetName })`.

## File tác động
- `src/renderer/state/slices/taxStatsSlice.ts`
- `src/renderer/components/Analytics/TaxStatsPage.tsx`
- `src/renderer/components/TaxRisk/TaxRiskScannerPage.tsx`
