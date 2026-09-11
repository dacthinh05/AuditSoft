---
id: "phase-01"
name: "Bóc tách đối ứng và gán W/P Ref cho D 390 và E 290 (Đợt 1 & Cả năm)"
plan: "plans/260911-1045-wp-counterparts-and-all-ajes/plan.md"
status: "pending"
priority: "P1"
effort: "45m"
files:
  - "src/domain/workingpaper/fillers/D300_ReceivableFiller.ts"
  - "src/domain/workingpaper/fillers/E200_PayableFiller.ts"
  - "src/domain/workingpaper/counterpartExtractor.ts"
  - "src/domain/workingpaper/RefDictionary.ts"
---

# Pha 1: Bóc Tách Đối Ứng Và Gán W/P Ref Cho D 390 & E 290 (Đợt 1 & Cả Năm)

## 1. Mục Tiêu
Tự động hóa hoàn toàn 2 sheet phân tích cơ cấu tài khoản đối ứng quan trọng nhất trong hồ sơ kiểm toán nợ phải thu và nợ phải trả:
- `D 390` trong file `D300` (Phải thu khách hàng - TK 131).
- `E290` trong file `E200` (Phải trả người bán - TK 331).
Mỗi sheet bao gồm 2 khối thời gian: **Đợt 1** (Tháng 01 - 06) và **Cả năm** (Tháng 01 - 12), phân tách rõ 2 bên Phát sinh Nợ và Phát sinh Có.

## 2. Đặc Tả Cấu Trúc Bảng Biểu & Tọa Độ Ô

### 2.1. Sheet `D 390` (Template `D300 - Phai thu - Mau 2025 - Thinh.xlsx`)
- **Khối Đợt 1 (Tháng 01 - 06)**:
  - Header: Dòng 14-15 (`A14: 1. PS NỢ:`, `E14: 2. PS CÓ:`).
  - Vế 1: PS NỢ (Ghi Nợ 131 / Có TK đối ứng): Dòng 16 đến 22 (7 dòng tối đa).
    - Cột A: Tham chiếu W/P Ref (lấy từ `RefDictionary.ts`).
    - Cột B: TK ĐỨ (Mã tài khoản 3 số).
    - Cột C: SỐ TIỀN (Số tiền phát sinh đối ứng).
    - Cột D: Tỷ lệ `%` (Công thức `=C16/$C$23` bảo toàn nguyên bản).
  - Vế 2: PS CÓ (Ghi Có 131 / Nợ TK đối ứng): Dòng 16 đến 22.
    - Cột E: Tham chiếu W/P Ref.
    - Cột F: TK ĐỨ.
    - Cột G: SỐ TIỀN.
    - Cột H: Tỷ lệ `%` (Công thức `=G16/$G$23`).
  - Dòng 23: Dòng CỘNG (`B23: CỘNG`, `C23: =SUM(C16:C22)`, `G23: =SUM(G16:G22)`).
  - Dòng 27: Nhận xét kiểm toán (`B27`).

- **Khối Cả năm (Tháng 01 - 12)**:
  - Header: Dòng 32-33 (`A32: 1. PS NỢ:`, `E32: 2. PS CÓ:`).
  - Vế 1: PS NỢ: Dòng 34 đến 40 (7 dòng tối đa).
    - Cột A (Tham chiếu), Cột B (TK ĐỨ), Cột C (Số tiền), Cột D (Tỷ lệ).
  - Vế 2: PS CÓ: Dòng 34 đến 40.
    - Cột E (Tham chiếu), Cột F (TK ĐỨ), Cột G (Số tiền), Cột H (Tỷ lệ).
  - Dòng 41: Dòng CỘNG (`B41: CỘNG`, `C41: =SUM(C34:C40)`, `G41: =SUM(G34:G40)`).
  - Dòng 43: Nhận xét kiểm toán (`B43`).
  - Dòng 65-66: KẾT LUẬN (`B66: Không phát sinh bất thường...`).

### 2.2. Sheet `E290` (Template `E200 - Phai tra - Mau 2024 - Thinh.xlsx`)
- **Khối Đợt 1 (Tháng 01 - 06)**:
  - Header: Dòng 12-13.
  - Vế 1: PS NỢ: Dòng 14 đến 26 (13 dòng tối đa).
    - Cột B (TK ĐỐI ỨNG), Cột C (SỐ TIỀN), Cột D (Tỷ lệ).
  - Vế 2: PS CÓ: Dòng 14 đến 26.
    - Cột F (TK ĐỐI ỨNG), Cột G (SỐ TIỀN), Cột H (Tỷ lệ).
  - Dòng 27: Dòng Tổng cộng (`B27: Σ`, `C27: =SUM(C14:C26)`, `F27: Σ`, `G27: =SUM(G14:G26)`).
  - Dòng 29-32: KẾT LUẬN Đợt 1.

- **Khối Cả năm (Tháng 01 - 12)**:
  - Header: Dòng 34-35.
  - Vế 1: PS NỢ: Dòng 36 đến 50 (15 dòng tối đa).
    - Cột B (TK ĐỐI ỨNG), Cột C (SỐ TIỀN), Cột D (Tỷ lệ).
  - Vế 2: PS CÓ: Dòng 36 đến 50.
    - Cột F (TK ĐỐI ỨNG), Cột G (SỐ TIỀN), Cột H (Tỷ lệ).
  - Dòng 51: Dòng Tổng cộng (`B51: Σ`, `C51: =SUM(C36:C50)`, `F51: Σ`, `G51: =SUM(G36:G50)`).
  - Dòng 53-55: KẾT LUẬN Cả năm.

---

## 3. Các Bước Triển Khai Chi Tiết

1. **Cập nhật `D300_ReceivableFiller.ts`:**
   - Sử dụng `extractCounterpartStats(ctx.nkcTransactions, '131', isPeriod1)`:
     - `isPeriod1 = true` cho Khối Đợt 1 (Rows 16-22).
     - `isPeriod1 = false` cho Khối Cả năm (Rows 34-40).
   - Điền đầy đủ Cột A (Tham chiếu W/P Ref), Cột B (TK 3 số), Cột C (Số tiền) cho PS Nợ.
   - Điền Cột E, F, G cho PS Có.
   - Xóa các dòng còn trống về 0 để tránh lỗi tính toán hoặc đè rác cũ.
   - Điền kết luận kiểm toán tại ô `B27`, `B43` và `B66`.

2. **Cập nhật `E200_PayableFiller.ts`:**
   - Sử dụng `extractCounterpartStats(ctx.nkcTransactions, '331', isPeriod1)`:
     - `isPeriod1 = true` cho Đợt 1 (Rows 14-26).
     - `isPeriod1 = false` cho Cả năm (Rows 36-50).
   - Điền Cột B (TK ĐỨ), Cột C (Số tiền) cho PS Nợ.
   - Điền Cột F (TK ĐỨ), Cột G (Số tiền) cho PS Có.
   - Điền kết luận chuẩn VACPA tại dòng 29-32 và 53-55.

---

## 4. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] Sheet `D 390` trong file xuất kết quả hiển thị chuẩn 2 khối Đợt 1 và Cả năm, số tổng ở C23/G23 và C41/G41 khớp đúng tổng phát sinh Nợ/Có TK 131 trong kỳ.
- [ ] Sheet `E290` trong file E200 hiển thị đủ 2 khối Đợt 1 và Cả năm, số tổng ở C27/G27 và C51/G51 khớp đúng tổng phát sinh Nợ/Có TK 331.
- [ ] Cột Tỷ lệ `%` không bị lỗi `#DIV/0!` hay `#VALUE!`.
- [ ] Microsoft Excel mở cả hai file `D300` và `E200` thành công không có cảnh báo sửa file.
