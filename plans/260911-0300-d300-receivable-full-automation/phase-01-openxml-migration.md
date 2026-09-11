# Phase 1: Chuyển đổi D300 sang OpenXmlPackageEditor & Đấu nối WorkingPaperGenerator.ts

## Mục tiêu
Đảm bảo file `D300` khi sinh ra giữ nguyên vẹn 100% cấu trúc ZIP gốc, không bị Excel cảnh báo lỗi nội dung (Corrupt):
1. **`src/domain/workingpaper/WorkingPaperGenerator.ts`**:
   - Thêm `runner.code === 'D300'` vào điều kiện `isOpenXml`:
     ```ts
     const isOpenXml =
       runner.code === 'G100' ||
       runner.code === 'D200' ||
       runner.code === 'D300' ||
       runner.code.startsWith('A - B - H') ||
       runner.code.startsWith('Leadsheet')
     ```
2. **`src/domain/workingpaper/fillers/D300_ReceivableFiller.ts`**:
   - Chuyển đổi toàn bộ thao tác sang `OpenXmlPackageEditor` (sử dụng `editor.updateCell`, `editor.setLeadRowValues`, `editor.fillAddSheet`...).

## File tác động
- `src/domain/workingpaper/WorkingPaperGenerator.ts`
- `src/domain/workingpaper/fillers/D300_ReceivableFiller.ts`
