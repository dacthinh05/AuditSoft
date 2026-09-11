# Journal: Sửa Nhận Diện NKC (Sheet + Cột)

- **Date**: 2026-09-10
- **Plan**: `plans/260910-0930-nkc-recognition-fix` (2/2 phases completed)
- **Scope**: `SetupPage.tsx`, `PasteModal.tsx`, `reconcileSlice.ts`, `WorkingPaperGenerator.ts`, `columnMapper.ts`

## Vấn Đề Gốc
1. Dán từ Clipboard (`PasteModal`): sau khi bấm Xác nhận, `handleApplyPaste` bỏ qua toàn bộ kết quả nhận diện tiêu đề, hardcode mapping cố định `0..5`. Nếu dữ liệu paste có tiêu đề lệch cột hoặc có hàng tiêu đề ở trên, cột bị gán sai vị trí.
2. Fallback âm thầm gán cột 0 (`?? 0..5`): trong `reconcileSlice.ts` (`setMeta`) và `SetupPage.tsx` (khi đổi sheet), nếu cột không được nhận diện, hệ thống âm thầm gán `?? 0`, `?? 1`... khiến cột chưa nhận diện vẫn bị trỏ vào cột 0 (Ngày ghi sổ). Đã đổi toàn bộ sang `?? null` để hiển thị `-- Chưa chọn --` (viền đỏ) buộc người dùng chọn tay.
3. Nhận diện sheet NKC cứng (`WorkingPaperGenerator.ts`): trước đây chỉ tìm đúng 3 tên cứng `NKC`, `NhatKyChung`, `GL`, nếu không thấy thì lấy `worksheets[0]`. Với file có sheet `NKC_TrcDC`, `NKC_SauDC` mà đứng sau sheet khác thì bị chọn sai sheet.

## Các Thay Đổi Kỹ Thuật
1. **`PasteModal.tsx`**: `onApply` truyền thêm `parsed.matrix` (toàn bộ ma trận đã parse).
2. **`SetupPage.tsx`**:
   - `handleApplyPaste` gọi `detectHeaderAndMapping(fullMatrix)` để tự động dò dòng tiêu đề và map đúng 10 cột, hỗ trợ cả trường hợp thứ tự cột bị đảo lộn hoặc có dòng tiêu đề công ty ở trên.
   - Khi đổi sheet: đổi `s.suggestedMapping[k] ?? 0..5` thành `?? null` để không tự gán cột 0.
3. **`reconcileSlice.ts`**:
   - `setMeta`: đổi `first.suggestedMapping[k] ?? 0..5` thành `?? null`.
4. **`WorkingPaperGenerator.ts`**:
   - Thêm helper `findNkcSheet(wb)` chuẩn hóa tên sheet (bỏ dấu, uppercase, bỏ ký tự đặc biệt): ưu tiên sheet bắt đầu bằng `NKC` (`NKC_TrcDC`, `NKC SAU DC`...), sau đó là sheet chứa `NHATKYCHUNG` hoặc `GL`, cuối cùng mới fallback về `worksheets[0]`.
5. **Domain wrapper**: tạo `src/domain/columnMapper.ts` để renderer import `detectHeaderAndMapping` đúng chuẩn kiến trúc (không vi phạm `no-restricted-imports`).

## Kiểm Chứng
- `npm run typecheck`: 0 lỗi.
- `eslint`: 0 lỗi trên các file chạm.
- `vitest`: 57 test files, 290 tests pass 100%.
  - `tests/nkc-header-detection.test.ts`: 4 test cases kiểm tra chuỗi 10 cột thực tế của người dùng, thứ tự đảo lộn, có 2 dòng tiêu đề ở trên, và cột lạ trả về `null`.
  - `tests/find-nkc-sheet.test.ts`: 3 test cases kiểm tra các biến thể `NKC_TrcDC`, `NKC SAU DC`, `NhatKyChung`, `GL` và fallback.
- `npm run build`: Vite, Node và Workers build thành công 100%.
