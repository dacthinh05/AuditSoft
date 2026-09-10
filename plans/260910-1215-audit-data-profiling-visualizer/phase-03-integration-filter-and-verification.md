# Phase 03: Tích Hợp Vào ResultsPage, Bộ Lọc Tương Tác 1-Click & Kiểm Thử Toàn Diện

## 1. Mục Tiêu
Tích hợp thanh Profiler vào `ResultsPage.tsx`, kết nối tương tác nhấp chọn (Click-to-Filter) giữa biểu đồ và bảng `VirtualTable`, đảm bảo trải nghiệm tức thì không độ trễ và toàn bộ hệ thống kiểm thử tự động đạt 100%.

## 2. Các Điểm Tích Hợp Chính
1. **Kết nối State lọc trong `ResultsPage.tsx`**:
   - Khai báo state lọc bổ sung: `selectedMonth: number | null` (1-12 hoặc 13 cho ngày 31/12), `selectedTier: AmountTierKey | null`.
   - Kết hợp vào hàm `applyMainFilter` để lọc đồng thời theo nguồn, từ khóa tìm kiếm, tài khoản, tháng và phân tầng số tiền.
2. **Nút Bật/Tắt Profiler Panel trên thanh công cụ**:
   - Thêm nút chuyển đổi: `[📊 Phân tích trực quan]` trên thanh header của `ResultsPage`.
   - Lưu trạng thái mở/đóng vào local state để người dùng tùy biến không gian làm việc.
3. **Nút "Xóa bộ lọc trực quan" tiện lợi**:
   - Khi đang kích hoạt lọc theo tháng hoặc phân tầng tiền, hiển thị chip thông báo rõ ràng kèm nút "X" để hoàn tác về toàn bộ danh sách.

## 3. Danh Sách File
- **Chỉnh sửa**: `src/renderer/pages/ResultsPage.tsx`
- **Chỉnh sửa**: `src/domain/pipeline/mainReport.ts` (nếu cần bổ sung tham số lọc tháng/tier)

## 4. Kịch Bản Kiểm Thử & Nghiệm Thu (Verification)
1. **Kiểm thử logic**: Chạy `npm run test` đảm bảo 100% unit tests và volume tests pass.
2. **Kiểm thử typecheck**: `npm run typecheck` đạt 0 lỗi.
3. **Kiểm thử trải nghiệm thực tế**:
   - Mở màn hình Kết Quả Đối Chiếu -> Thấy thanh Profiler hiện 12 tháng và phân tầng tiền.
   - Bấm vào cột "Tháng 12" -> Bảng bên dưới lọc ngay về các chứng từ tháng 12.
   - Bấm vào nút phân tầng ">2 tỷ" -> Bảng lọc ngay các giao dịch lớn nhất.
   - Bấm "Xóa bộ lọc" -> Bảng quay về hiển thị toàn bộ.
