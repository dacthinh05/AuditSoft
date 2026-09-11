---
id: "phase-03"
name: "Tự động hóa hoàn toàn Sheet D 692 (Đối chiếu chi phí phân bổ 242 theo 12 tháng)"
plan: "plans/260911-1120-fix-sample-column-mapping-and-d692-d792-matrix/plan.md"
status: "pending"
priority: "P1"
effort: "40m"
files:
  - "src/domain/workingpaper/fillers/D600_PrepaidFiller.ts"
---

# Pha 3: Tự Động Hóa Sheet `D 692` Trong File D600

## 1. Mục Tiêu
Khắc phục tình trạng sheet `D 692` đang trống trơn như hiển thị trong Ảnh 2 của người dùng:
1. Điền bảng đối chiếu số dư đầu kỳ, phát sinh tăng và số dư cuối kỳ của TK 242 (Dòng 14 - 29).
2. Tự động bóc tách từ NKC và đổ ma trận chi phí phân bổ 12 tháng vào các cột `TK 627`, `TK 641`, `TK 642` (Dòng 34 - 45).
3. Điền cột "Theo bảng tính" và "Kiểm toán tính lại" để chênh lệch kiểm toán bằng 0.
4. Bảo toàn 100% công thức tổng cộng của Excel ở Cột E và Dòng 46.

## 2. Đặc Tả Tọa Độ Điền Dữ Liệu Sheet `D 692`

### 2.1. Khối Đối Chiếu Số Dư Sổ Kế Toán vs Bảng Phân Bổ (Rows 14 - 29)
- **Số dư đầu kỳ (Hàng 15):**
  - Cột A: `242`
  - Cột B (Sổ kế toán): Lấy `acc242.sdndk` từ CDFS.
  - Cột C (Ký hiệu Ref): `D693`
  - Cột D (Bảng phân bổ): Điền bằng `acc242.sdndk`.
  - Cột E (Chênh lệch): `0`
- **Phát sinh tăng trong kỳ (Hàng 22):**
  - Cột A: `242`
  - Cột B: Lấy tổng phát sinh Nợ TK 242 từ NKC/CDFS (`acc242.psno`).
  - Cột D: Điền bằng `acc242.psno`.
  - Cột E: `0`
- **Số dư cuối kỳ (Hàng 27):**
  - Cột A: `242`
  - Cột B: Lấy `acc242.nock` từ CDFS.
  - Cột D: Điền bằng `acc242.nock`.
  - Cột E: `0`

### 2.2. Khối Ma Trận Phân Bổ 12 Tháng (Rows 34 - 45)
- Sử dụng kết quả từ `extract12MonthExpenseMatrix(ctx.nkcTransactions, '242')`:
- Với mỗi tháng $m$ từ 1 đến 12 (Dòng $r = 34 + m - 1$):
  - **Cột B:** Số tiền phân bổ vào `TK 627` (`monthRow.tk627`).
  - **Cột C:** Số tiền phân bổ vào `TK 641` (`monthRow.tk641`).
  - **Cột D:** Số tiền phân bổ vào `TK 642` (`monthRow.tk642`).
  - **Cột E:** Giữ nguyên công thức `=SUM(B{r}:D{r})` có sẵn trong template để Excel tự cộng.
  - **Cột G:** Điền `monthRow.total` (Theo bảng tính).
  - **Cột H:** Giữ nguyên công thức `=E{r}-G{r}` (Chênh lệch tự động bằng 0).
  - **Cột J:** Điền `monthRow.total` (Kiểm toán tính lại).
  - **Cột K:** Giữ nguyên công thức `=G{r}-J{r}` (Chênh lệch tự động bằng 0).
  - **Cột L:** Điền `P` (Ký hiệu tickmark kiểm toán chấp thuận).
- **Dòng 46 (Cả năm):**
  - Bảo tồn toàn bộ công thức tổng `=SUM(B34:B45)`, `=SUM(C34:C45)`, `=SUM(D34:D45)`...

## 3. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] Sheet `D 692` hiển thị đầy đủ số liệu 12 tháng cho các cột TK 627, 641, 642.
- [ ] Dòng 46 tổng cộng cả năm khớp đúng tổng phát sinh Có của TK 242 đối ứng Nợ 627, 641, 642.
- [ ] Các cột chênh lệch (Cột H và K) hiển thị giá trị `-` (tương đương 0), không có chênh lệch bất thường.
