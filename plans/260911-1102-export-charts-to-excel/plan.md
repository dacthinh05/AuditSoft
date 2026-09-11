---
title: "Kế Hoạch Nhúng Toàn Bộ Biểu Đồ (Charts) Từ Phần Mềm Vào Báo Cáo Excel Phân Tích"
description: "Chuyển đổi các biểu đồ SVG (Doanh thu-Giá vốn, Waterfall, Cơ cấu chi phí, OPEX) thành hình ảnh PNG độ phân giải cao và nhúng trực tiếp vào Workbook Excel qua ExcelJS"
status: "completed"
priority: "high"
author: "Antigravity Assistant"
created: "2026-09-11"
phases:
  - id: "phase-01"
    name: "Xây dựng tiện ích chuyển đổi SVG sang PNG trên Webview"
    file: "phase-01-svg-to-png-converter.md"
    status: "completed"
  - id: "phase-02"
    name: "Mở rộng IPC Schema truyền payload biểu đồ xuống Main Process"
    file: "phase-02-ipc-chart-payload.md"
    status: "completed"
  - id: "phase-03"
    name: "Tạo Sheet 00_Dashboard_Visual và nhúng ảnh biểu đồ vào Excel"
    file: "phase-03-embed-charts-in-excel.md"
    status: "completed"
  - id: "phase-04"
    name: "Kiểm thử end-to-end và xác thực tính thẩm mỹ của file Excel"
    file: "phase-04-verification.md"
    status: "completed"
---

# KẾ HOẠCH NHÚNG TOÀN BỘ BIỂU ĐỒ (CHARTS) VÀO BÁO CÁO EXCEL PHÂN TÍCH

## 1. Mục Tiêu
Giải quyết dứt điểm phản hồi *"File Excel xuất ra không giống giao diện, thiếu biểu đồ chart"*. Sau khi hoàn thành, file Excel xuất ra từ phân hệ Phân Tích Sổ NKC (VSA 520) sẽ có thêm Sheet **`00_Dashboard_Visual`** chứa đầy đủ hình ảnh các biểu đồ tài chính sắc nét giống 100% trên màn hình phần mềm:
1. **Biểu đồ 1**: Combo Doanh thu & Biên lãi gộp 12 tháng (`RevenueCogsComboChart`).
2. **Biểu đồ 2**: Thác nước Lợi nhuận (`ProfitWaterfallChart`).
3. **Biểu đồ 3**: Cơ cấu chi phí sản xuất & giá vốn Stacked Bar (`CogsStructureStackedChart`).
4. **Biểu đồ 4**: Tỷ trọng chi phí hoạt động OPEX / Doanh thu (`OpexRatioAreaChart`).
5. **Biểu đồ 5**: Biến động các chỉ tiêu trọng yếu YoY (`KqkdYoYChart`).

## 2. Kiến Trúc Luồng Dữ Liệu
```mermaid
flowchart TD
    UI[Giao Diện Phân Tích: Các thẻ SVG Charts] --> CONV[Tiện Ích svgToPngBase64]
    CONV --> PAYLOAD[Mảng Ảnh Base64 PNG Độ Nét Cao]
    PAYLOAD --> IPC[Gửi qua IPC: auditExport]
    IPC --> EXPORTER[AuditReportExporter.ts]
    EXPORTER --> WB[ExcelJS addImage & position: tl, br]
    WB --> OUT[BaoCao-PhanTich-NKC-VSA520.xlsx có Sheet Dashboard Visual]
```

## 3. Danh Sách Các Pha
- **[Pha 1: Converter SVG sang PNG](phase-01-svg-to-png-converter.md)**: Xây dựng hàm chụp thẻ `<svg>` của các component Chart qua HTML5 Canvas và xuất ra buffer/base64.
- **[Pha 2: Mở rộng IPC](phase-02-ipc-chart-payload.md)**: Cập nhật `AuditExportRequest` và `auditExportSchema` để nhận thêm trường `chartImages?: Array<{ id: string; title: string; pngBase64: string }>`.
- **[Pha 3: Nhúng ảnh vào Excel](phase-03-embed-charts-in-excel.md)**: Dựng sheet `00_Dashboard_Visual` trong `AuditReportExporter.ts`, dùng `wb.addImage()` và tính toán tọa độ lưới ô (row, col) để xếp các biểu đồ thành 2 cột cân đối.
- **[Pha 4: Kiểm thử & Hoàn tất](phase-04-verification.md)**: Kiểm thử xuất file thực tế, kiểm tra độ sắc nét của hình ảnh và biên dịch `npm run build`.
