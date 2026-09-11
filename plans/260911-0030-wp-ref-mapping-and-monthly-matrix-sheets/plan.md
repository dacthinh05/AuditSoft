---
title: "Tự Động Hóa Sheet Tài Khoản Đối Ứng (x90) Kèm Bảng Tham Chiếu W/P Ref & Các Sheet Ma Trận 12 Tháng"
description: "Tích hợp bảng tra cứu mã tham chiếu W/P Ref từ Ref.xlsx (63 tài khoản 3 số -> mã GLV D190, D790, E390...), tự động điền các Sheet Tài Khoản Đối Ứng (E290, D190, D590, D690, D790, E190, E390, G290, G390, G490) kèm Kết Luận kiểm toán, và hoàn thiện 100% các Sheet Ma Trận 12 Tháng."
status: completed
priority: P1
effort: 3h
branch: main
tags:
  - workingpaper
  - ref-mapping
  - counterpart-accounts
  - x90-sheets
  - monthly-matrix
  - audit-conclusion
created: 2026-09-11
---

# Kế Hoạch: Tự Động Hóa Sheet Tài Khoản Đối Ứng (x90) & Các Sheet Ma Trận 12 Tháng

## 1. Bối Cảnh & Vấn Đề Người Dùng Đặt Ra
1. **Sheet Tài Khoản Đối Ứng (Các sheet `x90`):**
   - Trong hồ sơ kiểm toán mẫu VACPA, mỗi phần hành đều có một bảng thống kê phát sinh trong kỳ theo **Tài khoản đối ứng** (ví dụ: `E290` trong file `E200 - Phai tra`, `D190` trong `D100 - Tien`, `D590` trong `D500 - HTK`, `D690`, `D790`, `E190`, `E390`, `G290`, `G390`, `G490`...).
   - **Đặc tả chính xác từ Image #1 người dùng cung cấp:**
     + Bảng gồm 2 vế: **PS NỢ** (Bên Nợ tài khoản phần hành đối ứng với các tài khoản Có) và **PS CÓ** (Bên Có tài khoản phần hành đối ứng với các tài khoản Nợ).
     + Mỗi dòng gồm 4 cột: `[Mã W/P Ref] [TK Đối Ứng (3 số)] [Số Tiền] [Tỷ Lệ %]`.
     + **Bảng tra cứu tham chiếu W/P Ref:** Người dùng cung cấp tệp `D:\Desktop\Ref.xlsx` chứa từ điển chuẩn:
       * `111`, `112` $\rightarrow$ `D190`
       * `128`, `221`..`229` $\rightarrow$ `D290`
       * `131`, `138` $\rightarrow$ `D390`
       * `133`, `3331`..`3339` $\rightarrow$ `E390`
       * `152`..`156` $\rightarrow$ `D590`
       * `211`, `214`, `241` $\rightarrow$ `D790`
       * `242`, `244`, `141` $\rightarrow$ `D690`
       * `331`, `3388` $\rightarrow$ `E290`
       * `334`, `335`, `338` $\rightarrow$ `E490`
       * `341` $\rightarrow$ `E190`
       * `511`, `515`, `711` $\rightarrow$ `G190`
       * `621`, `622`, `627`, `632` $\rightarrow$ `G290`
       * `641` $\rightarrow$ `G390`
       * `642` $\rightarrow$ `G490`
     + Cuối bảng có phần **KẾT LUẬN KIỂM TOÁN** tự động:
       * *"Không có phát sinh đối ứng bất thường"*
       * Câu nhận định nghiệp vụ chính (ví dụ: *"Mua nguyên liệu & được chi trả cho nhà cung cấp qua ngân hàng là chủ yếu"*).
2. **Các Sheet Thống Kê Ma Trận Theo Tháng:**
   - Hệ thống cần đảm bảo điền đầy đủ 100% các bảng ma trận 12 tháng:
     * `G353`: Ma trận Chi phí bán hàng 641 (12 tháng x 6 tiểu khoản).
     * `G453`: Ma trận Chi phí quản lý doanh nghiệp 642 (12 tháng x 7 tiểu khoản).
     * `D553`: Ma trận đối chiếu Nhập - Xuất 12 tháng TK 152.
     * `E380`: Ma trận đối chiếu số thuế GTGT đầu vào/ra 12 tháng.
     * `E381`: Ma trận đối chiếu số thuế TNCN khấu trừ/đã nộp 12 tháng.
     * `E490` / `E491`: Ma trận chi phí lương 12 tháng theo bộ phận và chi trả lương.
     * `G150`: Ma trận doanh thu 12 tháng.
     * `E250.2`: Công nợ 12 tháng theo từng nhà cung cấp.

---

## 2. Mục Tiêu Cụ Thể (Outcome)
1. **Module `RefDictionary`:** Xây dựng file `src/domain/workingpaper/RefDictionary.ts` chứa bảng ánh xạ chính xác 63 tài khoản từ `D:\Desktop\Ref.xlsx`, cung cấp hàm `getWorkingPaperRef(account: string): string`.
2. **Triển khai `E290` hoàn hảo theo Image #1:**
   - Bóc tách toàn bộ phát sinh Nợ và Có của TK 331 từ `ctx.nkcTransactions`.
   - Gom theo TK đối ứng 3 số (111, 112, 133, 241, 642, 152, 156...).
   - Điền Mã Ref (`D190`, `E390`, `D790`, `G490`...), Mã TK, Số tiền, Tỷ lệ % cho cả Đợt 1 (Rows 14-25) và Cả năm (Rows 36-47).
   - Tự động điền phần `KẾT LUẬN:` tại dòng 41-43.
3. **Mở rộng sang các sheet đối ứng khác (`D190`, `D590`, `D690`, `D790`, `E190`, `G290`, `G390`, `G490`):**
   - Sử dụng chung cơ chế bóc tách đối ứng và gán mã Ref tự động.
4. **Kiểm thử & Xác minh:**
   - `vitest run tests/workingpaper.test.ts` pass 100%.
   - `npm run typecheck` 0 lỗi.

---

## 3. Lộ Trình Phân Kỳ (Phases)

| Phase | Nhiệm vụ chính | Files tác động |
| :--- | :--- | :--- |
| **Phase 1** | Xây dựng Module `RefDictionary.ts` từ `D:\Desktop\Ref.xlsx` | `src/domain/workingpaper/RefDictionary.ts` |
| **Phase 2** | Triển khai điền Sheet Đối ứng `E290` chuẩn xác theo Image #1 | `src/domain/workingpaper/fillers/E200_PayableFiller.ts` |
| **Phase 3** | Mở rộng điền các Sheet Đối ứng `x90` khác (`D190`, `D590`, `D690`, `E190`...) | `src/domain/workingpaper/fillers/D100_CashFiller.ts`<br>`src/domain/workingpaper/fillers/D500_InventoryFiller.ts`<br>`src/domain/workingpaper/fillers/E100_BorrowingFiller.ts` |
| **Phase 4** | Rà soát & hoàn thiện tất cả các Sheet Ma trận 12 Tháng | `src/domain/workingpaper/fillers/*.ts` |
| **Phase 5** | Kiểm thử, Xác thực dữ liệu và Typecheck | `tests/workingpaper.test.ts` |
