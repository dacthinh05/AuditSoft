# Phase 1: Mở Rộng Domain Types & Thuật Toán Ghép Tên File Chuẩn D1/D2

## 1. Mục Tiêu
- Cập nhật `EngagementInfo` trong `src/domain/workingpaper/types.ts`:
  - `companyShortName?: string`: Tên công ty khi lưu file (ví dụ: `LONG RICH`).
  - `auditRound?: 'D1' | 'D2' | 'FY' | ''`: Đợt kiểm toán (`D1` là Đợt 1, `D2` là Đợt 2).
- Cập nhật hàm `generateOutputFileName` trong `src/domain/workingpaper/WorkingPaperGenerator.ts`:
  - Ghép cụm định danh: `[companyShortName || clientName] [auditRound] [fiscalYear]`.
  - Kết quả: `${code} - ${name} - ${company} ${round} ${year} - ${auditorShort}${ext}`.
- Cập nhật `src/main/index.ts`:
  - Đồng bộ tên thư mục xuất ra: `HoSoKiemToan_${company}_${round}_${year}`.

## 2. File Chỉnh Sửa
- `src/domain/workingpaper/types.ts`
- `src/domain/workingpaper/WorkingPaperGenerator.ts`
- `src/main/index.ts`

## 3. Các Bước Thực Hiện
1. Trong `types.ts`, thêm `companyShortName?: string` và `auditRound?: string` vào `EngagementInfo`.
2. Trong `WorkingPaperGenerator.ts:generateOutputFileName`:
   ```ts
   const company = (ctx.engagement.companyShortName || ctx.engagement.clientName).trim()
   const round = (ctx.engagement.auditRound === 'D1' || ctx.engagement.auditRound === 'D2') ? ctx.engagement.auditRound : ''
   const yearMatch = ctx.engagement.fiscalYearEnd.match(/\d{4}/)
   const year = yearMatch ? yearMatch[0] : ''
   
   const middleParts = [company, round, year].filter(Boolean)
   const middle = middleParts.join(' ')
   ```
3. Trong `src/main/index.ts`:
   ```ts
   const sanitizedCompany = (req.engagement?.companyShortName || req.engagement?.clientName || 'DoanhNghiep').replace(/[\\/:*?"<>|]/g, '_').trim()
   const roundPart = req.engagement?.auditRound ? `_${req.engagement.auditRound}` : ''
   const defaultOutDir = req.outputDir || path.resolve(path.dirname(req.sourcePath), `HoSoKiemToan_${sanitizedCompany}${roundPart}_${year}`)
   ```

## 4. Tiêu Chí Kiểm Tra
- Khi `companyShortName: 'LONG RICH'` và `auditRound: 'D2'`:
  - Sinh ra `D100 - Tien - LONG RICH D2 2026 - Thinh.xlsx`.
  - Sinh ra `A - B - H - Master - LONG RICH D2 2026 - Thinh.xlsx`.
  - Sinh ra `Leadsheet - LONG RICH D2 2026 - Thinh.xlsx`.
- Ruột file Excel vẫn lấy đúng `clientName` đầy đủ.
