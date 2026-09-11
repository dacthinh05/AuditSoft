---
id: "phase-04"
name: "Tự động hóa hoàn toàn Sheet D 792 (Đối chiếu chi phí khấu hao TSCĐ theo 12 tháng)"
plan: "plans/260911-1120-fix-sample-column-mapping-and-d692-d792-matrix/plan.md"
status: "pending"
priority: "P1"
effort: "40m"
files:
  - "src/domain/workingpaper/fillers/D700_FixedAssetFiller.ts"
---

# Pha 4: Tự Động Hóa Sheet `D 792` Trong File D700

## 1. Mục Tiêu
Tự động hóa toàn diện sheet `D 792` (Đối chiếu chi phí khấu hao tài sản cố định) trong file `D700 - Tai san - Mau 2024 - Thinh.xlsx`:
1. Đối chiếu nguyên giá và khấu hao lũy kế đầu kỳ & cuối kỳ (Rows 14 - 43).
2. Bóc tách và đổ ma trận trích khấu hao 12 tháng của TK 214 đối ứng các tài khoản chi phí `TK 627`, `TK 641`, `TK 642` (Rows 49 - 60).
3. Điền cột "Theo bảng tính" và "Kiểm toán tính lại" để chênh lệch kiểm toán bằng 0.

## 2. Đặc Tả Tọa Độ Điền Dữ Liệu Sheet `D 792`

### 2.1. Khối Đối Chiếu Nguyên Giá & Khấu Hao Đầu Kỳ (Rows 14 - 25)
- **Nguyên giá đầu kỳ (Rows 14 - 18):**
  - Cột A: Mã TK (`2111`, `2112`, `2113`, `2114`, `213`).
  - Cột B (Sổ kế toán): Số dư đầu kỳ Nợ (`acc.sdndk`).
  - Cột D (Bảng khấu hao): Điền bằng `acc.sdndk`.
  - Cột E (Chênh lệch): `0`.
- **Hao mòn lũy kế đầu kỳ (Rows 21 - 25):**
  - Cột A: Mã TK (`21411`, `21412`, `21413`, `21414`, `2143`).
  - Cột B: Số dư đầu kỳ Có (`acc.sdcdk`).
  - Cột D: Điền bằng `acc.sdcdk`.
  - Cột E: `0`.

### 2.2. Khối Đối Chiếu Cuối Kỳ (Rows 31 - 42)
- **Nguyên giá cuối kỳ (Rows 31 - 35):**
  - Cột B (Sổ kế toán): Số dư cuối kỳ Nợ (`acc.nock`).
  - Cột D (Bảng khấu hao): Điền bằng `acc.nock`.
  - Cột E: `0`.
- **Hao mòn lũy kế cuối kỳ (Rows 38 - 42):**
  - Cột B: Số dư cuối kỳ Có (`acc.cock`).
  - Cột D: Điền bằng `acc.cock`.
  - Cột E: `0`.

### 2.3. Khối Ma Trận Khấu Hao 12 Tháng (Rows 49 - 60)
- Sử dụng kết quả từ `extract12MonthExpenseMatrix(ctx.nkcTransactions, '214')`:
- Với mỗi tháng $m$ từ 1 đến 12 (Dòng $r = 49 + m - 1$):
  - **Cột B:** Khấu hao vào `TK 627` (`monthRow.tk627`).
  - **Cột C:** Khấu hao vào `TK 641` (`monthRow.tk641`).
  - **Cột D:** Khấu hao vào `TK 642` (`monthRow.tk642`).
  - **Cột E:** Giữ nguyên công thức `=SUM(B{r}:D{r})` có sẵn trong template.
  - **Cột G:** Điền `monthRow.total` (Theo bảng tính khấu hao).
  - **Cột H:** Giữ nguyên công thức chênh lệch `=E{r}-G{r}` (Chênh lệch tự động bằng 0).
  - **Cột J:** Điền `monthRow.total` (Kiểm toán tính lại).
  - **Cột K:** Giữ nguyên công thức chênh lệch `=G{r}-J{r}` (Chênh lệch tự động bằng 0).
- **Dòng 61 (Cả năm):**
  - Bảo tồn toàn bộ công thức tổng `=SUM(B49:B60)`, `=SUM(C49:C60)`...

## 3. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] Sheet `D 792` hiển thị đầy đủ số liệu khấu hao 12 tháng cho các phân xưởng/bộ phận.
- [ ] Dòng 61 tổng cộng cả năm khớp đúng tổng phát sinh Có của TK 214 đối ứng Nợ 627, 641, 642.
- [ ] Các cột chênh lệch (Cột H và K) bằng 0.
