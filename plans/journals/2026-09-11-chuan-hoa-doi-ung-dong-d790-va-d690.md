---
date: 2026-09-11
title: Chuẩn hóa bóc tách đối ứng động và gán W/P Ref cho D790 và D690 theo mẫu E290
tags: [workingpaper, d790, d690, counterparts, wp-ref, vacpa]
---

# Chuẩn Hóa Bóc Tách Đối Ứng Động Và Gán W/P Ref Cho D790 Và D690

## Mục tiêu hoàn thành
- Khắc phục tình trạng gán cứng tài khoản ghép `'331/241'`, `'112/111'` và thiếu mã tham chiếu W/P Ref trong sheet `D 790` (file `D700 - Tai san`).
- Đồng bộ cấu trúc chuẩn mực như ở `E 290` (Ảnh #2):
  - Bóc tách động theo mã tài khoản 3 số thực tế từ sổ NKC.
  - Gán mã W/P Ref (`E290`, `D190`, `G290`, `G490`...) vào cột `TC`.
  - Hỗ trợ đầy đủ cả 2 khối **TK 211** (Tăng giảm nguyên giá) và **TK 214** (Khấu hao tài sản đối ứng 627, 641, 642...).
  - Xử lý triệt để trường hợp vế Có/Nợ = 0 để không bị lỗi chia `#DIV/0!` trong Excel.
  - Tự động điền phần kết luận kiểm toán tại dòng B59.
- Nâng cấp tương tự cho sheet `D 690` (file `D600 - Phan bo`):
  - Bóc tách động TK 242 (Nợ đối ứng 331, 112... / Có đối ứng chi phí 627, 642...) kèm đầy đủ W/P Ref và nhận xét kiểm toán tại B23.

## Tệp chỉnh sửa
- `src/domain/workingpaper/fillers/D700_FixedAssetFiller.ts`
- `src/domain/workingpaper/fillers/D600_PrepaidFiller.ts`

## Kết quả kiểm thử
- `npx vitest run tests/workingpaper.test.ts`: Passed 100% (4/4 test files).
- `npm run typecheck`: Passed 100% sạch (0 lỗi).
- Sinh file Excel thực tế và đối soát trực tiếp từng ô:
  - `D 790`: Cột A & E hiển thị mã W/P Ref đỏ (`E290`, `G290`, `G490`...), cột B & F hiển thị tài khoản 3 số (`331`, `627`, `642`...), các ô tỷ lệ không còn bị `#DIV/0!`, kết luận B59 điền chuẩn.
  - `D 690`: Cột A & E có W/P Ref, đối ứng TK 242 phân bổ chuẩn vào 627 và 642, nhận xét B23 điền chuẩn.
