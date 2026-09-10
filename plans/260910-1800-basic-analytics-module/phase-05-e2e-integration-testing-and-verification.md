---
title: "Phase 5: End-to-End Integration, Testing & Verification"
description: "Kiểm thử tích hợp toàn diện từ nạp file NKC, kéo thả XML tờ khai thuế đến hiển thị các bảng phân tích, đối chiếu chéo trên giao diện Desktop App, đảm bảo 100% test suite, typecheck và lint vượt qua."
status: planned
priority: P1
effort: "3h"
created: 2026-09-10
---

# Phase 5: End-to-End Integration, Testing & Verification

## 1. Mục Tiêu
Kiểm thử và nghiệm thu toàn diện toàn bộ tính năng của `Module Phân Tích Cơ Bản`:
1. Đảm bảo luồng dữ liệu thông suốt từ khi người dùng nạp file NKC tại `SetupPage` cho đến khi kết quả phân tích hiển thị đầy đủ trên `PreliminaryAnalyticsPage`.
2. Kiểm thử tính năng kéo thả file XML tờ khai thuế (01/GTGT và 05/KK-TNCN), kiểm tra tốc độ phản hồi và độ chính xác của bảng đối chiếu chéo.
3. Chạy toàn bộ các bộ kiểm thử tự động (Unit test, Integration test, TypeScript compiler, ESLint) để đảm bảo không phát sinh bất kỳ lỗi hồi quy nào đối với các phân hệ hiện có của `AuditSoft` (B410, Sampling, Working Paper, EtaxConverter).

## 2. Kịch Bản Kiểm Thử Toàn Trình (E2E Test Scenarios)

### Kịch bản 1: Phân tích Sổ NKC (GL Analytics Flow)
- **Đầu vào**: File Excel chứa sổ NKC 12 tháng với:
  + Phát sinh TK 635 (Lãi vay) = 2.500.000.000 đ; TK 515 (Lãi tiền gửi) = 100.000.000 đ -> Lãi vay thuần = 2.400.000.000 đ.
  + Phát sinh Có TK 214 (Khấu hao) = 1.000.000.000 đ.
  + Lợi nhuận thuần HĐKD Mã 30 = 3.000.000.000 đ.
  + Giao dịch Nợ 128 / Có 112 = 500.000.000 đ (không có 515).
  + Khách hàng lớn nhất chiếm 35% doanh thu TK 511.
  + Doanh thu tháng 12 tăng gấp đôi trung bình các tháng.
- **Kỳ vọng**:
  + Thẻ KPI EBITDA hiển thị đúng $3.000M + 2.400M + 1.000M = 6.400.000.000$ đ.
  + Mức trần 30% EBITDA $= 1.920.000.000$ đ.
  + Thẻ tỷ lệ hiển thị `37.5%` kèm cảnh báo đỏ: `VƯỢT TRẦN 30%! Vượt 480.000.000 đ`.
  + Bảng Bên liên quan nhận diện đúng đối tượng vay 500.000.000 đ 0% lãi suất.
  + Bảng Pareto cảnh báo khách hàng Top 1 vượt ngưỡng an toàn 30%.
  + Ma trận 12 tháng highlight cảnh báo màu vàng tại cột Tháng 12.

### Kịch bản 2: Kéo thả XML Thuế & Đối chiếu chéo (Tax Cross-Reconciliation Flow)
- **Đầu vào**:
  + 4 file XML tờ khai thuế GTGT Quý 1, 2, 3, 4 (chuẩn TT80/2021).
  + 1 file XML tờ khai quyết toán TNCN năm 05/QTT-TNCN.
- **Thao tác**: Kéo thả đồng thời 5 file vào `TaxDropZone` trên Tab Phân Tích Cơ Bản.
- **Kỳ vọng**:
  + Ứng dụng nhận diện thành công 4 tờ khai GTGT và 1 tờ khai TNCN trong vòng dưới 1 giây.
  + Bảng thống kê Thuế GTGT hiển thị đầy đủ các cột [34], [24], [35], [40], [43] của từng Quý và Cả năm.
  + Bảng đối chiếu chéo so sánh từng Quý giữa Doanh thu thuế [34] vs Phát sinh Có TK 511 trên NKC, báo xanh nếu khớp (`0 đ`) hoặc báo đỏ nếu lệch.
  + Bảng thống kê Thuế TNCN hiển thị số lao động, tổng thu nhập chịu thuế và đối chiếu với Chi phí lương TK 334.

## 3. Lệnh Kiểm Thử & Tiêu Chí Đạt Chuẩn (Verification Commands)

Chạy tuần tự các lệnh sau trong môi trường terminal:

```bash
# 1. Kiểm tra Typecheck toàn bộ dự án (cả Web, Node và Tests)
npm run typecheck

# 2. Kiểm tra Linting
npm run lint

# 3. Chạy toàn bộ Test Suites của dự án
npm run test

# 4. Chạy riêng bộ test phân tích cơ bản mới
npx vitest run tests/vat-pit-xml-parsers.test.ts tests/accounting-analytics-engines.test.ts tests/tax-cross-reconciler.test.ts

# 5. Kiểm tra Build toàn bộ ứng dụng (Vite + Node + Workers)
npm run build
```

## 4. Bằng Chứng Nghiệm Thu (Acceptance Evidence)
1. `npm run typecheck` kết thúc với mã lỗi `0` (Zero errors).
2. `npm run lint` không có bất kỳ warning/error nào vi phạm.
3. 100% các bài test trong `tests/` pass thành công.
4. `npm run build` sinh ra đầy đủ các bundle trong `dist/` và `dist-electron/`.
5. Ứng dụng khởi chạy bằng `npm start`, chuyển đổi mượt mà giữa các tab và thực thi trơn tru toàn bộ luồng phân tích.
