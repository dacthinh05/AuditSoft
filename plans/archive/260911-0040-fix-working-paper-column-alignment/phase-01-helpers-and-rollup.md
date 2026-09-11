# Phase 1: Nâng cấp setLeadRowValues & Rollup Helper (helpers.ts)

## Mục tiêu
Tạo nền tảng xử lý dữ liệu chuẩn xác cho toàn bộ 12 fillers:
1. **Helper Rollup số dư tài khoản:**
   - Tạo hàm `getAccountRollup(cdfsMap, prefix)`:
     - Nếu có mã chính xác `prefix` với số dư > 0 $\rightarrow$ lấy số dư đó.
     - Nếu mã chính xác có số dư = 0 hoặc không tồn tại $\rightarrow$ tìm tất cả tài khoản bắt đầu bằng `prefix` và cộng dồn toàn bộ số dư nợ/có đầu kỳ và cuối kỳ.
2. **Nâng cấp `setLeadRowValues`:**
   - Nhận diện linh hoạt vị trí cột đầu kỳ (PY) là Cột 7 (G) hay Cột 8 (H).
   - Kiểm tra an toàn trước khi ghi: Nếu ô đích đang chứa công thức `formula`, tuyệt đối không ghi đè số lên.

## File tác động
- `src/domain/workingpaper/helpers.ts`
