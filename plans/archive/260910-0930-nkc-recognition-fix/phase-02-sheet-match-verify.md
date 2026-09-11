# Phase 2: Sheet Match Verify

## Overview

- Priority: P1, Status: Pending
- Tên sheet NKC tolerant + verify toàn bộ.

## Key Insights

- `WorkingPaperGenerator.ts:135–138` match cứng `NKC`/`NhatKyChung`/`GL`, rớt về `worksheets[0]`: file có `NKC_TrcDC` + sheet khác đứng đầu là sai sheet.

## Requirements

1. Helper `findNkcSheet(wb)`: chuẩn hóa tên (bỏ dấu, upper, bỏ `_ - space`): khớp `NKC*` trước (`NKC`, `NKC_TRCDC`, `NKC SAU DC`...), rồi `NHATKYCHUNG`/`GL`, cuối cùng `worksheets[0]`.
2. Rà các match cứng NKC khác trong repo (`grep NhatKyChung|'NKC'`) — chỉ đổi chỗ thiếu, giữ nguyên chỗ đã tolerant (sampling/excel import dùng classifier theo nội dung, không theo tên).
3. Verify: typecheck, lint, full tests, build + smoke file có 2 sheet NKC_TrcDC/NKC_SauDC.

## Related Code Files

- Modify: `src/domain/workingpaper/WorkingPaperGenerator.ts` (+ helper nội bộ)
- Grep rà: mọi `getWorksheet('NKC')` cứng còn lại

## Implementation Steps

1. Viết helper + thay điểm match.
2. Test helper với tên sheet biến thể.
3. Verify 4 lệnh + smoke.

## Todo List

- [x] Helper tolerant + thay thế
- [x] Test tên biến thể
- [x] 4 lệnh xanh + smoke

## Success Criteria

- `NKC_TrcDC` được chọn thay vì sheet đầu; không regression luồng working paper (`workingpaper.test.ts` xanh).

## Risk Assessment

- Sheet tên lạ không chứa NKC: fallback `worksheets[0]` như cũ, không tệ hơn.

## Next Steps

- Archive plan khi xong.
