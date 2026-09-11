---
id: "phase-04"
name: "Kiểm thử end-to-end với các mẫu tài khoản thực tế và build hệ thống"
plan: "plans/260911-1407-auto-extract-partner-from-accounts/plan.md"
status: "pending"
---

# Pha 4: Kiểm thử end-to-end với các mẫu tài khoản thực tế và build hệ thống

## 1. Mục Tiêu
Viết kịch bản kiểm thử toàn diện với các mẫu tài khoản có đuôi mã đối tác và xác thực không gây hồi quy (no side-effects).

## 2. Các Bước Thực Hiện
1. Viết script kiểm thử:
   - Dữ liệu đầu vào: Các giao dịch có TK `3311ABC`, `3312XYZ`, `1311SH`, `1311DBL`, `1411THINH` không có cột mã đối tượng riêng.
   - Kiểm tra kết quả bóc tách:
     * `entry.objectCode` hoặc `entry.partnerCode` được gán chính xác (`ABC`, `XYZ`, `SH`...).
     * Bảng Pareto tính đúng tỷ trọng cho từng đối tác.
     * Thuật toán xé phiếu chi tiền mặt gom nhóm đúng cụm theo đối tác.
2. Chạy `npm run build` xác thực toàn bộ TypeScript, Vite và Worker.

## 3. Tiêu Chí Nghiệm Thu
- [ ] Tất cả các test cases bóc tách tài khoản công nợ đều PASS.
- [ ] Lệnh build `npm run build` thành công 100% không có lỗi.
