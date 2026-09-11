# Phase 01: Đảo Chiều Ma Trận 12 Tháng Sang Cấu Trúc Chuẩn SaaS

## 1. Mục Tiêu
Chuyển đổi ma trận phân tích biến động 12 tháng trong `src/renderer/components/Analytics/GlAnalyticsTab.tsx` từ dạng bảng ngang (cột tháng) sang bảng dọc chuẩn mực kế toán kiểm toán:
- **Cột bên trái cố định**: Kỳ kế toán từ `Tháng 01` đến `Tháng 12`.
- **Hàng ngang (Header cột)**: 8 khoản mục tài chính chính + 1 cột `TỔNG PHÁT SINH THÁNG`.
- **Hàng cuối cùng**: `TỔNG CỘNG CẢ NĂM` (In đậm, viền nổi bật).

## 2. Chi Tiết Cấu Trúc Bảng Mới
1. **Các cột (Header Table)**:
   - Cột 1: `Kỳ Kế Toán` (Sticky bên trái, nền `#f8fafc` hoặc màu thẻ, font bold).
   - Cột 2: `Doanh thu (511)`
   - Cột 3: `Mua kho (15x)`
   - Cột 4: `Giá vốn (632)`
   - Cột 5: `CP Bán hàng (641)`
   - Cột 6: `CP QLDN (642)`
   - Cột 7: `CP Tài chính (635)`
   - Cột 8: `Doanh thu TC (515)`
   - Cột 9: `CP Khác (811)`
   - Cột 10: `TỔNG THÁNG` (Căn phải, in đậm, tổng tiền phát sinh của tháng đó).
2. **Các dòng dữ liệu (Dòng 1 đến Dòng 12)**:
   - Dòng 1 tương ứng với Tháng 1, dòng 12 tương ứng với Tháng 12.
   - Các ô không phát sinh tiền hiển thị dấu `-` màu xám nhạt `#94a3b8` (thay vì để số 0 thô kệch).
   - Ô có biến động đột biến (`anomalyMonths.includes(m)`): Viền màu hổ phách `border: 1px solid #fde68a`, nền `background: #fffbeb`, chữ `color: #b45309`, có nhãn nhỏ `(!)` hoặc `Lệch` nhẹ nhàng, **bỏ hoàn toàn emoji `⚠️`**.
3. **Dòng thứ 13: TỔNG PHÁT SINH CẢ NĂM**:
   - Nền xám nhạt `#f1f5f9`, viền trên đôi `borderTop: 2px solid #cbd5e1`.
   - Cột 1: `CẢ NĂM` (In hoa, bold).
   - Cột 2..9: Tổng số tiền cả năm của từng khoản mục.
   - Cột 10: Tổng phát sinh toàn bộ niên độ (Màu xanh dương `#1d4ed8` nổi bật).

## 3. Tiêu Chí Nghiệm Thu
- Bảng hiển thị đúng 13 dòng và 10 cột.
- Không còn phải kéo thanh cuộn ngang quá dài để đọc từ T1 đến T12.
- Kiểm toán viên đọc từ trên xuống dưới theo diễn tiến thời gian tự nhiên.
