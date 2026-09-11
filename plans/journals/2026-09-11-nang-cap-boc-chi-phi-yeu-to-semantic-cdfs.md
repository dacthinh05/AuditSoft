# Nhật Ký Kỹ Thuật: Nâng Cấp Bóc Chi Phí Theo Yếu Tố Bằng Ngữ Nghĩa Tên TK CĐSPS (Semantic Hybrid Engine)

- **Ngày thực hiện:** 2026-09-11
- **Phân hệ:** Phân Tích Sổ Cái & NKC (Preliminary Analytics — VSA 520 & Báo Cáo Thuyết Minh BCTC)
- **Tác vụ:** Nâng cấp thuật toán bóc tách 5 yếu tố chi phí (NVL, Nhân công, Khấu hao, Dịch vụ mua ngoài, Khác bằng tiền) từ cơ chế số hiệu tài khoản tĩnh sang **Bộ Phân Loại Ngữ Nghĩa 4 Lớp** dựa trên Tên tài khoản CĐSPS (`tentk`) và Diễn giải NKC (`desc`).

---

### 1. Bối cảnh & Vấn đề thực tế
- Các doanh nghiệp tại Việt Nam sử dụng nhiều phần mềm kế toán khác nhau (MISA, FAST, BRAVO, SAP...) và có cách mở tiểu khoản dị biệt:
  - Tiểu khoản `64281` có tên *"Chi phí ăn trưa, khám sức khỏe nhân viên"* bị xếp nhầm vào **Khác bằng tiền** nếu chỉ nhìn tiền tố `6428`.
  - Tiểu khoản `6422` có tên *"Chi phí gia công in thêu thuê ngoài"* bị xếp nhầm vào **Nguyên vật liệu** nếu chỉ theo quy ước `6422` Thông tư 200.
  - Tiểu khoản `6423` có diễn giải *"Sửa chữa máy photocopy văn phòng"* bị xếp nhầm vào **Khác bằng tiền**.

---

### 2. Giải pháp kỹ thuật đã triển khai (Cây Quyết Định 4 Lớp)

#### A. Hàm chuẩn hóa chuỗi tiếng Việt & Bộ từ điển từ khóa kiểm toán:
- `normalizeVietnameseText(str)`: Bỏ dấu thanh tiếng Việt, chuyển chữ thường, thay `đ` $\rightarrow$ `d`, loại bỏ ký tự đặc biệt.
- `matchNatureKeyword(text)`: Quét từ khóa kiểm toán chuyên ngành cho 5 yếu tố chi phí:
  - **`LABOR`:** `luong`, `nhan vien`, `cong nhan`, `tien cong`, `thuong`, `bao hiem`, `bhxh`, `bhyt`, `bhtn`, `kpcd`, `an ca`, `an trua`, `tien com`, `tien an`, `phu cap`, `thu lao`, `dong phuc`, `nhan su`, `tro cap`...
  - **`DEPRECIATION`:** `khau hao`, `hao mon`, `tscd`, `tai san co dinh`...
  - **`RAW_MATERIALS`:** `nguyen lieu`, `vat lieu`, `vat tu`, `phu tung`, `bao bi`, `nhan mac`, `xuat kho vl`, `nvl`, `xang dau`, `nhien lieu`...
  - **`OUTSIDE_SERVICES`:** `dich vu`, `thue ngoai`, `thue nha`, `thue van phong`, `gia cong`, `tien dien`, `tien nuoc`, `vien thong`, `internet`, `van chuyen`, `cuoc`, `sua chua`, `bao duong`, `tu van`, `quang cao`, `ve may bay`, `kiem toan`...
  - **`OTHER_CASH`:** `cong cu`, `dung cu`, `ccdc`, `phan bo`, `tiep khach`, `cong tac phi`, `le phi`, `thue mon bai`, `hoi nghi`, `bang tien`...

#### B. Cây Quyết Định Phân Loại 4 Tầng trong `ExpenseByNatureEngine.ts`:
1. **Tầng 1 (Chân lý kế toán dòng tài sản):**
   - Đối ứng Có `334, 338` $\rightarrow$ $100\%$ Nhân công (`LABOR`).
   - Đối ứng Có `214` $\rightarrow$ $100\%$ Khấu hao (`DEPRECIATION`).
   - Đối ứng Có `152` $\rightarrow$ $100\%$ Nguyên vật liệu (`RAW_MATERIALS`).
2. **Tầng 2 (Ngữ nghĩa Tên tài khoản CĐSPS `accountName`):**
   - Lấy `tentk` từ `cdfsAccounts` tương ứng với mã tài khoản phát sinh. Nếu tên tài khoản chứa từ khóa đặc thù $\rightarrow$ Phân loại chính xác ngay lập tức (bất kể số hiệu tài khoản là gì).
3. **Tầng 3 (Ngữ nghĩa Diễn giải bút toán NKC `description`):**
   - Khi đối ứng là thanh toán công nợ/tiền tệ (`331, 111, 112, 141, 242`), quét tiếp diễn giải chi tiết của giao dịch.
4. **Tầng 4 (Fallback chuẩn Thông tư 200/133):**
   - Giữ nguyên các quy tắc tiền tố số hiệu tài khoản chuẩn đối với các tài khoản không có tên cụ thể.

---

### 3. Kết quả nghiệm thu
- `tests/expense-by-nature.test.ts`: Đã thêm 3 test cases dị biệt thực tế, toàn bộ 5/5 tests PASS.
- Toàn bộ test suite dự án: **85/85** test files, **390/390** tests PASS 100%.
- `npm run typecheck`: 0 errors.
- Bảng Cân đối Thuyết minh BCTC (`bctcReconciliation.isBalanced`) vẫn khớp tuyệt đối (Độ lệch $= 0$).
