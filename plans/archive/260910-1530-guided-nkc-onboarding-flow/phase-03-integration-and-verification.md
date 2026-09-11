# Phase 03: Đấu Dây Toàn App + Nghiệm Thu

## 1. Mục Tiêu
Gate hoạt động đồng bộ mọi màn hình, không còn đường vòng vào module khi thiếu dữ liệu, và toàn bộ suite xanh.

## 2. Việc Làm
1. Rà soát các điểm vào module còn lại (`HeaderNavigation`, `modulesRegistry` `viewKey`, `DatabaseConnector` modal `setCfg`): chỗ nào cho phép nạp thẳng BEFORE/AFTER mà qua mặt stepper thì gắn `ModuleGateBanner` hoặc disable kèm tooltip lý do — không chặn kỹ thuật, chỉ chặn giao diện + giải thích.
2. Thêm test `tests/nkc-requirements.test.ts`: map module→requirement đủ các viewKey; selectors `isBeforeReady/isAfterReady` đúng với 4 trạng thái (trống / cfg thiếu map / cfg đủ / pasted).
3. Chạy `npx tsc -p tsconfig.web.json --noEmit`, `npx tsc -p tsconfig.node.json --noEmit`, `npx vitest run`.
4. Walkthrough thủ công: app trắng → Bước 1 → nạp `MAU NKC.xlsx` → kiểm tra banner từng trang → Bước 2 → mở toàn bộ.

## 3. Nghiệm Thu
- 5 tiêu chí trong `plan.md` §4 đạt đủ.
- Full suite xanh, không test cũ nào đỏ.
