---
title: "Universal Subaccount Allocation Engine — Cơ Chế Bóc Tách & Phân Bổ Tài Khoản Con Phổ Quát"
description: "Xây dựng cơ chế lõi resolveSubAccountAllocation() giải quyết bài toán đa dạng loại hình doanh nghiệp: Tự động phân cấp cây tài khoản (112, 128, 334, 341), tự động bóc tách Top trọng yếu Pareto + gom dòng 'Khác' khi số lượng vượt quá số dòng form Excel, xóa sạch dòng thừa, tự động thích ứng TT 200, TT 133 và FDI."
status: completed
priority: P1
effort: 1.5h
branch: main
tags:
  - workingpaper
  - universal-engine
  - subaccounts
  - pareto-allocation
  - multi-tenant
  - tt200-tt133
created: 2026-09-11
---

# Kế Hoạch: Universal Subaccount Allocation Engine

## 1. Bối Cảnh & Thách Thức
- Mỗi doanh nghiệp nạp số liệu vào AuditSoft có một cách tổ chức tài khoản con và số lượng đối tượng hoàn toàn khác nhau:
  + Doanh nghiệp FDI: Có tài khoản lương người nước ngoài `3342`, tiền gửi ngoại tệ `1122FR`, mã ngân hàng dạng chữ `1121TCB`.
  + Doanh nghiệp SME (TT 200 / TT 133): Mã ngân hàng dạng số `11211`, `11212`, chỉ có duy nhất `334` chung.
  + Số lượng tài khoản con biến động: Có đơn vị chỉ có 1 tài khoản ngân hàng, có đơn vị có 8 ngân hàng, trong khi form Lead Schedule (`D 110`, `E 110`) có số dòng thiết kế cố định (ví dụ 3 dòng).
- Nếu hardcode theo một mẫu doanh nghiệp cụ thể, phần mềm sẽ bị gãy, tràn dòng hoặc để sót tên mẫu cũ khi gặp khách hàng khác.

## 2. Giải Pháp Triển Khai (Universal Adaptive Strategy)
1. **Module lõi `subAccountResolver.ts`:**
   - Hàm `resolveSubAccountAllocation(accounts, prefix, maxRows, options)`:
     * Lọc tất cả các tài khoản con thuộc `prefix` (độ dài $> 3$, bỏ qua chính tài khoản mẹ `prefix`).
     * Lấy tên tài khoản trực tiếp từ CDFS của khách hàng.
     * Sắp xếp theo số dư thực tế giảm dần.
     * **Thuật toán Pareto:**
       - Nếu số lượng tài khoản $\le \text{maxRows}$: Điền 1:1 đủ các tài khoản con, các dòng còn lại đánh dấu `isEmpty: true` để xóa sạch dữ liệu mẫu cũ.
       - Nếu số lượng tài khoản $> \text{maxRows}$: Điền $(\text{maxRows} - 1)$ tài khoản lớn nhất; dòng cuối cùng tự động gom toàn bộ các tài khoản còn lại thành dòng `"Các tài khoản khác"` với số dư bằng tổng số dư còn lại.
2. **Tích hợp vào các phần hành cốt lõi:**
   - `D100_CashFiller.ts`: Tiền gửi ngân hàng (`112*` vào dòng 14-16) & Tiền gửi có kỳ hạn (`1281*` vào dòng 19-20).
   - `E100_BorrowingFiller.ts`: Vay ngắn hạn (`3412*`/`3411N` vào dòng 11-12) & Vay dài hạn (`3411*`/`3411D` vào dòng 15-16).
   - `E400_PayrollFiller.ts`: Tự động phát hiện nếu có `3341` và `3342` thì bóc tách người Việt và người nước ngoài; nếu chỉ có `334` thì gom chung chuẩn mực.

---

## 3. Lộ Trình Phân Kỳ (Phases)

| Phase | Nhiệm vụ chính | Files tác động |
| :--- | :--- | :--- |
| **Phase 1** | Xây dựng module lõi `subAccountResolver.ts` | `src/domain/workingpaper/subAccountResolver.ts` |
| **Phase 2** | Tích hợp vào `D100_CashFiller.ts`, `E100_BorrowingFiller.ts`, `E400_PayrollFiller.ts` | `src/domain/workingpaper/fillers/*.ts` |
| **Phase 3** | Viết unit tests kiểm thử đa dạng kịch bản và verify 0 lỗi | `tests/subaccount-resolver.test.ts`<br>`tests/workingpaper.test.ts` |
