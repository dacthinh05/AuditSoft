# Giai đoạn 2: Chuẩn hóa bóc tách đối ứng động cho D690 (D600)

## Nhiệm vụ
1. Import `extractCounterpartStats` vào `D600_PrepaidFiller.ts`.
2. Khối phát sinh chi phí trả trước **TK 242** (Hàng 15 - 17):
   - Gọi `extractCounterpartStats(ctx.nkcTransactions, '242')`.
   - Vế Nợ (Hàng 15 - 17):
     - Cột A: W/P Ref (`E290`, `D190`...).
     - Cột B: TK đối ứng 3 số (`331`, `112`, `111`...).
     - Cột C: Số tiền phát sinh.
   - Vế Có (Hàng 15 - 17):
     - Cột E: W/P Ref (`G290`, `G390`, `G490`...).
     - Cột F: TK đối ứng 3 số (`627`, `641`, `642`...).
     - Cột G: Số tiền phân bổ chi phí.
3. Điền nhận xét kiểm toán tại dòng 23-24:
   - "Chi phí trả trước được phân bổ đều đặn và hợp lý vào chi phí sản xuất kinh doanh (TK 627, 642)."
4. Cập nhật cả 2 nhánh xử lý: `OpenXmlPackageEditor` và `exceljs` fallback.

## File chỉnh sửa
- `src/domain/workingpaper/fillers/D600_PrepaidFiller.ts`
