# Phase 1: Mở rộng AnalysisResult trả về trialBalance & DTO hoá sang Frontend

## Mục tiêu
Đưa số dư Bảng CĐSPS từ backend sang frontend để phục vụ Thuyết minh BCTC:
1. **`src/shared/types/analytics.ts`**:
   - Thêm `TrialBalanceRowDTO`:
     ```ts
     export interface TrialBalanceRowDTO {
       account: string
       accountName: string
       openingDebit: number
       openingCredit: number
       movementDebit: number
       movementCredit: number
       closingDebit: number
       closingCredit: number
     }
     ```
   - Thêm `trialBalance: TrialBalanceRowDTO[]` vào `AnalysisResult`.
2. **`src/main/AnalysisPipeline.ts`**:
   - DTO hoá `imp.trialBalance` và gắn vào kết quả trả về `AnalysisResult`.
3. **`src/renderer/components/Analytics/analyticsMappers.ts`**:
   - Tạo hàm `dtoToCdfsMap(tb: TrialBalanceRowDTO[])`: trả về `Map<string, CdfsAccountRow>`.

## File tác động
- `src/shared/types/analytics.ts`
- `src/main/AnalysisPipeline.ts`
- `src/renderer/components/Analytics/analyticsMappers.ts`
