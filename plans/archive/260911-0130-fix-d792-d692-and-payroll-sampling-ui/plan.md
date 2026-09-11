---
title: "Bổ Sung Thống Kê 12 Tháng Khấu Hao D792 & Phân Bổ D692, Khắc Phục Triệt Để Lỗi UI Chọn Mẫu E491"
description: "Bổ sung bóc tách chi phí khấu hao 12 tháng vào Sheet D 792 (Nợ 627, 641, 642 / Có 214) và chi phí phân bổ 12 tháng vào Sheet D 692 (Nợ 627, 641, 642 / Có 242); khắc phục dứt điểm lỗi UI tràn bảng và dính chữ tại Bảng 4.3 KPCĐ Sheet E 491 bằng cơ chế Clear Old Samples và khóa chặt trong khung viền 5 dòng; áp dụng nguyên tắc để trống các cột chưa có dữ liệu độc lập (Bảng lương E490)."
status: completed
priority: P1
effort: 1h
branch: main
tags:
  - workingpaper
  - d792-depreciation
  - d692-amortization
  - e491-ui-fix
  - sampling-boundary
  - clean-blank-rules
created: 2026-09-11
---

# Kế Hoạch: Bổ Sung Thống Kê D792, D692 & Chuẩn Hóa Bảng Chọn Mẫu E491

## 1. Bối Cảnh & Vấn Đề Cần Khắc Phục
1. **Sheet `D 792` (File `D700 - Tai san`):**
   - Bảng 12 tháng *"3. So sánh đối chiếu chi phí khấu hao giữa sổ kế toán và bảng tính khấu hao"* (Hàng 49 đến 60) đang bị trắng trơn toàn bộ dấu gạch ngang `[-]`.
   - Cần quét Sổ NKC bóc tách số phát sinh khấu hao từng tháng theo từng bộ phận: SXC (`Nợ 627 / Có 214`), Bán hàng (`Nợ 641 / Có 214`), QLDN (`Nợ 642 / Có 214`) và điền vào hàng 49–60.
2. **Sheet `D 692` (File `D600 - Phan bo`):**
   - Bảng 12 tháng *"3. So sánh đối chiếu chi phí phân bổ giữa sổ kế toán, bảng tính và kiểm toán tính lại"* (Hàng 34 đến 45) chưa hề được điền.
   - Cần quét Sổ NKC bóc tách số phát sinh phân bổ chi phí trả trước từng tháng: SXC (`Nợ 627 / Có 242`), Bán hàng (`Nợ 641 / Có 242`), QLDN (`Nợ 642 / Có 242`) và điền vào hàng 34–45.
3. **Lỗi UI vỡ bảng tại Bảng 4.3 Sheet `E 491` (File `E400 - Luong`):**
   - Bảng `4.3 Kiểm tra nộp KPCĐ` chỉ có khung viền 5 dòng (Hàng 88–92). Code cũ nhồi 10 dòng làm rơi ra ngoài bảng, đè sát vào ghi chú dòng 98.
   - Cột số tiền và chữ `P` bị nhồi dính nhau (`169461189 P`).
   - Lấy nhầm tài khoản `3383` trong khi tiêu đề bảng là kiểm tra nộp KPCĐ (`TK 3382`).
   - Cần: Xóa sạch rác mẫu cũ, lấy đúng nghiệp vụ nộp KPCĐ `Nợ 3382 / Có 111, 112`, khóa chặt trong khung viền 5 dòng (88–92), tách bạch cột Số tiền và cột tickmark `✓`.
4. **Quy tắc để trống các cột chưa có căn cứ độc lập:**
   - Tại `E 490`: Cột `Bảng lương` (G), `SLĐ` (I), `Người VN/GĐ/Người NN` (K, L, M) để trống tự nhiên, không tự động gán bằng số tổng chi phí sổ sách.
   - Tại `E 491`: Cột `Thông báo BHXH` chỉ điền khi có số liệu nộp ngân hàng hoặc chứng từ độc lập, không tự động gán bằng Tổng trích.

---

## 2. Lộ Trình Triển Khai (Phases)

| Phase | Nhiệm vụ chính | Files tác động |
| :--- | :--- | :--- |
| **Phase 1** | Bổ sung bóc tách 12 tháng Khấu hao `D 792` & Phân bổ `D 692` | `src/domain/workingpaper/fillers/D700_FixedAssetFiller.ts`<br>`src/domain/workingpaper/fillers/D600_PrepaidFiller.ts` |
| **Phase 2** | Sửa triệt để lỗi UI tràn bảng `E 491` & Chuẩn hóa quy tắc để trống | `src/domain/workingpaper/fillers/E400_PayrollFiller.ts` |
| **Phase 3** | Kiểm thử, Xác thực định dạng Excel và Typecheck | `tests/workingpaper.test.ts` |
