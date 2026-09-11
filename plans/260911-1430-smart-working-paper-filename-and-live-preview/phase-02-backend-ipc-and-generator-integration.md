---
phase: 2
title: "Tích hợp Backend IPC, Generator & Tự động tạo thư mục rút gọn"
status: pending
priority: P2
effort: "45m"
dependencies: ["phase-01"]
---

# Phase 2: Tích hợp Backend IPC, Generator & Tự động tạo thư mục rút gọn

## Goal
Tích hợp các quy tắc định dạng tên file và tên thư mục thông minh vào luồng xử lý chính của ứng dụng: từ interface IPC, backend Electron Main process (`src/main/index.ts`) cho đến bộ tạo Giấy làm việc (`WorkingPaperGenerator.ts`).

## Files to Create / Modify
- Modify: `src/shared/ipc.ts`
- Modify: `src/domain/workingpaper/WorkingPaperGenerator.ts`
- Modify: `src/main/index.ts`

## Tasks & Steps

1. **Cập nhật Interface IPC trong `src/shared/ipc.ts`**:
   - Mở rộng `GenerateWorkingPapersRequest['engagement']`:
     ```typescript
     engagement: {
       clientName: string
       clientShortName?: string // Tên rút gọn (ví dụ: Long Rich)
       auditPeriodStage?: 'D1' | 'D2' | '' // Ký hiệu đợt
       namingStyle?: 'compact' | 'standard' // Kiểu đặt tên
       fiscalYearEnd: string
       auditPeriod1?: string
       auditPeriod2?: string
       auditorName: string
       reviewerName1?: string
       reviewerName2?: string
       auditFirmName?: string
     }
     ```
   - Đảm bảo tính tương thích ngược hoàn toàn: các trường mới đều là optional (`?`).

2. **Cập nhật hàm sinh tên file trong `src/domain/workingpaper/WorkingPaperGenerator.ts`**:
   - Thay thế hoặc tái cấu trúc hàm `generateOutputFileName(code, fallback, ctx)`:
     - Đọc thông tin từ `ctx.engagement`:
       - `clientShortName`: ưu tiên dùng `ctx.engagement.clientShortName`, nếu không có thì gọi `parseSmartFilename` để bóc từ `ctx.engagement.clientName`.
       - `auditPeriodStage`: lấy từ `ctx.engagement.auditPeriodStage` hoặc auto-detect.
       - `namingStyle`: mặc định là `'compact'` (theo đúng nguyện vọng của người dùng: `D100 - Long Rich D1 2026 - Thinh.xlsx`), có thể chuyển sang `'standard'` nếu được chỉ định.
       - `fiscalYear`: bóc 4 số từ `ctx.engagement.fiscalYearEnd` (hoặc auto-detect).
       - `auditorShort`: dùng hàm `toAsciiAuditor(ctx.engagement.auditorName)`.
     - Sử dụng hàm `formatWorkingPaperFileName` đã xây dựng ở Phase 1.
     - Đảm bảo các trường hợp đặc biệt:
       - `A - B - H`: trả về `A - B - H - Long Rich D1 2026 - Thinh.xlsx` (hoặc `A - B - H - Master...` ở standard style).
       - `Leadsheet`: trả về `Leadsheet - Long Rich D1 2026 - Thinh.xlsx`.
       - Các phân hệ `D100`, `D200`, `D300`, `D500`, `D600`, `D700`, `E100`, `E200`, `E300`, `E400`, `F100`, `G100`, `G200`: sinh đúng mã W/P ở đầu tên file.

3. **Cập nhật Backend Main Process `src/main/index.ts`**:
   - Tại handler `ipcMain.handle(IPC.generateWorkingPapers, ...)`:
     - Trước đây:
       ```typescript
       const sanitizedClient = (req.engagement?.clientName || 'DoanhNghiep').replace(/[\\/:*?"<>|]/g, '_').trim()
       const year = (req.engagement?.fiscalYearEnd || '2026').slice(-4)
       const defaultOutDir = req.outputDir || path.resolve(path.dirname(req.sourcePath), `HoSoKiemToan_${sanitizedClient}_${year}`)
       ```
     - Nâng cấp:
       - Nếu người dùng không chỉ định `req.outputDir` tùy chỉnh, hệ thống tự động gọi `formatOutputDirectoryName`:
         ```typescript
         const clientShort = req.engagement?.clientShortName || parseSmartFilename(path.basename(req.sourcePath), req.engagement?.clientName).clientShortName
         const stage = req.engagement?.auditPeriodStage || parseSmartFilename(path.basename(req.sourcePath)).auditPeriodStage
         const year = (req.engagement?.fiscalYearEnd || '2026').slice(-4)
         const folderName = formatOutputDirectoryName({ clientShortName: clientShort, periodStage: stage, fiscalYear: year })
         const defaultOutDir = req.outputDir || path.resolve(path.dirname(req.sourcePath), folderName)
         ```
       - Thư mục sinh ra sẽ siêu gọn: `HoSoKiemToan_Long Rich_D2_2025` thay vì chuỗi dài dòng chứa toàn bộ tên công ty pháp nhân.

## Verification
- Kiểm tra tính tương thích biên dịch TypeScript: `npx tsc --noEmit`
- Chạy thử nghiệm các test filler hiện tại (`tests/workingpaper.test.ts`, `tests/d300-receivable-fill.test.ts`) để đảm bảo không bị lỗi đường dẫn hay tên file.
