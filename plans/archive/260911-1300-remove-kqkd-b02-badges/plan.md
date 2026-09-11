---
slug: remove-kqkd-b02-badges
title: Gỡ bỏ các badge text LỖ HĐKD / LỖ GỘP / BIẾN ĐỘNG trong bảng B02 KQKD
status: planned
created: 2026-09-11
mode: fast
---

# Kế Hoạch: Gỡ bỏ badge text LỖ HĐKD, LỖ GỘP, BIẾN ĐỘNG khỏi bảng B02 KQKD

## Mục tiêu (Outcome)
Loại bỏ các nhãn text nổi (badges) không cần thiết (`LỖ HĐKD`, `LỖ GỘP`, `BIẾN ĐỘNG`) trong cột "Chỉ tiêu" của bảng B02 KQKD (`GlAnalyticsTab.tsx`). Giữ giao diện gọn gàng, tinh tế theo phong cách phần mềm kiểm toán chuyên nghiệp, người dùng nhìn vào số âm (màu đỏ) và % biến động là hiểu ngay bản chất.

## Phạm vi tác động
- **File**: `src/renderer/components/Analytics/GlAnalyticsTab.tsx`
- **Vị trí**: Dòng ~406-416 trong render cell của `r.chiTieu`.

## Các giai đoạn thực hiện
- [phase-01-remove-badges.md](./phase-01-remove-badges.md) - Gỡ bỏ rendering badge và làm sạch style hiển thị cell `Chỉ tiêu`.
- [phase-02-verification.md](./phase-02-verification.md) - Kiểm tra render, kiểm tra typecheck và build frontend.
