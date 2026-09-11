# Plan: Nhận Diện Thông Minh Sheet Sổ NKC & Nâng Cấp Giao Diện Chọn Sheet / Ghép Cột

## Tổng Quan

Khi người dùng import file Excel có nhiều sheet (hoặc dán dữ liệu từ Clipboard), hệ thống gặp 3 vấn đề gây nhầm lẫn:
1. **Thuật toán chọn sheet ban đầu quá sơ sài:** `reconcileSlice.ts` luôn lấy mặc định `meta.sheets[0]` (thường là Sheet bìa, Hướng dẫn, hoặc CDPS) thay vì tìm sheet Sổ Nhật ký chung thực sự.
2. **Giao diện chọn lại Sheet bị ẩn hoặc quá mờ:** Dropdown chọn sheet chỉ hiện khi `sheets.length > 1` dưới dạng thanh nhỏ 12px, không có thông tin số dòng, độ tin cậy hay nút đổi sheet rõ ràng.
3. **Chế độ Clipboard gây hiểu lầm là file Excel:** Khi dán clipboard, dropdown 6 cột bị thiếu các options chỉ mục `0, 1, 2...` nên hiển thị toàn bộ thành `-- Chưa chọn --` màu đỏ `!`, khiến người dùng tưởng hệ thống nhận diện sai cột hoặc sai sheet.

Kế hoạch này giải quyết dứt điểm 3 vấn đề trên để người dùng luôn được tự động chọn đúng sheet NKC và có quyền chủ động đổi sheet bất kỳ lúc nào.

---

## Danh Sách Các Phase Thực Thi

- [ ] **Phase 01: Thuật Toán Nhận Diện Thông Minh Sheet Sổ NKC (`pickBestNkcSheet`)**
  - File: `plans/260910-1730-smart-sheet-recognition-and-selector/phase-01-smart-sheet-picker.md`
  - Mục tiêu: Bổ sung hàm `pickBestNkcSheet` trong `reconcileSlice.ts` để tự động chọn sheet có tên chứa `NKC`, `NhatKyChung`, `GL` hoặc có điểm nhận diện TT200 (`confidence`) cao nhất.

- [ ] **Phase 02: Nâng Cấp Giao Diện Thanh Chọn Sheet & Khắc Phục Ghép Cột Clipboard**
  - File: `plans/260910-1730-smart-sheet-recognition-and-selector/phase-02-prominent-sheet-selector-and-clipboard-mapping-ui.md`
  - Mục tiêu:
    - Hiển thị thanh chọn Sheet nổi bật: `📄 Sheet đang đọc: [NKC ▾] (15.230 dòng · Độ khớp: 95%)`.
    - Thêm nút chuyển đổi rõ ràng giữa File Excel và Clipboard.
    - Sửa dropdown ghép 6 cột ở chế độ Clipboard để hiển thị đúng `Cột 1`, `Cột 2`... kèm dấu tích xanh `✓`, không còn báo đỏ `-- Chưa chọn --`.

- [ ] **Phase 03: Kiểm Thử & Nghiệm Thu Giao Diện**
  - File: `plans/260910-1730-smart-sheet-recognition-and-selector/phase-03-verification-and-testing.md`
  - Mục tiêu: Viết unit test cho `pickBestNkcSheet`, kiểm tra import workbook nhiều sheet, kiểm tra clipboard mode, build và typecheck pass 100%.

---

## Bản Đồ Rủi Ro & Ranh Giới

- **Bảo toàn dữ liệu:** Người dùng đổi sheet phải tự động cập nhật lại `headerRow` và `suggestedMapping` của sheet mới đó.
- **Không phá vỡ luồng dán Clipboard:** Vẫn hỗ trợ đầy đủ cả 2 phương thức: nạp file Excel và dán từ clipboard.
