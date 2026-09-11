# Phase 01: Xây Dựng Engine Kết Luận Chuẩn VACPA & Khối Tickmarks Đa Dạng

## Mục tiêu
Tạo module quản lý câu kết luận kiểm toán chuẩn mực theo tiêu chuẩn VACPA và các hàm chèn kết luận, tickmarks có định dạng màu sắc đẹp mắt.

## File tác động
- `src/domain/workingpaper/conclusionEngine.ts` (mới)

## Chi tiết thực hiện
1. Định nghĩa cấu trúc kết luận `AuditConclusionTemplate`:
   - `leadScheduleConclusion(sectionName: string, year: number, hasAdj: boolean, adjSummary?: string): string`
   - `sampleTestingConclusion(sectionName: string, sampleCount: number, cttAmount?: number): string`
   - `cutoffTestingConclusion(sectionName: string, year: number): string`
   - `confirmationConclusion(sectionName: string, sentRate: number, recvRate: number): string`
2. Viết các hàm format hỗ trợ ghi vào Excel:
   - `formatConclusionBox(ws, startRow, text, auditorName?, auditDate?)`: Kẻ khung, tô nền xanh lá nhạt (`#E2EFDA`), font Cambria 10pt.
   - `formatTickmarksLegend(ws, startRow)`: Kẻ bảng 4 dòng chú thích ký hiệu kiểm toán (`^`, `✓`, `GL`, `TB`).
