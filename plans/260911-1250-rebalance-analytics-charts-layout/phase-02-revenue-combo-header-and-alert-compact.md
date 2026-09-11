# Phase 2: Tinh Gọn Header & Chuẩn Hóa Alert Cho RevenueCogsComboChart

## 1. Mục Tiêu
- Giải quyết triệt để vấn đề header bị vỡ thành 3 tầng trong `RevenueCogsComboChart.tsx`.
- Thay thế khối thông báo dày cộp ở đáy card bằng **Micro-Badge** hoặc **thanh ghi chú 1 dòng siêu gọn (Single-Line Compact Strip)**, giúp chiều cao của Pad 1 không bị phình to bất thường so với Pad 2.
- Đồng bộ `height: 100%` với container cha để 2 pad luôn bằng nhau chằn chặn.

## 2. File Chỉnh Sửa
- `src/renderer/components/Analytics/charts/RevenueCogsComboChart.tsx`

## 3. Các Bước Thực Hiện
1. **Thiết kế lại Header:**
   - Cột trái: Tiêu đề + Subtitle (thu gọn khoảng cách dòng).
   - Cột phải: Gom nút Segmented Toggle `[Chuẩn kỳ VSA 520] [Sổ sách (31/12)]` và cụm nút bật/tắt chuỗi dữ liệu (`Doanh thu 511`, `Giá vốn 632`, `Biên lãi gộp %`) trên cùng 1 hàng ngang linh hoạt (`flex-wrap: wrap; gap: 8px`).
2. **Thu gọn Khối Thông Báo Ở Chân Biểu Đồ:**
   - Thay vì thẻ `div` to nhiều dòng, chuyển thành thanh thông báo 1 dòng viền bo tròn tinh tế:
     - Chế độ Chuẩn kỳ: `[Chuẩn kỳ VSA 520] Chuẩn hóa giá vốn theo chi phí SX thực tế từng tháng (doanh nghiệp dồn kết chuyển 31/12).`
     - Chế độ Sổ sách: `[Sổ sách 31/12] Kế toán dồn 100% giá vốn vào 31/12 (Biên gộp T1-T11 đạt 100%, T12 âm cực đoan).`
3. **Cân đối SVG:**
   - Thang đo trục X rộng hơn do có bề ngang 50% (~700px), các cột bar giãn cách đẹp mắt, không còn bị chen lấn.

## 4. Tiêu Chí Kiểm Tra
- Header hiển thị gọn gàng, không tràn dòng vụn vặt.
- Chiều cao Pad 1 giảm từ ~420px xuống ~360px, tương thích hoàn toàn với Pad 2.
