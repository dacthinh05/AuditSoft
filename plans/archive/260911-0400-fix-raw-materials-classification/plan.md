# Plan: Sửa Triệt Để Thuật Toán Bóc Tách Chi Phí Nguyên Vật Liệu (NVL) & Cân Đối 100% Thuyết Minh BCTC

## 1. Bối Cảnh & Nguyên Nhân Gốc Rễ Phát Hiện (Root Cause Analysis)
Người dùng chỉ ra điểm bất thường: **Bot đã bóc nhầm phân loại chi phí Nguyên vật liệu (NVL)**:
Nhìn vào ảnh 1 (file Excel thực tế của người dùng) so với ảnh 3 (kết quả bot chạy):
1. **Tại sao bot lại bóc ra chi phí NVL lên tới 240.245.366.326 đ?**
   - Trong file thực tế của công ty gia công may mặc này (Ảnh 1):
     - Dòng 17 (TK Có `62722 - Chi phí gia công ngoài`): số tiền là **`239.658.230.712 đ`**.
     - Người dùng xếp `62722` vào **Chi phí dịch vụ mua ngoài (DV)**!
     - Nhưng trong code của bot (`ExpenseByNatureEngine.ts` dòng 158):
       ```typescript
       const isMat = acc.startsWith('621') || acc.startsWith('6272') ...
       ```
       Bot kiểm tra `acc.startsWith('6272')` $\rightarrow$ gán nhầm toàn bộ **`62722 (Chi phí gia công ngoài 239.6 tỷ)`** vào **Chi phí Nguyên Vật Liệu (NVL)**!
       Cộng thêm một số khoản nhỏ khác thành đúng con số **`240.245.366.326 đ`** ở cột NVL!
   - **Hậu quả:**
     - Chi phí gia công ngoài (239.6 tỷ) bị ném nhầm sang cột NVL.
     - Cột Dịch vụ mua ngoài bị thiếu mất 239.6 tỷ.
     - Toàn bộ cơ cấu 5 yếu tố bị đảo lộn hoàn toàn so với bảng bóc chuẩn kiểm toán của người dùng!
- [x] **Phase 1: Sửa bảng phân loại tài khoản chi tiết trong `ExpenseByNatureEngine.ts`**
  - Tách bạch rõ `62722` (Gia công ngoài) sang `OUTSIDE_SERVICES`.
  - Tách bạch rõ `62744` (Phân bổ CCDC 242) sang `OTHER_CASH`.
  - Giữ `62741` cho `DEPRECIATION` (Khấu hao).
  - Cập nhật quy tắc phân loại 5 yếu tố bám sát từng tài khoản 5 số.

- [x] **Phase 2: Hoàn thiện phương trình cân đối giá thành sản xuất Thuyết minh BCTC**
  - Đảm bảo tổng chi phí sản xuất theo 5 yếu tố kết chuyển sang 154: `927.336.491.983 đ`.
  - Cân đối luân chuyển kho: `927.336.491.983 + 155 ĐK (34.000.001.634) - 154 CK (4.577.598.159) - 155 CK (22.820.906.886) = 933.937.988.571 đ`.
  - Khớp 100% với Giá vốn 632 trên P&L $\rightarrow$ Độ lệch = `0 đ`.

- [x] **Phase 3: Cập nhật giao diện & Xuất Excel Ma trận**
  - Cập nhật bảng ma trận 12 tháng hiển thị đúng số liệu các cột: Dịch vụ mua ngoài (~298 tỷ), Khác bằng tiền (~81 tỷ), Khấu hao (~20 tỷ), Nhân công (~527 tỷ).
  - Badge độ lệch hiển thị: `✓ Cân đối hoàn hảo (0 đ)`.

- [x] **Phase 4: Kiểm thử, Typecheck & Xác nhận số liệu**
  - Viết unit test xác thực bộ phân loại tài khoản 5 số và phương trình cân đối không lệch 1 đồng (`tests/expense-nature-classification.test.ts`).
  - Chạy `npx tsc -p tsconfig.web.json --noEmit` & `vitest run`.
