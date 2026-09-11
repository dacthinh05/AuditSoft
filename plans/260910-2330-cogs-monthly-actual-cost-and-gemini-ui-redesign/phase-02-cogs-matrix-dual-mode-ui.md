# Phase 2: Nâng Cấp UI Ma Trận Giá Vốn (Dual-Perspective Toggle)

## 1. Mục Tiêu
- Bổ sung bộ điều khiển lựa chọn chế độ phân tích tỷ lệ biên ngay trên thanh công cụ của Ma Trận:
  + Nút chọn: `[Theo Sổ Sách 632]` | `[Theo Chi Phí Thực Tế (CPSX)]`.
- Khi người dùng bấm chọn `[Theo Chi Phí Thực Tế (CPSX)]`:
  + Cột tỷ lệ sẽ chuyển đổi tiêu đề và số liệu thành: `% CPSX / DT`.
  + Các tháng 01 - 11 sẽ hiển thị tỷ lệ phần trăm chi phí sản xuất thực tế phát sinh chia cho doanh thu (ví dụ `25.5%`, `21.5%` thay vì `-`).
  + Rê chuột vào từng ô tỷ lệ sẽ có Tooltip giải thích chi tiết: *"Chi phí SX phát sinh trong tháng: xxx đ / Doanh thu 511: yyy đ = z% (Bóc tách theo chi phí thực tế, không phụ thuộc thời điểm kết chuyển 632)"*.
- Khi người dùng bấm chọn `[Theo Sổ Sách 632]`:
  + Cột tỷ lệ giữ nguyên `% GV 632 / DT` theo số liệu kế toán đã hạch toán.
  + Cột Cảnh Báo Kiểm Toán VSA 520 làm nổi bật cờ `🔴 Dồn giá vốn T12` và `🟠 Treo CPSX (Chưa ghi 632)` để KTV lưu ý rủi ro Cutoff / Matching.

## 2. Các Tệp Tin Thay Đổi
- `src/renderer/components/Analytics/CogsMatrix12MTable.tsx`:
  + Bổ sung state `ratioMode: 'COGS_632' | 'ACTUAL_CPSX'`.
  + Tích hợp UI Segmented Button hoặc Dropdown chọn chế độ xem.
  + Điều chỉnh render cột `% GV / DT` thành linh hoạt theo `ratioMode`.
  + Tối ưu hiển thị badge trạng thái doanh nghiệp (`SẢN XUẤT / XÂY LẮP`, `THƯƠNG MẠI`, `HỖN HỢP`).
- `src/renderer/styles.css`:
  + Định kiểu cho cụm nút chọn chế độ phân tích giá vốn.
  + Thêm visual indicator (màu sắc phân biệt giữa biên 632 và biên CPSX).
  + Tối ưu responsive bảng để không bị vỡ layout khi màn hình nhỏ.

## 3. Tiêu Chí Hoàn Thành (Pass Criteria)
- KTV có thể chuyển đổi qua lại giữa 2 chế độ mượt mà, không giật lag.
- Các tháng trước đây bị `-` ở cột tỷ lệ nay hiển thị chính xác % CPSX khi chọn chế độ Chi phí thực tế.
