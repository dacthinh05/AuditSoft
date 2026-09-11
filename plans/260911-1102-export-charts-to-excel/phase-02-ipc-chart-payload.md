---
id: "phase-02"
name: "Mở rộng IPC Schema truyền payload biểu đồ xuống Main Process"
plan: "plans/260911-1102-export-charts-to-excel/plan.md"
status: "pending"
---

# Pha 2: Mở rộng IPC Schema truyền payload biểu đồ xuống Main Process

## 1. Mục Tiêu
Bổ sung trường `chartImages` vào request xuất báo cáo phân tích để Main Process nhận được danh sách ảnh PNG.

## 2. Các Bước Thực Hiện
1. Cập nhật `src/shared/types/analytics.ts`:
   ```typescript
   export interface ChartImageItem {
     id: string
     title: string
     pngBase64: string // data:image/png;base64,... hoặc chuỗi base64 thuần
     width?: number
     height?: number
   }

   export interface AuditExportRequest {
     filePath: string
     sheetName?: string
     suggestedName?: string
     overall?: number
     performance?: number
     clearlyTrivial?: number
     fiscalYear?: number
     chartImages?: ChartImageItem[]
   }
   ```
2. Cập nhật `src/shared/schemas.ts`:
   ```typescript
   export const chartImageSchema = z.object({
     id: z.string(),
     title: z.string(),
     pngBase64: z.string(),
     width: z.number().optional(),
     height: z.number().optional(),
   })

   export const auditExportSchema = auditAnalyzeSchema.extend({
     suggestedName: z.string().optional(),
     chartImages: z.array(chartImageSchema).optional(),
   })
   ```
3. Cập nhật `PreliminaryAnalyticsPage.tsx`:
   - Trước khi gọi `window.auditsoft.auditExport(...)`, quét các thẻ SVG của biểu đồ đang hiển thị, gọi `svgElementToPngBase64` và truyền vào `chartImages`.

## 3. Tiêu Chí Nghiệm Thu
- [ ] Schema Zod parse thành công không báo lỗi validation.
- [ ] IPC truyền nhận đầy đủ mảng ảnh PNG.
