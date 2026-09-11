---
title: "Phase 4: Rà Soát Padding Toàn Trang & Xác Thực Hoàn Thiện"
description: "Chuẩn hóa khoảng cách padding, gap, margin trên toàn bộ phân hệ Phân Tích Sổ NKC và chạy kiểm thử typecheck."
status: completed
priority: P1
effort: "20m"
tags: [analytics, verification, padding-audit, typecheck]
---

# Phase 4: Rà Soát Padding Toàn Trang & Xác Thực Hoàn Thiện

## Mục Tiêu
Đảm bảo toàn bộ phân hệ Phân Tích Sổ NKC tuân thủ chặt chẽ hệ thống spacing đồng nhất của AuditSoft, không còn chỗ nào padding quá dày hoặc quá hẹp, đồng thời 100% typecheck và test suite pass.

## Quy Chuẩn Spacing AuditSoft Áp Dụng
- **Khoảng cách giữa các Section/Hàng (Row Gap):** `16px` nhất quán (trước đây là `18px`).
- **Padding trong mỗi Card dữ liệu:** `16px 20px` (desktop tiêu chuẩn).
- **Padding của Table Cell:** `7px 10px` cho các hàng dữ liệu, `8px 10px` cho header `<th>`.
- **Bo góc (Border Radius):** `10px` cho các card con/chart, `12px` cho card lớn bao ngoài.
- **Màu nền:** `#ffffff` trên nền trang `#f8fafc`.

## Kế Hoạch Xác Thực
1. **Typecheck:** Chạy `npm run typecheck` đảm bảo 0 lỗi TypeScript.
2. **Build Verification:** Chạy `npm run build` để đảm bảo bundle Vite và Electron renderer đóng gói thành công.
3. **Kiểm tra trực quan code:**
   - Xác nhận không còn `1fr 1fr` kéo giãn card EBITDA cạnh card KQKD.
   - Xác nhận `ProfitWaterfallChart` mở rộng full-width không vỡ viền.
   - Xác nhận không còn khoảng trống chết vô nghĩa > 40px ở bất kỳ card nào.

## Tiêu Chí Nghiệm Thu
- [ ] `npm run typecheck` đạt 0 error.
- [ ] `npm run build` thành công 100%.
- [ ] Toàn bộ UI phân hệ #05 trông thoáng đãng, chuyên nghiệp, thông tin hiển thị dày dặn mà không ngột ngạt.
