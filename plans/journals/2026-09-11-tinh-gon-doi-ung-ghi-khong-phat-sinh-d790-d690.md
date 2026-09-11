---
date: 2026-09-11
title: Tinh gọn bảng đối ứng D790 và D690, ghi Không phát sinh và loại bỏ bảng chữ T rỗng
tags: [workingpaper, d790, d690, clean-up, khong-phat-sinh]
---

# Tinh gọn đối ứng và ghi Không phát sinh cho D790 và D690

## Thay đổi thực hiện
- `src/domain/workingpaper/fillers/D700_FixedAssetFiller.ts`:
  - Khi một vế (hoặc cả khoản mục) không có phát sinh thực tế trong kỳ:
    - Ghi nhận rõ ràng text **`Không phát sinh`** tại ô tên tài khoản.
    - Xóa toàn bộ các dòng đệm thừa rỗng bên dưới, gán số tiền và tỷ lệ = 0% để triệt tiêu hoàn toàn khung bảng chữ T rỗng và lỗi `#DIV/0!`.
    - Đối với TK 211: Vế Có ghi `Không phát sinh`.
    - Đối với TK 214: Vế Nợ ghi `Không phát sinh`.
- `src/domain/workingpaper/fillers/D600_PrepaidFiller.ts`:
  - Áp dụng tương tự cho TK 242: Khi vế Nợ hoặc vế Có không phát sinh thì ghi rõ `Không phát sinh`, dọn sạch các dòng thừa.

## Kết quả kiểm thử
- `npx vitest run tests/workingpaper.test.ts`: Passed 100% (4/4 tests).
- `npm run typecheck`: Passed 100% sạch (0 lỗi).
- Sinh file thực tế và kiểm tra:
  - `D 790`: TK 211 bên Có ghi `Không phát sinh`, TK 214 bên Nợ ghi `Không phát sinh`, vế có phát sinh hiển thị sạch đẹp mã Ref đỏ và TK 3 số, không còn lỗi `#DIV/0!`.
  - `D 690`: Danh sách đối ứng gọn gàng, không bị tràn dòng rỗng.
