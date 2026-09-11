# Phase 03: Kiểm Thử & Nghiệm Thu Giao Diện

## Mục Tiêu
Viết unit test cho hàm nhận diện sheet và kiểm thử toàn diện giao diện nạp nguồn.

## Chi Tiết Công Việc

1. **Unit Test `tests/smart-sheet-picker.test.ts`**:
   - Kiểm tra `pickBestNkcSheet`:
     - Test case 1: Sheet 1 là `Bìa`, Sheet 2 là `NKC 2025` $\rightarrow$ chọn `NKC 2025`.
     - Test case 2: Tên không có chữ NKC nhưng Sheet 2 có `confidence: 90` $\rightarrow$ chọn Sheet 2.
     - Test case 3: Sheet rỗng (0 dòng) $\rightarrow$ bỏ qua, chọn sheet có dòng dữ liệu.
2. **Kiểm thử Typecheck & Linter**:
   - `npm run typecheck` pass 0 error.
   - `npm run lint` pass 0 error.
   - `npm test` pass toàn bộ test suite.
