---
title: "Kế Hoạch Nâng Cấp Tự Động Hóa Giấy Làm Việc D100 (Tiền & Tương Đương Tiền)"
description: "Tự động hóa đổ dữ liệu từ Sổ NKC & CDFS vào 4 sheet D146, D190, D191.1, D191.2 của Giấy làm việc D100"
status: "completed"
priority: "high"
author: "Antigravity Assistant"
created: "2026-09-11"
phases:
  - id: "phase-01"
    name: "Tự động đổ Sheet D146 - Số dư tiền gửi ngân hàng chi tiết"
    file: "phase-01-d146-bank-balances.md"
    status: "completed"
  - id: "phase-02"
    name: "Tự động đổ Sheet D190 - Đối ứng tài khoản 3 số & tham chiếu #Ref"
    file: "phase-02-d190-3digit-counterparts.md"
    status: "completed"
  - id: "phase-03"
    name: "Tự động bốc mẫu Sheet D191.1 & D191.2 theo Đợt 1 và Đợt 2"
    file: "phase-03-d191-sample-selection.md"
    status: "completed"
  - id: "phase-04"
    name: "Kiểm thử end-to-end và xác thực an toàn file Excel"
    file: "phase-04-verification.md"
    status: "completed"
---

# KẾ HOẠCH NÂNG CẤP TỰ ĐỘNG HÓA GIẤY LÀM VIỆC D100 (TIỀN & TƯƠNG ĐƯƠNG TIỀN)

## 1. Tổng Quan & Mục Tiêu
Nâng cấp logic trong `D100_CashFiller.ts` để tự động bóc tách số liệu từ **Sổ Nhật Ký Chung (NKC)** và **Bảng Cân Đối Số Phát Sinh (CDFS)**, hoàn thiện trọn vẹn 4 sheet nghiệp vụ cốt lõi của Giấy làm việc `D100 - Tien - Mau 2024 - Thinh.xlsx`:
1. **Sheet `D146`**: Tự động đổ danh mục tài khoản ngân hàng chi tiết (`1121x`, `1122x`, `1281x`), tên tài khoản và số dư cuối kỳ (VND) vào **Cột C**.
2. **Sheet `D 190`**: Tổng hợp phát sinh Nợ/Có theo tài khoản đối ứng rút gọn về **3 chữ số**, tính số tiền, tỷ lệ % và tự động gán mã tham chiếu kiểm toán **`#Ref` (TC)** chuẩn mực lấy từ `Ref.xlsx`.
3. **Sheet `D 191.1`**: Bốc mẫu kiểm tra chi tiết các giao dịch **Đợt 1 (01/01 đến 30/06)**.
4. **Sheet `D 191.2`**: Bốc mẫu kiểm tra chi tiết các giao dịch **Đợt 2 (01/07 đến 31/12)**.

## 2. Kiến Trúc & Sơ Đồ Luồng Dữ Liệu
```mermaid
flowchart TD
    NKC[Sổ NKC: Transactions] --> ENG[D100_CashFiller Engine]
    CDFS[Bảng CDFS: Accounts & Balances] --> ENG
    REF[Từ điển WP_REF_MAP / Ref.xlsx] --> ENG

    ENG --> S1[Sheet D146: Số Dư Cuối Kỳ TK Ngân Hàng]
    ENG --> S2[Sheet D190: Ma Trận Đối Ứng 3 Số & #Ref]
    ENG --> S3[Sheet D191.1: Bốc Mẫu Tiền Đợt 1 T1-T6]
    ENG --> S4[Sheet D191.2: Bốc Mẫu Tiền Đợt 2 T7-T12]

    S1 --> OUT[D100 - Tien - Client Year - Auditor.xlsx]
    S2 --> OUT
    S3 --> OUT
    S4 --> OUT
```

## 3. Danh Sách Các Pha Thực Hiện
- **[Pha 1: Sheet D146](phase-01-d146-bank-balances.md)**: Đổ danh sách tài khoản 112, 128 và số dư cuối kỳ vào Cột C (Row 22-31 và Row 42-51).
- **[Pha 2: Sheet D190](phase-02-d190-3digit-counterparts.md)**: Thuật toán gom nhóm đối ứng 3 chữ số, tính tỷ trọng và ánh xạ mã `#Ref` tham chiếu.
- **[Pha 3: Sheet D191.1 & D191.2](phase-03-d191-sample-selection.md)**: Phân tách dữ liệu theo mốc thời gian Đợt 1 (tháng 1..6) và Đợt 2 (tháng 7..12), bốc mẫu giao dịch lớn và điền vào form mẫu.
- **[Pha 4: Kiểm thử & Nghiệm thu](phase-04-verification.md)**: Chạy test sinh file thực tế, kiểm tra định dạng cell `value = null`, đảm bảo mở bằng MS Excel không phát sinh lỗi.
