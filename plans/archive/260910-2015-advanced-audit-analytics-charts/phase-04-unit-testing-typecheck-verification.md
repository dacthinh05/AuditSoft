---
title: "Phase 4: Unit Testing, Typecheck & Verification"
description: "Xây dựng bộ kiểm thử tự động cho toàn bộ các engine tính toán tương quan tài chính mới, đảm bảo 100% typecheck, linting và build đóng gói sản phẩm hoàn hảo."
status: planned
priority: P1
effort: "3h"
created: 2026-09-10
---

# Phase 4: Unit Testing, Typecheck & Verification

## 1. Mục Tiêu
Đảm bảo toàn bộ mã nguồn mới được kiểm chứng chặt chẽ bằng unit tests, không có bất kỳ lỗi biên dịch TypeScript hay vi phạm quy tắc ESLint nào, và toàn bộ 46+ test suites hiện có của `AuditSoft` tiếp tục vượt qua 100%.

## 2. Kịch Bản Kiểm Thử Unit Test (`tests/financial-correlation-engine.test.ts`)

1. **Kiểm thử Biên Lãi Gộp 12 Tháng (Gross Margin 12M)**:
   - Dữ liệu: 12 tháng với Doanh thu và Giá vốn.
   - Kiểm tra: Công thức tính từng tháng, biên lãi gộp trung bình cả năm, và cờ cảnh báo các tháng biên âm hoặc biến động lệch $\pm 10\%$.
   - Kiểm tra trường hợp biên (Edge case): Doanh thu tháng bằng 0 không gây lỗi chia cho 0 (`division by zero`), trả về 0%.
2. **Kiểm thử Bóc Tách Chi Phí Giá Vốn (COGS Cost Structure)**:
   - Dữ liệu: Phát sinh Nợ các tài khoản 621, 622, 627, 154, 156.
   - Kiểm tra: Tỷ trọng % của từng khoản mục được tính đúng, tổng tỷ trọng các yếu tố cộng lại bằng 100%.
3. **Kiểm thử Tỷ Lệ OPEX Trên Doanh Thu (OPEX Ratios)**:
   - Kiểm tra tỷ lệ Chi phí bán hàng (641) và Chi phí QLDN (642) trên doanh thu qua 12 tháng.
4. **Kiểm thử Cầu Nối Dòng Chảy Lợi Nhuận (Profit Waterfall)**:
   - Dữ liệu: Đầy đủ các khoản mục từ Doanh thu thuần (511) đến LNTT.
   - Kiểm tra: Số tiền lũy kế (cumulative) của từng bước khớp tuyệt đối với số liệu trên Báo cáo kết quả hoạt động kinh doanh (B02-DN).

## 3. Lệnh Kiểm Thử & Tiêu Chuẩn Nghiệm Thu

```bash
# 1. Chạy riêng bộ kiểm thử tương quan tài chính mới
npx vitest run tests/financial-correlation-engine.test.ts

# 2. Kiểm tra Typecheck toàn bộ dự án
npm run typecheck

# 3. Kiểm tra Linting
npm run lint

# 4. Chạy toàn bộ Test Suites của dự án
npm test

# 5. Biên dịch bản Build đóng gói
npm run build
```

## 4. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
1. `tests/financial-correlation-engine.test.ts` pass 100%.
2. `npm run typecheck` kết thúc với 0 errors.
3. `npm run lint` kết thúc với 0 errors, 0 warnings.
4. Toàn bộ test suites của dự án tiếp tục pass 100%.
5. `npm run build` đóng gói thành công Vite, Node, và Worker bundles.
