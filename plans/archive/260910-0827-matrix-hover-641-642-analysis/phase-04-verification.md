# Phase 4: Verification

## Overview

- Priority: P1, Status: Pending
- Khóa chất lượng: type, lint, tests, build + checklist nghiệm thu theo ảnh.

## Requirements

- `npm run typecheck` 0 lỗi (web/node/tests).
- `npm run lint` 0 lỗi.
- `npm test` toàn bộ xanh, gồm test `warningNotes` cũ và 2 test file mới.
- `npm run build` thành công.
- Checklist tay trên `npm run dev` với sổ thật: hover 3 ô vàng, cuộn ma trận, bảng 641/642, fill file G200 thật.

## Related Code Files

- Toàn bộ file 3 phase trước; không sửa code mới trong phase này ngoài fix regression.

## Implementation Steps

1. Chạy `typecheck`, `lint`, `test`, `build` theo thứ tự; fix regression nếu có.
2. Grep `(!)` trong `GlAnalyticsTab.tsx` phải rỗng; grep `SmartAuditAlerts` toàn repo phải rỗng.
3. Smoke UI + smoke Excel trên file thật cùng user (xác nhận tên sheet/cột).

## Todo List

- [x] typecheck + lint xanh
- [x] full tests xanh
- [x] build thành công
- [x] smoke UI + Excel với user

## Success Criteria

- 4 lệnh xanh; checklist tay đạt 5/5 mục Success Criteria của plan.

## Risk Assessment

- File thật lệch layout: quay lại phase 3 đúng 1 iteration, không mở rộng scope.

## Security Considerations

- Không có.

## Next Steps

- `/ak:cook` thực thi; archive plan khi xong.
