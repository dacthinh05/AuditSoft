---
id: "phase-03"
name: "Tạo Sheet 00_Dashboard_Visual và nhúng ảnh biểu đồ vào Excel"
plan: "plans/260911-1102-export-charts-to-excel/plan.md"
status: "pending"
---

# Pha 3: Tạo Sheet 00_Dashboard_Visual và nhúng ảnh biểu đồ vào Excel

## 1. Mục Tiêu
Cập nhật `AuditReportExporter.ts` để tạo sheet đầu tiên mang tên `00_Dashboard_Visual`, nhúng các hình ảnh biểu đồ vào các tọa độ ô xác định một cách khoa học và đẹp mắt.

## 2. Kỹ Thuật Thực Hiện Với ExcelJS
```typescript
if (chartImages && chartImages.length > 0) {
  const ws0 = wb.addWorksheet('00_Dashboard_Visual', {
    views: [{ showGridLines: false }], // Tắt gridlines để nền trắng phẳng hiện đại
  })

  // Đặt tiêu đề lớn trên đầu
  ws0.getCell('B2').value = 'BÁO CÁO TRỰC QUAN HÓA PHÂN TÍCH TÀI CHÍNH & RỦI RO KIỂM TOÁN (VSA 520)'
  ws0.getCell('B2').font = { size: 16, bold: true, color: { argb: 'FF0F766E' } }

  let currentTopRow = 4
  for (const chart of chartImages) {
    const imageId = wb.addImage({
      base64: chart.pngBase64.replace(/^data:image\/png;base64,/, ''),
      extension: 'png',
    })

    // Nhúng vào vị trí ô với kích thước chuẩn
    ws0.addImage(imageId, {
      tl: { col: 1.5, row: currentTopRow },
      ext: { width: 780, height: 260 },
    })

    currentTopRow += 16 // Khoảng cách giữa các biểu đồ
  }
}
```

## 3. Tiêu Chí Nghiệm Thu
- [ ] Sheet `00_Dashboard_Visual` nằm ở vị trí đầu tiên của Workbook.
- [ ] Hình ảnh các biểu đồ sắc nét, không bị méo tỷ lệ (aspect ratio).
- [ ] File Excel mở lên bằng MS Excel không bị lỗi và hiển thị đầy đủ biểu đồ.
