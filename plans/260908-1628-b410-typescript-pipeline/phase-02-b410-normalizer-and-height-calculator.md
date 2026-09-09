---
phase: 2
title: "B410 Normalizer & Height Calculator"
status: pending
priority: P1
effort: "1h"
dependencies: ["phase-01-start.md"]
---

# Phase 2: B410 Normalizer & Height Calculator

## Overview
Xây dựng module `B410Normalizer.ts` chịu trách nhiệm chuẩn hóa mã GLV, nhóm lưu ý theo kiểm toán viên thực hiện, phát hiện cảnh báo trùng lặp và tính toán chiều cao dòng chính xác để triệt tiêu lỗi ảnh đè chữ.

## Requirements
- Functional:
  - Chuẩn hóa mã GLV:
    - Xóa khoảng trắng thừa: `E 440.1` -> `E440.1`, `TH 1` -> `TH1`.
    - Giữ nguyên chữ cái in hoa, chữ số và dấu chấm.
  - Nhóm Người thực hiện:
    - Nếu dòng có dạng `Người thực hiện: [Tên] - SĐT: [Số]` nằm ở cuối nhóm: gán tên KTV này cho toàn bộ các lưu ý liên tục ngay phía trên.
    - Nhóm các lưu ý theo KTV để chuẩn bị chèn dòng chốt người thực hiện khi đổi KTV.
  - Tính toán chiều cao dòng an toàn (`calculateRowHeight`):
    - Tính `textRequiredHeight`: dựa trên độ dài chuỗi, số ký tự mỗi dòng và số lần ngắt dòng `\n`.
    - `finalRowHeight = Math.max(textRequiredHeight, sourceRowHeight, tallestImageHeight + 6)`.
    - Với dòng có ảnh cao 148pt - 200pt: chiều cao dòng luôn được đặt `>= 154pt - 206pt`.
  - Phát hiện lưu ý nghi trùng: so sánh GLV, từ khóa trong thực trạng và số tiền để ghi cảnh báo vào log mà không tự ý xóa.
- Non-functional:
  - Thuật toán tính toán thuần túy trên CPU (In-memory), không phụ thuộc vào Excel.

## Architecture
```
B410Issue (Raw) ──► Normalizer
                      ├─ Clean GLV ('E 440.1' -> 'E440.1')
                      ├─ Assign Performer Group
                      ├─ Calculate finalRowHeight = max(text, source, img + 6)
                      └─ Check potential duplicates
                               │
                               ▼
                      B410NormalizedIssue[]
```

## Related Code Files
- Create: `src/domain/workingpaper/b410/B410Normalizer.ts`

## Implementation Steps
1. Viết hàm `normalizeGlvCode(rawGlv: string): string`.
2. Viết hàm `calculateSafeRowHeight(issue: B410Issue): number`.
3. Viết hàm `normalizeIssues(issues: B410Issue[]): B410NormalizedIssue[]`.

## Success Criteria
- [x] Mã GLV luôn đúng chuẩn: không có khoảng trắng thừa.
- [x] Chiều cao dòng được tính toán chính xác: dòng có ảnh không bao giờ bị ép về chiều cao mặc định.
- [x] Xác định đúng nhóm người thực hiện cho từng lưu ý.
