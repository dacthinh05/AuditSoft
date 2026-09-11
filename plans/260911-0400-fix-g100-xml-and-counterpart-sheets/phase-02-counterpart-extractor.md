# Phase 02: Xây Dựng Engine Bóc Tách Phát Sinh Đối Ứng Doanh Thu

## Mục tiêu
Xây dựng logic gom nhóm phát sinh theo tài khoản đối ứng 3 số cho các tài khoản `511`, `521`, `515`, `711` theo từng đợt kiểm toán.

## File tác động
- `src/domain/workingpaper/counterpartExtractor.ts` (mới)
- `src/domain/workingpaper/RefDictionary.ts`

## Chi tiết thực hiện
1. Viết hàm `extractCounterpartStats(transactions, targetAccountPrefix, isPeriod1?)`:
   - Lọc các bút toán có `debit` hoặc `credit` bắt đầu bằng `targetAccountPrefix`.
   - Nếu `isPeriod1 = true`: chỉ lấy các tháng từ 1 đến 6.
   - Vế Nợ: Khi `t.debit.startsWith(targetAccountPrefix)`, TK đối ứng là `t.credit.slice(0, 3)`.
   - Vế Có: Khi `t.credit.startsWith(targetAccountPrefix)`, TK đối ứng là `t.debit.slice(0, 3)`.
   - Gom tổng số tiền theo từng TK đối ứng 3 số, sắp xếp giảm dần.
   - Lấy mã W/P Ref tương ứng bằng `getWorkingPaperRef(tk3)`.
2. Trả về cấu trúc dữ liệu gồm mảng `debitCounterparts` và `creditCounterparts`.
