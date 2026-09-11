# Phase 03: Test Mô Phỏng Tấn Công + Nghiệm Thu Toàn Diện

## 1. Mục Tiêu
Mỗi lỗ hổng có 1 test đỏ-trước-xanh-sau (hoặc test khóa hành vi), suite cũ không đỏ.

## 2. Việc Làm
1. `tests/security-hotfix.test.ts`:
   - H1: đọc `src/shared/license.ts` dạng text, assert không chứa `DEFAULT_VIP_LICENSE_KEY` (khóa regression rẻ tiền).
   - H4: gọi hàm gate đường dẫn (export pure từ main? nếu vướng Electron `app`, tách hàm gate vào `src/main/ipcFileGuard.ts` để test được không cần Electron) — case: path chưa đăng ký → throw; đuôi `.exe` → throw; path đã đăng ký + `.xlsx` → pass.
   - H5: `escapeSqlString` với `O'Brien`, `'; DROP TABLE --`, unicode; assert output bao quote đúng và round-trip qua DuckDB memory (dùng `DuckDbEngine` thật nếu CI có native binding, không thì assert chuỗi SQL).
   - H2/H3: test `downloadAndInstallUpdate` với manifest hash sai → không gọi `spawn` (mock `child_process`); `checkUpdate` handler bỏ qua customUrl (test ở mức hàm nếu tách được, không thì test tay).
2. Chạy `tsc` 3 project + `vitest run` full. Test tay trên app build: nạp NKC, nạp ZIP thuế, chạy update-check (mạng thật), xác nhận không regression luồng hợp lệ.
3. Đánh dấu plan COMPLETED + commit theo file ownership từng phase.

## 3. Nghiệm Thu
- 5 tiêu chí `plan.md` §4 đạt đủ.
