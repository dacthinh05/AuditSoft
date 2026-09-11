# Giai đoạn 1: Gỡ bỏ rendering badge khỏi cột Chỉ tiêu

## Nhiệm vụ
1. Mở file `src/renderer/components/Analytics/GlAnalyticsTab.tsx`.
2. Tìm khối render cột `Chỉ tiêu` trong bảng `kqkdYoY.rows.map((r) => ...)`:
   - Xóa bỏ thẻ `<span ...>{r.maSo === '60' ? 'LỖ GỘP' : 'LỖ HĐKD'}</span>` khi `isLoss`.
   - Xóa bỏ thẻ `<span ...>BIẾN ĐỘNG</span>` khi `isAnomaly && !isLoss`.
3. Giữ nguyên text `<span>{r.chiTieu}</span>` cùng màu sắc phân biệt `color: isLoss ? '#991b1b' : '#0f172a'`.
4. Làm sạch các biến không còn dùng đến nếu cần thiết (giữ lại `isLoss` và `isAnomaly` cho style hàng và style cột %).

## File chỉnh sửa
- `src/renderer/components/Analytics/GlAnalyticsTab.tsx`
