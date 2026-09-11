# Phase 3: Cập nhật giao diện ExpenseByNatureTable.tsx & Ghi chú kiểm toán

## Mục tiêu
Hiển thị giao diện Thuyết minh BCTC sắc nét, minh bạch và chuyên nghiệp:
1. Hiển thị rõ số phát sinh thuần của 5 yếu tố chi phí.
2. Hiển thị rõ số phát sinh thuần của Chi phí P&L (Nợ - Có 632, 641, 642).
3. Đổi badge kiểm tra chênh lệch sang màu xanh ngọc:
   `✓ Cân đối Thuyết minh (0 đ)`.
4. Dòng ghi chú kiểm toán:
   `✓ Khớp 100%: Số liệu 5 yếu tố chi phí và biến động tồn kho đã cân đối hoàn hảo với tổng chi phí sản xuất kinh doanh P&L (bao gồm các nghiệp vụ kết chuyển bù trừ và hàng bán trả lại).`

## File tác động
- `src/renderer/components/Analytics/ExpenseByNatureTable.tsx`
