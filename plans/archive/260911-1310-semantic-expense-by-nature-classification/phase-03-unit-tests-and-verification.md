# Phase 3: Viết Unit Test Dị Biệt Doanh Nghiệp & Nghiệm Thu Toàn Diện

## 1. Mục Tiêu
Bổ sung test cases bao phủ toàn diện các tình huống thực tế tại doanh nghiệp:
1. Doanh nghiệp mở tài khoản `64281` có tên CĐSPS *"Chi phí ăn trưa, khám sức khỏe nhân viên"* $\rightarrow$ Bóc chính xác vào **Nhân công** (thay vì Khác bằng tiền).
2. Doanh nghiệp mở tài khoản `6422` có tên CĐSPS *"Chi phí gia công in thêu ngoài"* $\rightarrow$ Bóc chính xác vào **Dịch vụ mua ngoài** (thay vì Nguyên vật liệu).
3. Doanh nghiệp mở tài khoản `6423` có diễn giải NKC *"Sửa chữa máy lạnh văn phòng"* $\rightarrow$ Bóc chính xác vào **Dịch vụ mua ngoài** (thay vì Khác bằng tiền).
4. Doanh nghiệp mở tài khoản chuẩn Thông tư 200 không có tên đặc biệt $\rightarrow$ Hoạt động ổn định qua Fallback.
5. Kiểm tra cân đối Thuyết minh BCTC: `bctcReconciliation.isBalanced === true`.

## 2. File Chỉnh Sửa
- `tests/expense-by-nature.test.ts`
- `tests/expense-by-nature-balance.test.ts`

## 3. Các Bước Thực Hiện
1. Thêm `describe('Semantic Classification by CDFS Account Name & Description')` trong `tests/expense-by-nature.test.ts`.
2. Tạo các kịch bản test với `cdfsAccounts` giả lập chứa các tên tài khoản tùy biến thực tế.
3. Chạy vitest để kiểm tra kết quả phân loại và kiểm tra cân đối.
4. Chạy `npm run typecheck` và toàn bộ test suite.

## 4. Tiêu Chí Kiểm Tra
- 100% test cases mới và cũ đều PASS.
- Không phát sinh lỗi typecheck (`npm run typecheck`).
