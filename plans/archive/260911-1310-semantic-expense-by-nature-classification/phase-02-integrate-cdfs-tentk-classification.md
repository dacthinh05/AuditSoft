# Phase 2: Tích Hợp Tên TK CĐSPS & Diễn Giải NKC Vào Cây Quyết Định 3 Lớp

## 1. Mục Tiêu
Nâng cấp vòng lặp phân loại trong `ExpenseByNatureEngine.ts` để áp dụng cây quyết định 3 lớp:
1. **Lớp 1:** Đối ứng tài khoản Có đặc thù (`334/338`, `214`, `152`).
2. **Lớp 2:** Quét từ khóa Tên tài khoản trên CĐSPS (`tentk` lấy từ `cdfsAccounts.get(acc)`) và Diễn giải bút toán NKC (`e.description`).
3. **Lớp 3:** Fallback theo số hiệu tài khoản chuẩn Thông tư 200 / 133.

## 2. File Chỉnh Sửa
- `src/domain/analytics/ExpenseByNatureEngine.ts`

## 3. Các Bước Thực Hiện
1. Trong vòng lặp bóc tách 5 yếu tố:
   - Lấy `accountName`:
     ```ts
     const accountName = cdfsAccounts?.get(acc)?.tentk || STANDARD_ACCOUNT_NAMES[acc] || ''
     ```
2. Thực thi thuật toán nhận diện 3 lớp:
   - **Bước 2.1 (Lớp 1 - Đối ứng Có):**
     - Nếu `c.startsWith('334') || c.startsWith('338') || d.startsWith('334') || d.startsWith('338')` $\rightarrow$ `LABOR`.
     - Nếu `c.startsWith('214') || d.startsWith('214')` $\rightarrow$ `DEPRECIATION`.
     - Nếu `c.startsWith('152') || d.startsWith('152')` $\rightarrow$ `RAW_MATERIALS`.
   - **Bước 2.2 (Lớp 2 - Ngữ nghĩa Tên TK CĐSPS & Diễn giải):**
     - Quét `accountName` qua `matchNatureKeyword(accountName)`. Nếu tìm thấy yếu tố $\rightarrow$ Áp dụng ngay!
     - Nếu chưa tìm thấy và đối ứng là `331, 111, 112, 141`, quét tiếp `e.description` qua `matchNatureKeyword(e.description)`.
   - **Bước 2.3 (Lớp 3 - Fallback theo số hiệu TK):**
     - Áp dụng các quy tắc số hiệu tài khoản chuẩn TT 200 như hiện tại (621/6272 $\rightarrow$ NVL; 622/6271/6411/6421 $\rightarrow$ NC; 6274/6414/6424 $\rightarrow$ KH; 6277/6417/6427 $\rightarrow$ DV; 6278/6418/6428 $\rightarrow$ Khác).
3. Cập nhật các mảng tháng tương ứng (`rawMaterials12`, `labor12`, `depreciation12`, `outsideServices12`, `otherCash12`) và `accountMap`.

## 4. Tiêu Chí Kiểm Tra
- Mọi bút toán thuộc các tiểu khoản mở dị biệt được tự động phân loại đúng vào 5 nhóm yếu tố chi phí.
- Số liệu bóc tách khớp logic, bảng thuyết minh BCTC cân đối `isBalanced === true`.
