# Phase 2: Kqkd Yoy Ui Chart

## Overview

- Priority: P1, Status: Pending
- Thay panel phải bằng bảng KQKD YoY + grouped-bar chart; findings GDBLQ thành dải gọn.

## Requirements

- `GlAnalyticsTab.tsx`: ô phải trong grid 2 cột hiện tại đổi từ related-party sang `KqkdYoYPanel`.
- Bảng: cột Mã số | Chỉ tiêu | Năm nay | Năm trước | Chênh lệch | %; số monospace, 0/`-` theo quy tắc `-`, chênh lệch đỏ/xanh theo dấu.
- Badge nguồn số liệu: "Số B02" (xanh) hoặc "Kết từ NKC" (xám); khi thiếu prior: dòng hướng dẫn "Nạp file có sheet KQKD/BCTC đủ 2 năm để so sánh".
- Chart mới `src/renderer/components/Analytics/charts/KqkdYoYChart.tsx` (Pure SVG theo pattern chart hiện có): grouped-bar 6 dòng chính (10, 11, 60, 25, 26, 70), Năm nay xanh + Năm trước xám, hover tooltip số VNĐ; thiếu prior thì chỉ 1 cột.
- Dải GDBLQ: nếu `relatedParties.length > 0` hiện banner amber gọn trên cùng card ("Phát hiện N dấu hiệu GDBLQ" + nút mở rộng liệt kê name/description); = 0 thì không hiện gì (bỏ empty-state xanh chiếm chỗ).

## Architecture

- Component nội bộ trong `GlAnalyticsTab.tsx` hoặc file con `KqkdYoYPanel.tsx`; chart file riêng theo quy ước `charts/`.
- Không đổi `RelatedPartyScanner`; chỉ đổi cách hiển thị `relatedParties` đã có trong `data`.

## Related Code Files

- Create: `src/renderer/components/Analytics/charts/KqkdYoYChart.tsx`
- Modify: `src/renderer/components/Analytics/GlAnalyticsTab.tsx`

## Implementation Steps

1. Viết `KqkdYoYChart` theo pattern `RevenueCogsComboChart` (rút gọn 1 trục, không baseline).
2. Thay panel phải: bảng + badge nguồn + hướng dẫn + chart + dải GDBLQ.
3. Smoke `dev` 2 case (có/không prior).

## Todo List

- [x] Chart component
- [x] Panel thay thế + dải GDBLQ
- [x] Smoke 2 case

## Success Criteria

- Đủ 2 năm: bảng + chart 2 cột; thiếu prior: `-` + hướng dẫn; có findings: dải amber mở rộng được.

## Risk Assessment

- Bảng 12 dòng + chart trong 1 card nửa шири: mitigation là bảng font 12px cuộn dọc tối đa ~320px, chart cao 220px.

## Security Considerations

- Không có.

## Next Steps

- Phase 3 verify.
