# Phase 02: Bổ sung IPC Handler & API Bridge

## Mục tiêu
Cung cấp kênh truyền thông IPC từ giao diện renderer đến Electron Main để mở hộp thoại lưu file Excel.

## File tác động
- `src/shared/ipc.ts`
- `src/preload/index.ts`
- `src/main/index.ts`

## Chi tiết thực hiện
1. `src/shared/ipc.ts`:
   - Thêm interface `ExportProfilerRequest`:
     ```ts
     export interface ExportProfilerRequest {
       suggestedName?: string
       summary: ProfileSummary
       filteredRows?: DiffRow[]
       filterDesc?: string
     }
     ```
   - Bổ sung channel `IPC.exportProfilerReport = 'auditsoft/exportProfilerReport'`.
2. `src/preload/index.ts`:
   - Phơi API qua `window.auditsoft.exportProfilerReport(req)`.
3. `src/main/index.ts`:
   - Handle channel `IPC.exportProfilerReport`:
     - Hiện `dialog.showSaveDialog` với tên gợi ý `PhanTich-RuiRo-Cutoff-YYYYMMDD.xlsx`.
     - Gọi `buildProfilerWorkbook` và ghi file bằng `wb.xlsx.writeFile`.
     - Trả về `{ ok: boolean, outPath: string | null }`.

## Tiêu chí nghiệm thu
- Khi gọi từ renderer, hộp thoại lưu file xuất hiện và lưu file thành công.
