# Phase 3: UI Note Verify

## Overview

- Priority: P1, Status: Pending
- Ghi chú rõ khi Dòng 6 = 0 + verify toàn bộ.

## Requirements

- `SamplingTab.tsx` dòng count Dòng 6 (`riskCount.note`): khi bật quét mà count = 0 → '= Đã quét tự động (đảo, tháng 12, tròn số ≥50tr, từ khóa, cutoff, Top-N bù): không phát hiện dòng rủi ro.' Khi tắt vẫn note cũ.
- Không đổi nút "+ Tự chọn mẫu đặc biệt" (đã work: chuyển view + scroll).
- Verify: typecheck, lint file chạm, full tests, build.

## Related Code Files

- Modify: `src/renderer/components/SamplingTab.tsx` (1 dòng note có điều kiện)

## Implementation Steps

1. Sửa note Dòng 6 theo điều kiện.
2. Verify 4 lệnh xanh.

## Todo List

- [x] Note UI khi trắng
- [x] typecheck + lint + tests + build

## Success Criteria

- Sổ sạch: Dòng 6 hiện Top-10 + note nguồn; tắt quét: note "đã tắt" như cũ.

## Next Steps

- Archive plan khi xong.
