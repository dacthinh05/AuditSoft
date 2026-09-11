---
id: "phase-02"
name: "Tự động đổ Sheet D190 - Đối ứng tài khoản 3 số & tham chiếu #Ref"
plan: "plans/260911-1038-d100-working-paper-automation/plan.md"
status: "pending"
---

# Pha 2: Tự động đổ Sheet D190 - Đối ứng tài khoản 3 số & tham chiếu #Ref

## 1. Mục Tiêu
Tổng hợp toàn bộ phát sinh trong kỳ của Tiền mặt (111) và Tiền gửi ngân hàng (112) theo **tài khoản đối ứng rút gọn 3 chữ số**, tính số tiền, tỷ lệ % và điền mã tham chiếu kiểm toán **`#Ref` (TC)** chuẩn từ `Ref.xlsx`.

## 2. Phân Tích Cấu Trúc Sheet D 190
- **Khối 1: Tiền mặt (Hàng 16 đến 25)**
  - Bên Nợ (Thu tiền mặt):
    - Cột A (Col 1): TC (Mã tham chiếu #Ref)
    - Cột B (Col 2): TKĐƯ (Tài khoản đối ứng 3 số, vd: 112, 131, 511...)
    - Cột C (Col 3): Số tiền phát sinh
    - Cột D (Col 4): Công thức tỷ lệ `=C17/$C$25`
  - Bên Có (Chi tiền mặt):
    - Cột F (Col 6): TC (Mã tham chiếu #Ref)
    - Cột G (Col 7): TKĐƯ (Tài khoản đối ứng 3 số, vd: 331, 334, 642...)
    - Cột H (Col 8): Số tiền phát sinh
    - Cột I (Col 9): Công thức tỷ lệ `=H17/$H$25`
  - Hàng 25: Hàng tổng cộng `=SUM(...)`

- **Khối 2: Tiền gửi ngân hàng (Hàng 33 đến 45)**
  - Tương tự khối tiền mặt nhưng áp dụng cho các giao dịch liên quan đến TK `112`:
    - Bên Nợ: Cột A (TC), Cột B (TKĐƯ 3 số), Cột C (Số tiền)
    - Bên Có: Cột F (TC), Cột G (TKĐƯ 3 số), Cột H (Số tiền)
  - Hàng 45: Hàng tổng cộng `=SUM(...)`

## 3. Các Bước Thực Hiện
1. Xây dựng thuật toán gom nhóm đối ứng 3 chữ số:
   ```typescript
   function aggregate3DigitCounterparts(
     transactions: NkcTransaction[],
     targetAccountPrefix: string,
     side: 'DEBIT' | 'CREDIT'
   ): Array<{ acc3: string; amount: number; wpRef: string }>
   ```
   - Với mỗi giao dịch: nếu tài khoản mục tiêu (`targetAccountPrefix`, vd `111` hoặc `112`) nằm ở bên chỉ định, lấy tài khoản đối ứng ở vế còn lại.
   - Cắt ngắn tài khoản đối ứng về 3 chữ số (ví dụ: `1311` -> `131`, `3312` -> `331`, `6422` -> `642`).
   - Gom tổng số tiền theo từng mã 3 chữ số và sắp xếp giảm dần theo số tiền.
   - Gọi `getWorkingPaperRef(acc3)` để lấy mã tham chiếu `#Ref` tương ứng từ từ điển (vd: `131` -> `D390`, `331` -> `E290`, `642` -> `G490`).
2. Điền số liệu vào Khối 1 (Tiền mặt, tối đa 8 dòng đối ứng lớn nhất để không chạm hàng 25):
   - Bên Nợ: Điền các đối ứng Nợ 111 (Hàng 17..24).
   - Bên Có: Điền các đối ứng Có 111 (Hàng 17..24).
3. Điền số liệu vào Khối 2 (Tiền gửi ngân hàng, tối đa 11 dòng đối ứng lớn nhất để không chạm hàng 45):
   - Bên Nợ: Điền các đối ứng Nợ 112 (Hàng 34..44).
   - Bên Có: Điền các đối ứng Có 112 (Hàng 34..44).
4. Các dòng trống không phát sinh: gán `null`, tuyệt đối không ghi đè công thức tỷ lệ cột D và cột I.

## 4. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] Sheet `D 190` thể hiện rõ ràng các tài khoản đối ứng 3 chữ số trọng yếu nhất.
- [ ] Cột **TC** được điền chính xác mã tham chiếu GLV (`D390`, `E290`, `E490`, `G190`, `G490`...).
- [ ] Công thức tính tổng (Hàng 25 và Hàng 45) và công thức tỷ lệ % vẫn hoạt động nguyên vẹn.
