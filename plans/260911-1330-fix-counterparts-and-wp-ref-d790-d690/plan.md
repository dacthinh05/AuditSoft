---
slug: fix-counterparts-and-wp-ref-d790-d690
title: Chuẩn hóa bóc tách đối ứng động và gán W/P Ref cho D790, D690 và các GLV liên quan
status: planned
created: 2026-09-11
mode: fast
---

# Kế Hoạch: Chuẩn Hóa Bóc Tách Đối Ứng Động & Gán W/P Ref Cho D790 (D700), D690 (D600)

## 1. Mục tiêu (Outcome)
1. **Khắc phục lỗi cứng tài khoản và lỗi `#DIV/0!` trong sheet `D 790` (file `D700 - Tai san`):**
   - Loại bỏ hoàn toàn text ghép cứng `'331/241'`, `'112/111'`, `'811/Khác'`.
   - Sử dụng cơ chế bóc tách động `extractCounterpartStats` theo tài khoản 3 số thực tế từ sổ NKC.
   - Điền đầy đủ cột **TC (W/P Ref)** ở cả 2 vế: Cột A (Tham chiếu bên Nợ) và Cột E (Tham chiếu bên Có).
   - Bóc tách đầy đủ cả 2 khối tài khoản:
     - **TK 211** (Tăng giảm nguyên giá TSCĐ: Nợ đối ứng 331, 241, 112... / Có đối ứng 214, 811...).
     - **TK 214** (Khấu hao TSCĐ: Nợ đối ứng giảm hao mòn / Có đối ứng chi phí `627`, `641`, `642`...).
   - Xử lý triệt để trường hợp một vế không có phát sinh (tổng = 0) để không phát sinh lỗi chia cho 0 (`#DIV/0!`) trên Excel.
   - Tự động điền dòng kết luận kiểm toán.
2. **Chuẩn hóa sheet `D 690` (file `D600 - Phan bo`):**
   - Thay thế việc gán cứng `'112/111'`, `'331'` bằng bóc tách động `extractCounterpartStats` cho TK 242.
   - Điền cột W/P Ref (`E290`, `D190`, `G290`, `G490`...) và tài khoản 3 số vào các hàng tương ứng.
3. **Rà soát đồng bộ các GLV khác:**
   - Kiểm tra `G490` (`G200 - Chi phi`) để đảm bảo không còn thiếu sót về W/P Ref.

## 2. Phạm vi thay đổi (File Scope)
- `src/domain/workingpaper/fillers/D700_FixedAssetFiller.ts` (Nâng cấp `D 790` cả 2 khối 211 và 214)
- `src/domain/workingpaper/fillers/D600_PrepaidFiller.ts` (Nâng cấp `D 690` cho TK 242)
- `src/domain/workingpaper/counterpartExtractor.ts` (Nếu cần bổ sung helper format)
- `tests/workingpaper.test.ts` (Cập nhật và bổ sung test case xác minh)

## 3. Các giai đoạn thực hiện
- [phase-01-d790-dynamic-counterparts.md](./phase-01-d790-dynamic-counterparts.md) - Viết lại logic bóc tách động cho D790 (TK 211 & TK 214), gán W/P Ref và triệt tiêu `#DIV/0!`.
- [phase-02-d690-dynamic-counterparts.md](./phase-02-d690-dynamic-counterparts.md) - Viết lại logic bóc tách động cho D690 (TK 242) kèm W/P Ref.
- [phase-03-verification-and-test.md](./phase-03-verification-and-test.md) - Chạy bộ kiểm thử tự động, sinh file thực tế và mở kiểm tra trực quan.
