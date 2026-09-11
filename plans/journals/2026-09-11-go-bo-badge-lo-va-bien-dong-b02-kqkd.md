---
date: 2026-09-11
title: Gỡ bỏ badge text LỖ HĐKD / LỖ GỘP / BIẾN ĐỘNG trong bảng B02 KQKD
tags: [ui, analytics, clean-up]
---

# Tinh gọn giao diện bảng B02 KQKD

## Mục tiêu
- Loại bỏ các badge text `LỖ HĐKD`, `LỖ GỘP`, `BIẾN ĐỘNG` tại cột "Chỉ tiêu" trong bảng B02 KQKD theo yêu cầu người dùng.
- Giữ thông tin trực quan thông qua màu số tiền âm (đỏ) và phần trăm biến động mà không gây rối mắt bởi các badge chữ to.

## Thay đổi thực hiện
- `src/renderer/components/Analytics/GlAnalyticsTab.tsx`:
  - Gỡ bỏ thẻ badge hiển thị `LỖ GỘP`/`LỖ HĐKD` và `BIẾN ĐỘNG` khỏi cell `r.chiTieu`.
  - Giữ nguyên màu text chỉ tiêu nổi bật khi có lỗ và màu sắc các cột số liệu.

## Kết quả kiểm thử
- `npm run typecheck`: Passed sạch (0 lỗi).
