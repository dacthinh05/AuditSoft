# Plan: Rà Soát Bút Toán Kết Chuyển Ngược & Triệt Tiêu 100% Độ Lệch Thuyết Minh Chi Phí Yếu Tố (VAS 01 / TT 200)

## 1. Bối Cảnh & Vấn Đề (Problem Statement)
Trên màn hình **Ma Trận Chi Phí Theo Yếu Tố 12 Tháng & Cân Đối Thuyết Minh BCTC**, hệ thống đang báo độ lệch kiểm tra **`4.098.859.405 đ`** (cảnh báo đỏ):
- **Nguyên nhân cốt lõi**:
  1. **Các bút toán giảm chi phí (Credit 62x / 64x) chưa được trừ bù trừ (Netting)**:
     - Các khoản giảm chi phí như: thu hồi phế liệu nhập kho (`Nợ 152 / Có 154`), bồi thường trừ lương (`Nợ 334 / Có 622, 627, 642`), chiết khấu giảm giá được hạch toán bên Có của tài khoản chi phí.
     - Hiện tại bot chỉ cộng dồn phát sinh Nợ mà không trừ đi các khoản ghi Có giảm trừ này, khiến Tổng 5 yếu tố bị đội lên.
  2. **Các bút toán kết chuyển ngược hoặc xuất dùng nội bộ không qua 632**:
     - Hàng bán bị trả lại nhập lại kho thành phẩm (`Nợ 155 / Có 632`).
     - Xuất kho thành phẩm dùng nội bộ / khuyến mại / phúc lợi (`Nợ 641, 642 / Có 155`).
     - Chi phí sản xuất vượt định mức hoặc CPSX chung cố định dưới công suất kết chuyển thẳng sang giá vốn (`Nợ 632 / Có 154, 627`) không qua kho 155.
  3. **Thiếu tính toán bù trừ trên chi phí P&L**:
     - Tổng chi phí P&L phải lấy theo số phát sinh thuần: `(Nợ 632 - Có 632) + (Nợ 641 - Có 641) + (Nợ 642 - Có 642)`.

## 2. Mục Tiêu (Outcome)
- **Đảm bảo 100% độ lệch kiểm tra triệt tiêu về 0 đ (Cân đối hoàn hảo)**:
- [x] **Phase 1: Rà soát & Bóc tách ma trận đối ứng 2 chiều trong `ExpenseByNatureEngine.ts`**
  - Quét riêng các khoản ghi Có giảm chi phí (Có 621, Có 622, Có 627, Có 641, Có 642) để tính 5 Yếu tố phát sinh thuần (Net Nature Expenses).
  - Quét các khoản ghi Có giảm giá vốn (Có 632 đối ứng 155 - hàng bán bị trả lại, hoặc đối ứng 154).
  - Nhận diện các bút toán xuất kho thành phẩm dùng nội bộ (`Nợ 641, 642 / Có 155`) và chi phí vượt định mức (`Nợ 632 / Có 154, 627`).

- [x] **Phase 2: Hoàn thiện phương trình kế toán cân đối Thuyết minh BCTC**
  - Cập nhật công thức:
    $$\text{Tổng 5 yếu tố thuần} + \Delta\text{Kho 154} + \Delta\text{Kho 155} + \text{Giá vốn thương mại 156} = \text{Chi phí P&L thuần (Nợ - Có 632, 641, 642)}$$
  - Đảm bảo khi chạy trên bất kỳ bộ số liệu nào (dù có hay không có CĐSPS), phương trình đều cân bằng tuyệt đối (sai số = 0 đ).

- [x] **Phase 3: Cập nhật giao diện `ExpenseByNatureTable.tsx` & Ghi chú kiểm toán**
  - Thêm dòng bóc tách nếu có các khoản giảm trừ đặc thù (Hàng bán trả lại / Giảm giá vốn / Dùng nội bộ).
  - Hiển thị badge xanh ngọc `✓ Cân đối Thuyết minh (0 đ)`.

- [x] **Phase 4: Kiểm thử tự động với dữ liệu thực tế & Typecheck**
  - Viết test case mô phỏng đầy đủ các nghiệp vụ kết chuyển ngược (hàng bán trả lại, thu hồi phế liệu, chi phí vượt định mức).
  - Chạy `npx vitest run tests/expense-by-nature-balance.test.ts`.
  - Chạy `npx tsc -p tsconfig.web.json --noEmit` & `npx tsc -p tsconfig.node.json --noEmit`.
