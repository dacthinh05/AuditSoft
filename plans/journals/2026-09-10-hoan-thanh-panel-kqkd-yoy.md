# Journal: Hoàn thành panel KQKD năm nay vs năm trước

- **Date**: 2026-09-10
- **Plan**: `plans/260910-0917-kqkd-yoy-panel` (3/3 done)

## Thay đổi

1. Helper `buildKqkdYoY` (B02 ưu tiên → NKC fallback theo map TK, lãi vay chỉ từ B02) + types `KqkdYoYRow`/`GlAnalyticsResult.kqkdYoY` + page wiring.
2. Panel phải thành KQKD YoY: bảng Mã số/Năm nay/Năm trước/Chênh lệch/%, badge nguồn Số B02/Kết từ NKC, hướng dẫn khi thiếu prior, chart grouped-bar 6 dòng chính, dải GDBLQ gọn + mở rộng khi có findings.
3. Test `kqkd-yoy` 3 case (B02 đủ, NKC thuần, rỗng).

## Nghiệm thu

- typecheck 0 lỗi · lint sạch toàn repo · 52 files / 270 tests pass · build OK · text empty-state cũ đã xóa.
