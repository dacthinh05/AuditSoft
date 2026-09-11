# Phase 02: Tái cấu trúc TimelineRiskChart (12 Tháng & Cảnh báo Cutoff 31/12)

## Mục tiêu
Biến biểu đồ 12 tháng từ các cột rời rạc mờ nhạt thành biểu đồ trực quan, hiển thị trực tiếp giá trị số tiền trên cột cao, và tách biệt rõ ngày chốt sổ 31/12 với rủi ro Cutoff.

## File tác động
- `src/renderer/components/DataProfiler/TimelineRiskChart.tsx`
- `src/renderer/styles.css`

## Chi tiết thực hiện
1. Cập nhật `TimelineRiskChart.tsx`:
   - Nâng chiều cao biểu đồ lên 75px – 80px để các cột có độ phân giải tỷ lệ tốt hơn.
   - Thêm nhãn số tiền nổi (Floating Money Tag) trên đầu các cột có phát sinh lớn (hoặc cột được chọn) để xem nhanh không cần rê chuột.
   - Thêm dải phân cách nét đứt (`.timeline-divider`) giữa tháng T12 và cột ngày 31/12 để người dùng hiểu 31/12 là điểm kiểm tra kiểm toán đặc biệt chứ không phải một tháng trong năm.
   - Tối ưu cột 31/12 với gradient rực rỡ và nhãn `31/12 (Cutoff)` để nổi bật.
2. Cập nhật `styles.css`:
   - Định dạng `.timeline-bars-container` với nền sáng, bo góc mượt, lưới phụ trợ (subtle horizontal guide lines).
   - Thiết kế nhãn số tiền `.bar-top-value`: nhỏ gọn (9.5px), font đậm, màu tương ứng với giá trị.
   - Nâng cấp pill cảnh báo `.cutoff-alert-pill`: hiệu ứng pulsing dot hoặc viền sáng nổi bật, nhấn mạnh số bút toán và số tiền đột biến ngày 31/12.
   - Trạng thái hover/selected cột: scale nhẹ, tooltip hoặc highlight sắc nét.

## Tiêu chí nghiệm thu (Acceptance Criteria)
- Các tháng có phát sinh lớn như T09, T12 hiển thị số tiền rõ ràng trên cột.
- Cột 31/12 được nhận diện ngay là rủi ro khóa sổ, phân cách rõ với chuỗi 12 tháng.
- Bấm vào cột hoặc pill lọc chính xác dữ liệu bảng bên dưới.
