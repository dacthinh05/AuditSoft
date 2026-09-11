---
id: "phase-01"
name: "Xây dựng tiện ích chuyển đổi SVG sang PNG trên Webview"
plan: "plans/260911-1102-export-charts-to-excel/plan.md"
status: "pending"
---

# Pha 1: Xây dựng tiện ích chuyển đổi SVG sang PNG trên Webview

## 1. Mục Tiêu
Viết hàm tiện ích client-side để chuyển đổi một phần tử `<svg>` bất kỳ trong DOM sang hình ảnh PNG định dạng Base64 độ nét cao (2x DPI) để chèn vào Excel.

## 2. Kỹ Thuật Thực Hiện
```typescript
export async function svgElementToPngBase64(svgEl: SVGSVGElement, scale = 2): Promise<string> {
  // 1. Serialize SVG XML string
  // 2. Tạo Image object từ data:image/svg+xml
  // 3. Vẽ lên HTML5 Canvas với scale = 2 để ảnh cực nét
  // 4. canvas.toDataURL('image/png')
}
```

## 3. Các Điểm Cần Chú Ý
- Gắn `id` hoặc `data-chart-id` cho các container biểu đồ trong `GlAnalyticsTab.tsx` (vd: `#chart-gross-margin`, `#chart-waterfall`, `#chart-cogs-structure`, `#chart-opex-ratio`, `#chart-kqkd-yoy`).
- Đảm bảo các style/CSS gradient được nhúng trực tiếp trong `<defs>` của SVG (các component chart hiện tại đã có sẵn inline `<defs>`).

## 4. Tiêu Chí Nghiệm Thu
- [ ] Hàm chuyển đổi chạy mượt mà, không giật lag giao diện (thời gian render < 200ms).
- [ ] Ảnh trả ra có nền trong suốt hoặc nền trắng rõ nét.
