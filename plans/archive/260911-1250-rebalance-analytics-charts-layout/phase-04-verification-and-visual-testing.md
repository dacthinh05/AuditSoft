# Phase 4: Kiểm Thử Giao Diện, Đồng Bộ Chiều Cao & Nghiệm Thu

## 1. Mục Tiêu
- Kiểm tra trực quan toàn bộ bố cục Section 6 trên nhiều độ phân giải màn hình (1366px, 1440px, 1920px).
- Xác nhận Pad 1 và Pad 2 có chiều cao bằng nhau tuyệt đối, không có khoảng hở hay hụt đáy.
- Chạy `npm run typecheck` và toàn bộ unit test suite để bảo đảm 0 lỗi phát sinh.

## 2. Các Bước Kiểm Tra
1. **Kiểm tra Bố cục:**
   - Hàng 1: 2 Pad (Doanh thu-Giá vốn & Cơ cấu chi phí) nằm song song, tỷ lệ 50/50.
   - Hàng 2: Pad OPEX nằm full-width, cân đối hoàn hảo với bảng cầu nối lợi nhuận và ma trận chi phí.
2. **Kiểm tra Tương tác:**
   - Chuyển đổi giữa chế độ `[Chuẩn kỳ VSA 520]` và `[Sổ sách (31/12)]` trên Pad 1 hoạt động trơn tru.
   - Tooltip hover trên cả 3 đồ thị hoạt động chính xác.
   - Bật/tắt các chuỗi dữ liệu (Doanh thu, Giá vốn, Biên gộp) hiển thị đúng logic.
3. **Kiểm thử Kỹ thuật:**
   - `npm run typecheck` (0 errors).
   - `npm test` (385/385 tests pass).
