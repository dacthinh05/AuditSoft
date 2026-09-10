# Journal: Hoàn Thành Bộ Đồ Thị Tài Chính Tương Quan VSA 520 & Tối Ưu Ma Trận 12 Tháng

- **Date**: 2026-09-10
- **Author**: AuditSoft Engineering
- **Scope**: `auditsoft-nkc` v1.2.0 (Advanced Audit Visualizations & Matrix Table Optimization)

## 1. Bối Cảnh & Vấn Đề Được Giải Quyết
Sau khi triển khai phân hệ #05 Phân Tích Cơ Bản, người dùng phản hồi giao diện bảng số liệu 12 tháng:
- "Hơi khó xem, nhìn không đẹp và rối mắt, số khá mờ".
- Thiếu các đồ thị trực quan hóa mối tương quan nhân quả giữa các chỉ tiêu (ví dụ Doanh thu / Giá vốn, bóc tách chi phí trong giá vốn).
- Cột T11, T12 và CẢ NĂM bị tràn mép phải màn hình, các ô bằng 0 dày đặc làm loãng mắt, các hộp cảnh báo vàng xếp chồng chiếm diện tích lớn.
- Yêu cầu người dùng: "Trực quan hóa thêm bằng đồ thị được không? Làm toàn bộ, không dùng nhiều icon, làm chuẩn SaaS".

## 2. Các Thay Đổi Kỹ Thuật Đã Triển Khai
1. **Lớp Xử Lý Tương Quan Tài Chính (`FinancialCorrelationEngine.ts`)**:
   - `computeGrossMargin`: Tính Biên lãi gộp 12 tháng `(511 - 632) / 511`, xác định baseline cả năm và cờ cảnh báo các tháng biên âm hoặc lệch $\pm 12\%$.
   - `computeCogsStructure`: Bóc tách cơ cấu giá thành sản xuất (621 NVL, 622 Nhân công, 627 SXC, 154/156 Thương mại) qua 12 tháng, tính % cơ cấu chuẩn 100%.
   - `computeOpexRatios`: Tính tỷ lệ Chi phí bán hàng (641) và Chi phí QLDN (642) trên doanh thu.
   - `computeProfitWaterfall`: Xây dựng chuỗi cầu nối dòng chảy lợi nhuận từ Doanh thu thuần về Lợi nhuận trước thuế.
2. **Bộ 4 Biểu Đồ Pure React SVG (Enterprise SaaS Grade, 0 KB External Dependency)**:
   - `RevenueCogsComboChart.tsx`: Biểu đồ kép cột Doanh thu vs Giá vốn + Đường Biên lãi gộp % trục phụ, kèm đường baseline trung bình và vòng nhấp nháy cảnh báo tháng bất thường.
   - `CogsStructureStackedChart.tsx`: Biểu đồ 100% Stacked Bar bóc tách cơ cấu chi phí giá vốn theo tháng.
   - `OpexRatioAreaChart.tsx`: Biểu đồ diện tích xếp tầng theo dõi tỷ lệ chi phí bán hàng và quản lý.
   - `ProfitWaterfallChart.tsx`: Biểu đồ thác nước từ Doanh thu thuần về LNTT với các đường gióng mờ.
   - `ChartTooltip.tsx`: Tooltip popover số tiền VNĐ và % khi hover chuột.
3. **Tối Ưu Giao Diện Bảng Ma Trận 12 Tháng & Triệt Tiêu Emojis**:
   - Áp dụng `sticky column` cố định cột Khoản mục bên trái: cuộn ngang thoải mái mà không bị mất tên tài khoản; toàn bộ T1..T12 và CẢ NĂM hiển thị đầy đủ trên màn hình.
   - Thay thế toàn bộ số `0` bằng dấu gạch ngang mờ `-` (`#94a3b8`); số phát sinh in đậm màu đen `#0f172a` font monospace rõ nét.
   - Gom các thanh cảnh báo vàng xếp chồng thành **`SmartAuditAlerts.tsx`** dạng lưới tinh gọn.
   - Triệt tiêu toàn bộ emoji trang trí thừa thãi theo phong cách Enterprise SaaS tối giản (Stripe/Linear style).

## 3. Nghiệm Thu & Kiểm Thử
- **Unit Tests**: 100% (47/47 test files passed, 248/248 tests passed).
- **TypeScript Typecheck**: 0 errors across all tsconfigs.
- **ESLint**: 0 errors, 0 warnings.
- **Production Build**: Hoàn tất thành công gói bundle dist/ và dist-electron/.
