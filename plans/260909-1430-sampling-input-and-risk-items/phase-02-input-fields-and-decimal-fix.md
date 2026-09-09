---
phase: 2
title: "Input Field Fixes & Decimal Formatting in SamplingTab"
status: completed
priority: P1
effort: "1.5h"
dependencies: ["phase-01-domain-engine-risk-toggle.md"]
---

# Phase 2: Input Field Fixes & Decimal Formatting in SamplingTab

## Overview

Khắc phục triệt để lỗi nhập liệu tại các ô tỷ lệ trong bảng Mức trọng yếu A710 (`SamplingTab.tsx`):
1. **Ô PM (Dòng f):** Người dùng cần nhập được `65%` (hoặc bất kỳ tỷ lệ nào như `50`, `60`, `70`, `75`). Cần loại bỏ hành vi kẹp giá trị `Math.max(0.5, ...)` tức thời ngay khi đang gõ từng phím bấm. Cho phép xóa trắng ô để gõ lại.
2. **Ô CTT (Dòng h):** Người dùng cần nhập được số thập phân `3,5%` (hoặc `3.5%`), không bị ép làm tròn lên `4%`. Cần thay đổi `step="0.1"`, `min="0"`, `max="10"`, bỏ `Math.round(cttRatio * 100)`.
3. **Định dạng số Việt Nam:** Xử lý chuỗi nhập liệu để chấp nhận cả dấu phẩy `,` và dấu chấm `.` khi người dùng gõ số thập phân (ví dụ `3,5` hay `1,5`).
4. **Ô OM (Dòng d):** Kiểm tra và đảm bảo gõ số thập phân (như `1,5%` hay `0,5%`) không bị giật hay kẹp tức thời về 0.1 khi xóa.

## Requirements

### Functional
1. **Cơ chế Input không bị giật (No immediate aggressive clamping on intermediate typing):**
   - Tạo helper hàm parse tỷ lệ `parsePercentInput(val: string): number | null`:
     - Thay thế dấu phẩy `,` thành dấu chấm `.`.
     - Lọc các ký tự không hợp lệ, parse sang số float.
     - Trả về `null` nếu chuỗi rỗng để người dùng có thể xóa trắng ô và gõ lại.
   - Khi người dùng đang gõ (`onChange`):
     - Cho phép nhập giá trị tự do trong khung hợp lý (ví dụ: PM từ 0 đến 100, CTT từ 0 đến 20).
     - Chỉ cập nhật state khi chuỗi biểu diễn số hợp lệ; nếu đang xóa dở hoặc chuỗi rỗng thì giữ trạng thái hiển thị tạm thời hoặc gán giá trị hợp lệ mà không ép nhảy số 50.
   - Khi người dùng rời ô (`onBlur`):
     - Tự động chuẩn hóa về khoảng quy chuẩn nếu vượt khung (PM kẹp vào khoảng `[0.5, 0.75]` hoặc giữ nguyên kèm cảnh báo nhẹ, CTT kẹp vào khoảng `[0, 0.1]`).
2. **Ô PM (f):**
   - Giá trị hiển thị: `(config.benchmark.pmRatio * 100)`.
   - Khi người dùng gõ `65`, tỷ lệ lưu trong `config.benchmark.pmRatio` là `0.65`.
   - Hỗ trợ nút spinner với `step="1"` hoặc `step="5"`.
3. **Ô CTT (h):**
   - Bỏ `Math.round(...)` $\rightarrow$ hiển thị chính xác `(config.benchmark.cttRatio * 100)`. Ví dụ `0.035 * 100 = 3.5`.
   - `step="0.1"`, `min="0"`, `max="10"`.
   - Khi người dùng gõ `3,5` hoặc `3.5`, lưu `cttRatio = 0.035`.
4. **Ô OM (d):**
   - Đảm bảo `config.benchmark.percentage` nhận giá trị thập phân mượt mà (ví dụ `1.5` hiển thị đúng `1,5` hoặc `1.5`, cho phép gõ `0.5`).

## Related Code Files

- `src/renderer/components/SamplingTab.tsx`
- `src/renderer/styles.css`

## Implementation Steps

1. Xây dựng component hoặc local state helper `PercentInput` hoặc hàm xử lý `handlePmChange`, `handleCttChange`, `handleOmPercentChange` trong `SamplingTab.tsx`.
2. Thay thế `<input>` của PM (dòng 973):
   - Loại bỏ `Math.max(0.5, ...)` tức thời trong `onChange`.
   - Sử dụng `step="1"`, `min="50"`, `max="75"`.
   - Đảm bảo gõ `65` cập nhật ngay lập tức `pmRatio = 0.65`.
3. Thay thế `<input>` của CTT (dòng 1002):
   - Chuyển `step="0.1"`, `min="0"`, `max="10"`.
   - Hiển thị giá trị float mà không dùng `Math.round`.
   - Hỗ trợ parse cả dấu `,` và `.`.
4. Tinh chỉnh CSS nếu cần để các ô nhập hiển thị cân đối và rõ ràng các số thập phân.
5. Kiểm tra khả năng tương tác trực tiếp:
   - Thử gõ `65`, xóa trắng ô, gõ `70`.
   - Thử gõ `3,5`, `3.5`, `0.5`, `4`.

## Verification Gate

- Khởi chạy ứng dụng hoặc kiểm thử component, kiểm tra tương tác:
  - Nhập `65` vào ô PM $\rightarrow$ hiển thị `65%`, dòng (g) PM tính theo đúng $65\% \times \text{OM}$.
  - Nhập `3,5` vào ô CTT $\rightarrow$ hiển thị `3,5%`, dòng (i) CTT tính theo đúng $3.5\% \times \text{OM}$.
  - Xóa trắng ô PM và CTT $\rightarrow$ không bị văng lỗi và không bị tự động nhảy số 50.
