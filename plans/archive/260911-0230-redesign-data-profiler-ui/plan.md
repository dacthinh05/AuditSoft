# Kế hoạch Thiết kế lại UI Data Profiler & Timeline Rủi ro Khóa Sổ

Tái cấu trúc UI của thanh **Trực Quan Hóa Dữ Liệu & Phân Tích Rủi Ro (Data Profiler)** tại `src/renderer/components/DataProfiler/` và `styles.css` theo phong cách **Modern Fintech / Audit Dashboard** (Phương án A):
- Phân tầng giá trị trực quan hóa với màu sắc phân cấp rủi ro (Xanh lá -> Xanh dương -> Vàng hổ phách -> Đỏ san hô).
- Biểu đồ thời gian 12 tháng hiển thị nhãn số tiền nổi trên các cột có số liệu, tách biệt rõ ràng cột Cutoff 31/12 với dải phân cách và badge nổi bật.
- Cải thiện UX lọc dữ liệu 1-click mượt mà, phản hồi visual rõ nét.

## Danh sách Phases

1. **Phase 01: Thiết kế lại Amount Tiers Panel (Phân tầng rủi ro giá trị)**
   - Nâng cấp `AuditDataProfilerBar.tsx` và `styles.css`.
   - 4 card phân tầng theo cấp độ rủi ro kiểm toán:
     - `LOW` (< 50tr): Green tint, nhãn "Nhỏ lẻ / An toàn".
     - `MEDIUM` (50 - 500tr): Blue tint, nhãn "Trung bình".
     - `HIGH` (500tr - 2 tỷ): Amber tint, nhãn "Đáng lưu ý".
     - `KEY_ITEM` (> 2 tỷ): Coral/Rose tint, nhãn "Trọng yếu 🚨".
   - Typography phân cấp rõ ràng: Số tiền to đậm, thanh tiến độ dày 6px bo tròn mềm mại.
   - Thêm trạng thái Active/Hover hiện đại với viền đổ bóng tinh tế.

2. **Phase 02: Tái cấu trúc TimelineRiskChart (12 Tháng & Cảnh báo Cutoff 31/12)**
   - Nâng cấp `TimelineRiskChart.tsx` và `styles.css`.
   - Tăng chiều cao biểu đồ từ 56px lên 80px để thông thoáng, dễ quan sát.
   - Hiển thị trực tiếp nhãn số tiền viết tắt (`963 tr`, `18.1 tỷ`...) ngay phía trên đỉnh các cột có số liệu lớn mà không cần hover.
   - Thiết kế vách ngăn nét đứt (dashed divider) giữa T12 và cột 31/12 để tách biệt rõ trục 12 tháng liên tục và ngày chốt sổ đột biến.
   - Nâng cấp nút/cột Cutoff 31/12 thành cụm cảnh báo nổi bật với badge nhấp nháy/gradient rực rỡ và thông số rõ ràng.

3. **Phase 03: Kiểm thử & Đánh giá hiển thị trực quan (Verification)**
   - Kiểm tra build TypeScript (`npm run build` hoặc `tsc --noEmit`).
   - Kiểm tra các tương tác lọc: Bấm chọn Tiers, bấm chọn tháng, bấm chọn Cutoff 31/12, nút Xóa lọc.
   - Kiểm tra tính tương thích responsive trên các độ phân giải màn hình.
