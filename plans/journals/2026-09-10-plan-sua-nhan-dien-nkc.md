# Journal: Plan sửa nhận diện NKC

- **Date**: 2026-09-10
- **Plan**: `plans/260910-0930-nkc-recognition-fix` (validated OK, 2 phases)

## Chẩn đoán

- Từ điển alias đủ 10 cột của user (xác minh từng cột + normalizer). Bệnh nằm ở 3 điểm rơi: paste hardcode 0–5, `?? 0` ở setMeta + đổi sheet, match tên sheet cứng.
- Ảnh chụp lệch code hiện tại (green tick + unchosen) — ghi nhận, có thể do bản dev dở; 3 điểm rơi là việc thật.
