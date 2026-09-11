# Nhật Ký Kỹ Thuật: Hoàn Thành Sửa Lỗi Lệch Cột Footer Mẫu E380 & Chống Xuống Dòng Bảng Thuế

- **Ngày thực hiện:** 2026-09-11
- **Phân hệ:** Analytics & Thống Kê Thuế (Mẫu E380 & E381)
- **Mã kế hoạch:** `plans/260911-1515-fix-tax-analytics-column-shift-and-text-wrapping`
- **Trạng thái:** Hoàn thành 100%

---

## 1. Vấn Đề Gốc Rễ Đã Khắc Phục
1. **Lỗi lệch cột dòng CỘNG CẢ NĂM (Bảng B.1 - Mẫu E380):**
   - Thiếu mất thẻ `<td>` của cột `Xin Hoàn [42]` trong dòng tổng cộng, làm toàn bộ 8 ô số liệu phía sau (Phải nộp [40], Số dư [43], PS Nợ 133*, CL Đầu vào, PS Có 33311, CL Đầu ra, Đã nộp, Ghi chú) bị xô lệch 1 cột sang bên trái.
2. **Chữ bị xuống hàng lắt nhắt gây khó chịu:**
   - Các tiêu đề `<th>` thiếu `whiteSpace: 'nowrap'` nên khi bảng co hẹp, các từ bị bẻ gãy (`VAT` / `Đầu` / `Ra` / `[35]`).
   - Cột Kỳ Kê Khai chỉ rộng `110px` khiến `"Tháng 06/2026"` bị bẻ thành 2 dòng, kéo giãn chiều cao cả hàng.
   - Bảng B.2 (TNCN): Lặp lại chữ "Thuế TNCN khấu trừ -" ở cả 4 cột làm tiêu đề dài thượt và ngắt dòng 3 hàng.

## 2. Giải Pháp Đã Triển Khai
1. **Khớp 100% 14 cột dòng CỘNG CẢ NĂM:**
   - Bổ sung ô `totalRefund42` vào đúng vị trí giữa `totalAdjustDecrease37` và `totalTaxPayable40`.
   - Toàn bộ các cột `Số Dư [43]`, `PS Nợ 133*`, `CL Đầu Vào`, `PS Có 33311`, `CL Đầu Ra`, `Đã Nộp` và `Ghi Chú` trở về đúng cột tương ứng 100%.
2. **Chống xuống dòng toàn diện & Tối ưu bố cục:**
   - Thêm `whiteSpace: 'nowrap'` cho toàn bộ Header `<th>` và ô số liệu `<td>` của cả Bảng B.1 và Bảng B.2.
   - Nới rộng cột Kỳ Kê Khai / Kỳ Khai lên `140px`: Chuỗi `"Tháng 06/2026"` nằm ngay ngắn trên 1 dòng duy nhất, badge `"Chính thức"` nằm gọn gàng bên cạnh.
   - Bảng B.2: Rút gọn tiêu đề Tầng 2 thành `Cá nhân cư trú`, `Cá nhân không cư trú`, `Tổng khấu trừ (1)`, `Thuế khấu trừ (2) [Có 3335]` cực kỳ súc tích, chuẩn Mẫu E381.
   - Cột Ghi chú: Hiển thị từng bullet rõ ràng thay vì một đoạn text dài nối nhau bằng dấu chấm phẩy.
   - Chiều cao hàng rút gọn từ ~65px xuống ~38px, bảng thanh thoát và dễ nhìn.

## 3. Kết Quả Kiểm Thử
- `tests/tax-cross-reconciler.test.ts`: 4/4 tests pass 100%.
- Toàn bộ test suite dự án: 86 test files, 393 tests pass 100%.
- TypeScript `npm run typecheck`: 0 lỗi.
