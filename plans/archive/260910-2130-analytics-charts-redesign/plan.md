# Plan: Nâng Cấp Trực Quan Hóa & Trải Nghiệm Đọc Dữ Liệu Bộ 3 Biểu Đồ Phân Tích (Analytics Charts Redesign)

## 1. Bối Cảnh & Vấn Đề (Context & Problem)
Dựa trên phản hồi người dùng và ảnh chụp màn hình thực tế:
- **Biểu đồ 1 (`RevenueCogsComboChart`):** Dual-axis (trục trái VNĐ, trục phải %) làm đường Biên lãi gộp chạy ngang cắt ngang thân các cột Doanh thu & Giá vốn. Các tháng biên lãi âm không được làm nổi bật trực quan ngay trên biểu đồ mà chỉ có dòng cảnh báo nhỏ bên dưới.
- **Biểu đồ 2 (`CogsStructureStackedChart`):** Dạng 100% Stacked Bar khiến các tháng trông như một dải phẳng lì (~76.3% dở dang/mua ngoài), che giấu hoàn toàn quy mô biến động chi phí thực tế giữa các tháng (tháng nào chi phí đột biến).
- **Biểu đồ 3 (`OpexRatioAreaChart`):** Diện tích Area chart xếp chồng tạo dải màu mờ ảo, khó xác định ranh giới giữa CP Quản lý và CP Bán hàng, nhãn trục Y mờ nhạt, thiếu đường chuẩn benchmark.

## 2. Mục Tiêu (Outcome)
- Biến các biểu đồ thành công cụ phân tích kiểm toán sắc nét: **Đập vào mắt là thấy ngay điểm bất thường, quy mô chi phí và xu hướng**.
- Giữ nguyên bố cục 3 card hiện tại nhưng nâng cấp UX/UI và logic hiển thị của từng biểu đồ SVG thuần (không thêm thư viện ngoài nặng nề).

## 3. Các Giai Đoạn Triển Khai (Phases)

- [x] **Phase 1: Tối ưu `RevenueCogsComboChart` (Doanh thu, Giá vốn & Biên lãi)**
  - Tách bạch không gian hiển thị hoặc vẽ đường Baseline 0% rõ ràng cho Biên lãi gộp.
  - Thêm visual badge / highlight đỏ trực tiếp tại các tháng có biên lãi gộp âm (`< 0%`) trên biểu đồ (nút điểm đỏ nổi bật, nhãn giá trị âm bên cạnh điểm).
  - Tối ưu khoảng cách giữa các cột Doanh thu (511) và Giá vốn (632) để biểu đồ thông thoáng, dễ đọc nhãn tháng T1 - T12.

- [x] **Phase 2: Nâng cấp `CogsStructureStackedChart` (Cơ cấu chi phí giá vốn)**
  - Thêm Toggle chuyển đổi linh hoạt: **Giá trị thực (VNĐ/Tỷ đồng)** vs **Tỷ trọng (%)** (mặc định hiển thị giá trị thực để thấy rõ tháng đột biến chi phí).
  - Tối ưu màu sắc và nhãn giá trị, thêm thanh chỉ báo tháng có tổng chi phí cao nhất năm.
  - Hiển thị tooltip rõ nét kèm tỷ lệ % và số tiền tương ứng cho từng khoản mục 621, 622, 627, 154/156.

- [x] **Phase 3: Tối ưu `OpexRatioAreaChart` (Tỷ lệ chi phí hoạt động OPEX)**
  - Chuyển từ Area gradient mờ sang biểu đồ đường đa tầng (Multi-line chart) sắc nét với data points rõ ràng hoặc Stacked Area có viền phân định dứt khoát.
  - Bổ sung đường nét đứt Benchmark / Mức trung bình năm của Tổng OPEX kèm nhãn tham chiếu.
  - Highlight các tháng có tỷ lệ OPEX vượt ngưỡng cảnh báo (ví dụ: > trung bình hoặc > 20%).

- [x] **Phase 4: Kiểm thử, Thẩm mỹ (UI/UX Review) & Hoàn thiện**
  - Chạy kiểm tra TypeScript (`tsc` / `lint`).
  - Kiểm tra tính responsive trên các độ phân giải màn hình khác nhau.
  - Đảm bảo tooltip hiển thị mượt mà, không bị che khuất.
