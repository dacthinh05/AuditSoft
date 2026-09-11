# Phase 1: Paste Detect Null Mapping

## Overview

- Priority: P1, Status: Pending
- Paste chạy `detectHeaderAndMapping`; `?? 0` → `null` ở 2 nơi khởi tạo mapping.

## Key Insights

- `parseClipboardTable` đã tách header (`headerRowIndex`) nhưng `handleApplyPaste` (`SetupPage.tsx:145`) bỏ qua, hardcode 0–5.
- `setMeta` (`reconcileSlice.ts:86–91`) và đổi sheet (`SetupPage.tsx:262–272`) gán `?? 0..5`: cột không nhận âm thầm trỏ cột 0.

## Requirements

1. `handleApplyPaste` nhận thêm full matrix (đổi `PasteModal onApply` truyền `parsed.matrix`, hoặc detect trong modal): gọi `detectHeaderAndMapping(matrix)`; mapping = kết quả detect (null cho cột không nhận); `headerRow` giữ logic hiện tại theo `headerRowIndex`.
2. `setMeta` và đổi-sheet: 6 cột core `?? null` thay vì `?? 0..5` (partner/ext giữ null).
3. Mapping card hiện có (dropdown tay) không đổi — giờ nó mới phát huy tác dụng khi auto thiếu.
4. Không vỡ chữ ký dùng ở nơi khác: `onApply` chỉ dùng ở SetupPage (grep xác nhận).

## Architecture

- Import `detectHeaderAndMapping` từ `infrastructure/excel/columnMapper` vào `SetupPage.tsx` (module thuần, không node API).
- Không đổi `ColumnMapping` shape (đã nullable).

## Related Code Files

- Modify: `src/renderer/pages/SetupPage.tsx`, `src/renderer/components/PasteModal.tsx`, `src/renderer/state/slices/reconcileSlice.ts`
- Modify/Create (tests): test detect trên header 10 cột của user (đúng thứ tự + đảo thứ tự + thừa 2 dòng tiêu đề), test `?? null` qua setMeta.

## Implementation Steps

1. Đổi `onApply` truyền matrix; detect trong `handleApplyPaste`.
2. Sửa 2 chỗ `?? 0..5` → `?? null`.
3. Test mapper + test slice.
4. Chạy test liên quan + typecheck.

## Todo List

- [x] Detect trên paste
- [x] Null thay 0 (2 nơi)
- [x] Tests xanh

## Success Criteria

- Header user: 10/10 cột khớp; đảo cột vẫn đúng; cột lạ → null đỏ.
- Badge "Đã khớp" chỉ xanh khi đủ 6 cột core.

## Risk Assessment

- Paste không header: detect trả rỗng → mapping null hết, user chọn tay (đúng hơn hardcode sai 0–5).
- `setMeta` null làm flow file cũ hiện đỏ nếu detect thiếu: đúng ý, nhưng smoke kiểm tra file mẫu cũ vẫn xanh.

## Security Considerations

- Không có.

## Next Steps

- Phase 2: tên sheet + verify.
