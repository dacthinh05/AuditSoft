---
phase: 2
title: "SetupPage: Thêm nút Tạo 12 Giấy làm việc kiểm toán dưới nút Đối chiếu"
status: completed
priority: P1
effort: "25m"
dependencies: [1]
---

# Phase 2: SetupPage — Nút Shortcut Tạo Working Paper

## Overview
Tại `src/renderer/pages/SetupPage.tsx`, bổ sung một nút phụ/secondary action nổi bật ngay dưới hoặc bên cạnh nút "BẮT ĐẦU ĐỐI CHIẾU DỮ LIỆU" trong dock điều khiển. Nút này sáng lên khi người dùng đã nạp file cho Nguồn ① HOẶC Nguồn ② (hoặc cả hai). Khi bấm, hệ thống chuyển sang màn hình Working Paper với file nguồn đã được tự động gán.

## Requirements
- Functional:
  - Nút hiển thị: "TẠO 12 GIẤY LÀM VIỆC KIỂM TOÁN (GLV)"
  - Trạng thái kích hoạt: Sáng lên khi có ít nhất một nguồn có `filePath` hợp lệ (khác `(clipboard)`).
  - Logic chọn nguồn khi có cả hai: Ưu tiên Nguồn ② (Sau điều chỉnh) vì là số chốt kiểm toán. Nếu chỉ có Nguồn ① thì lấy Nguồn ①. Nếu chỉ có Nguồn ② thì lấy Nguồn ②.
  - Subtext/Tooltip giải thích rõ ràng nguồn nào đang được chọn:
    - Cả 2 nguồn: "Dùng file Sau điều chỉnh (Nguồn ②) để lập 12 Giấy làm việc"
    - Chỉ Nguồn ①: "Dùng file Trước điều chỉnh (Nguồn ①) để lập 12 Giấy làm việc"
    - Chỉ Nguồn ②: "Dùng file Sau điều chỉnh (Nguồn ②) để lập 12 Giấy làm việc"
  - Khi bấm: gọi `setWorkingPaperSourcePath(chosenPath)` và `setView('workingpaper')`.
- Non-functional:
  - Giao diện hài hòa với design system hiện tại (CSS classes, màu sắc, typography).
  - Không làm vỡ layout của `run-dock-card`.

## Architecture & UI Mockup
```
┌────────────────────────────────────────────────────────────────────────┐
│ [Cả 2 nguồn đã sẵn sàng đối chiếu]  [ ⚡ BẮT ĐẦU ĐỐI CHIẾU DỮ LIỆU ]   │
│                                                                        │
│ ── Hoặc lập hồ sơ kiểm toán độc lập ───────────────────────────────── │
│ [ 📑 TỰ ĐỘNG ĐIỀN 12 GIẤY LÀM VIỆC KIỂM TOÁN (VSA / TT200) ]           │
│   (Đã nhận diện file: NKC_2025_SauDC.xlsx)                             │
└────────────────────────────────────────────────────────────────────────┘
```

## Related Code Files
- Modify: `src/renderer/pages/SetupPage.tsx`
- Modify: `src/renderer/styles.css` (nếu cần thêm styling nút phụ)

## Implementation Steps
1. Xác định `wpSourceCandidate`:
   - `const wpSourcePath = after.cfg?.filePath && after.cfg.filePath !== '(clipboard)' ? after.cfg.filePath : (before.cfg?.filePath && before.cfg.filePath !== '(clipboard)' ? before.cfg.filePath : null)`
   - `const hasWpSource = Boolean(wpSourcePath)`
2. Thêm button action trong `run-dock-card` với icon `IconFileSpreadsheet` hoặc `IconLayers`.
3. Xử lý sự kiện `onClick`:
   - Kiểm tra `wpSourcePath`. Nếu có, gọi `setWorkingPaperSourcePath(wpSourcePath)` và `setView('workingpaper')`.
   - Nếu không có, hiển thị gợi ý nạp file vào Nguồn ① hoặc Nguồn ②.

## Success Criteria
- [ ] Nút xuất hiện dưới nút đối chiếu tại SetupPage
- [ ] Nút tự động disabled nếu chưa nạp file nào
- [ ] Nút enabled khi nạp Nguồn ① HOẶC Nguồn ②
- [ ] Bấm nút chuyển thẳng sang view `workingpaper`
