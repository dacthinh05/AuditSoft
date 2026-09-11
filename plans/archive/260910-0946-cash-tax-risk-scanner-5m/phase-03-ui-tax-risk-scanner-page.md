# Phase 3: UI TaxRiskScannerPage & Export Excel

## 1. Mục Tiêu
Xây dựng giao diện trang phân hệ #08 `TaxRiskScannerPage` tại `src/renderer/components/TaxRisk/TaxRiskScannerPage.tsx` theo chuẩn Enterprise SaaS tối giản (zero emoji, font monospace cho số tiền, độ tương phản cao), tích hợp chuyển đổi linh hoạt ngưỡng 5 triệu / 20 triệu và nút Xuất Excel Bảng kê rủi ro thuế đính kèm hồ sơ kiểm toán.

## 2. Thiết Kế Chi Tiết Giao Diện
1. **Header Banner Chuẩn AuditSoft**:
   - Tiêu đề: `Rà Soát Rủi Ro Chi Phí Thuế & Chỉ Tiêu B4 QTT 03/TNDN`.
   - Subtitle: *Phát hiện các khoản chi tiền mặt vi phạm điều kiện thanh toán không dùng tiền mặt (NĐ 181/2025/NĐ-CP & Luật Thuế GTGT 2024), chia nhỏ phiếu chi trong ngày, ước tính thuế TNDN và chi phí không được trừ Chỉ tiêu B4.*
   - Trạng thái nạp sổ NKC hiện tại kèm nút đổi/chọn file.

2. **Thanh Chuyển Đổi Ngưỡng Quét (Threshold Switcher)**:
   - Nút Pill 1: `Quy định mới: Chi tiền mặt >= 5.000.000 đ (NĐ 181/2025)` (Mặc định).
   - Nút Pill 2: `Quy định cũ: Chi tiền mặt >= 20.000.000 đ (NĐ 209/2013)`.
   - Nút Pill 3: `Tùy chỉnh ngưỡng (nhập số tiền)`.

3. **Bộ 4 Thẻ KPI Tóm Tắt Rủi Ro (Enterprise Cards)**:
   - **Thẻ 1**: Tổng tiền mặt vi phạm (Border-top đỏ `#e11d48`).
   - **Thẻ 2**: Ước tính điều chỉnh Chỉ tiêu B4 (Chi phí không được trừ - Border-top cam `#ea580c`).
   - **Thẻ 3**: Thuế TNDN tăng thêm tạm tính (20% × B4 - Border-top xanh dương `#0284c7`).
   - **Thẻ 4**: Số chứng từ rủi ro (Bao gồm X phiếu đơn lẻ + Y cụm xé hóa đơn - Border-top vàng `#d97706`).

4. **Bảng Kê Chi Tiết Bút Toán Rủi Ro (Virtual / Interactive Table)**:
   - Cột: STT | Ngày CT | Số CT | Nhà cung cấp / Đối tượng | Diễn giải | TK Nợ | TK Có | Số tiền (VNĐ) | Phân loại rủi ro | Căn cứ & Khuyến nghị B4.
   - Định dạng số tiền `monospace` đậm `#0f172a`.
   - Dấu `[!] Đơn lẻ >= Ngưỡng` nền đỏ nhạt `#fef2f2`, chữ đỏ `#b91c1c`.
   - Dấu `[!] Nghi ngờ chia nhỏ cùng ngày` nền vàng nhạt `#fffbeb`, chữ hổ phách `#b45309`.

5. **Chức Năng Xuất File Excel Bảng Kê Rủi Ro**:
   - Sử dụng `exceljs` để sinh trực tiếp file: `BangKe-RuiRo-ChiTienMat-B4-QTT3.xlsx`.
   - Bảng tính gồm: Tiêu đề công ty, niên độ, căn cứ pháp lý áp dụng (NĐ 181/2025 hoặc NĐ 209/2013), bảng kê chi tiết toàn bộ các dòng phát sinh vi phạm và dòng tổng cộng.

## 3. Cấu Trúc File
- Tạo mới thư mục `src/renderer/components/TaxRisk/`:
  - `TaxRiskScannerPage.tsx`
  - `exportTaxRiskExcel.ts`
- Cập nhật `src/renderer/App.tsx`:
  - Thêm nhánh render `{view === 'taxrisk' && <TaxRiskScannerPage />}`.

## 4. Tiêu Chí Nghiệm Thu
- [x] Giao diện hiển thị sắc nét, chuyển đổi giữa mốc 5tr và 20tr tính toán lại số liệu ngay lập tức.
- [x] Bấm nút Xuất Excel tải xuống file Excel chuẩn format kiểm toán.
