---
id: "phase-01"
name: "Tự động đổ Sheet D146 - Số dư tiền gửi ngân hàng chi tiết"
plan: "plans/260911-1038-d100-working-paper-automation/plan.md"
status: "pending"
---

# Pha 1: Tự động đổ Sheet D146 - Số dư tiền gửi ngân hàng chi tiết

## 1. Mục Tiêu
Tự động điền thông tin các tài khoản ngân hàng và tiền gửi có kỳ hạn vào Sheet `D146` (Bảng tổng hợp đối chiếu số dư tiền gửi ngân hàng).

## 2. Phân Tích Cấu Trúc Sheet D146
Template `D146` có 2 phân vùng đối chiếu chính:
- **Phân vùng 1: Đợt 1 (Đến 30/06)**:
  - Header ở Hàng 19-20. Cột A: Tài khoản, Cột B: Tên tài khoản, Cột C: Số dư VND, Cột D: Ngoại tệ.
  - Các dòng dữ liệu TK 112: Hàng 22 đến 26.
  - Các dòng dữ liệu TK 128: Hàng 28 đến 31.
- **Phân vùng 2: Đợt 2 (Đến 31/12)**:
  - Header ở Hàng 39-40.
  - Các dòng dữ liệu TK 112: Hàng 42 đến 46 (có thể mở rộng linh hoạt).
  - Các dòng dữ liệu TK 128: Hàng 48 đến 51.

## 3. Các Bước Thực Hiện
1. Lấy danh sách tài khoản chi tiết từ `ctx.cdfsAccounts`:
   - Lọc các tài khoản bắt đầu bằng `1121` (Tiền gửi VND), `1122` (Tiền gửi ngoại tệ), `1281` (Tiền gửi kỳ hạn).
   - Xác định số dư cuối kỳ: `ck = a.nock || a.cock || 0`.
2. Điền dữ liệu vào Đợt 2 (Hàng 42 trở đi):
   - Cột A (col 1): Mã tài khoản (`a.matk`).
   - Cột B (col 2): Tên tài khoản / Ngân hàng (`a.tentk`).
   - Cột C (col 3): Số dư sổ KT VND (`ck`), định dạng tiền tệ `#,##0`.
3. Nếu có dữ liệu đối chiếu Đợt 1 (`interimBalances`): điền tương tự vào phân vùng Đợt 1 (Hàng 22 trở đi).
4. Đảm bảo hỗ trợ cả hai chế độ: `OpenXmlPackageEditor` (fast path) và `ExcelJS.Workbook`.

## 4. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] Sheet `D146` hiển thị đầy đủ các tài khoản ngân hàng có trong CDFS.
- [ ] Cột C chứa chính xác số dư cuối kỳ của từng tài khoản.
- [ ] Các ô không có số liệu được giữ nguyên hoặc gán `null`, không làm ảnh hưởng đến các hàng công thức.
