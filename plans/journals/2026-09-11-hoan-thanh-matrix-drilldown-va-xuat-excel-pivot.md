# Nhật Ký Kỹ Thuật: Hoàn Thành Drilldown Chi Tiết Bút Toán Ma Trận 12 Tháng & Xuất Excel Dạng Pivot

- **Ngày thực hiện:** 2026-09-11
- **Phân hệ:** Analytics & Ma Trận 12 Tháng (VSA 520)
- **Mã kế hoạch:** `plans/260911-1440-matrix-drilldown-and-pivot-excel`
- **Trạng thái:** Hoàn thành 100%

---

## 1. Bối Cảnh & Vấn Đề Giải Quyết
Trên bảng **Ma Trận Biến Động 12 Tháng Theo Khoản Mục**, trước đây người dùng chỉ có thể rê chuột xem tooltip ngắn giải thích biến động. Khi cần kiểm tra các con số đột biến (như Tháng 02 Chi phí tài chính 635 vọt lên 5.84 tỷ), KTV không thể click xem danh sách các chứng từ cụ thể cấu thành nên số tiền đó.

## 2. Các Thay Đổi Kiến Trúc & Triển Khai
1. **Component Modal Chi Tiết Bút Toán (`MatrixDrilldownModal.tsx`):**
   - Lọc tức thì từ `glSnapshot.journals` trong RAM theo cột khoản mục và tháng hạch toán.
   - Sử dụng `VirtualTable` đảm bảo cuộn mượt mà 60fps cho hàng nghìn dòng.
   - Tìm kiếm nhanh đa trường: Số CT, diễn giải, tài khoản, số tiền.
   - Thống kê tổng số tiền và số lượng bút toán khớp 100% với ô ma trận.
2. **Engine Xuất Excel 2 Sheet Dạng Pivot (`exportMatrixDrilldownExcel.ts`):**
   - **Sheet 1 (`TongHop_Pivot`):**
     + Khối 1: Bảng Pivot phân tích cơ cấu theo cặp TK Đối ứng (Nợ/Có), số lượng, số tiền, tỷ trọng %.
     + Khối 2: Bảng Top 15 bút toán lớn nhất phục vụ bốc mẫu kiểm toán (VSA 530).
   - **Sheet 2 (`ChiTiet_SoCai`):**
     + Sổ chi tiết toàn bộ các dòng phát sinh, kích hoạt sẵn AutoFilter và Freeze Panes tiêu đề.
3. **Tương tác trên Bảng Ma Trận (`GlAnalyticsTab.tsx`):**
   - Ô đột biến `AnomalyCell`: Bổ sung hướng dẫn *"👉 Bấm để xem chi tiết các bút toán"*, hỗ trợ click mở modal.
   - Các ô có phát sinh $> 0$: Thêm hover highlight xanh và con trỏ chuột pointer để mở modal.

## 3. Kết Quả Kiểm Thử & Nghiệm Thu
- `tests/matrix-drilldown-export.test.ts`: 3/3 tests pass (kiểm tra matching tài khoản, parse tháng và xuất Excel 2 sheet).
- Toàn bộ test suite dự án: 86 test files, 393 tests pass 100%.
- TypeScript `npm run typecheck`: 0 lỗi.
