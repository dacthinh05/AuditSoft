---
title: "Quy Trình Kiểm Toán 2 Đợt (Interim 30/06 -> Final 31/12) & Tự Động Đối Chiếu Hồi Tố Sổ Sách"
description: "Hỗ trợ quy trình kiểm toán 2 đợt chuẩn mực VACPA: Cho phép KTV nạp lại bộ Giấy làm việc Đợt 1 (30/06) khi làm Đợt 2 (31/12), tự động trích xuất số dư chốt đợt 1 vào Cột L ('Số dư 30/06 đợt 1'), tự động tính số dư lũy kế 6 tháng từ sổ đợt 2 vào Cột K ('Số dư 30/06 đợt 2'), để Cột M tự động phát hiện mọi hành vi sửa sổ hồi tố."
status: completed
priority: P1
effort: 2h
branch: main
tags:
  - workingpaper
  - multi-period
  - interim-audit
  - final-audit
  - retrospective-check
  - column-l-k
created: 2026-09-11
---

# Kế Hoạch: Quy Trình Kiểm Toán 2 Đợt (Interim 30/06 -> Final 31/12) & Đối Chiếu Hồi Tố

## 1. Bối Cảnh & Vấn Đề Nghiệp Vụ
- Trong kiểm toán thực tế tại Việt Nam, các hợp đồng kiểm toán thường chia làm 2 đợt:
  1. **Đợt 1 (Interim Audit — Giữa niên độ / 30/06):** KTV soát xét và chốt số liệu 6 tháng đầu năm, xuất ra bộ hồ sơ Giấy làm việc Đợt 1.
  2. **Đợt 2 (Final Audit — Kết thúc năm / 31/12):** KTV quay lại kiểm toán cả năm tài chính.
- **Rủi ro kiểm toán trọng yếu:** Sau khi KTV kết thúc đợt 1, kế toán doanh nghiệp có thể lén lút sửa đổi, chèn thêm hoặc xóa bớt các bút toán thuộc giai đoạn 6 tháng đầu năm (hồi tố sổ sách).
- **Thiết kế sẵn có trong Template VACPA:**
  - Ở tất cả các bảng Lead Schedule (`G 210`, `D 110`, `D 310`, `D 510`, `E 110`, `E 210`...), ở cuối bảng đều có một cụm cột ẩn chuyên dụng:
    * **Cột K (hoặc L):** `Số dư 30/06 đợt 2` (tính lại từ sổ cả năm).
    * **Cột L (hoặc M):** `Số dư 30/06 đợt 1` (số liệu đã kiểm toán và chốt sổ tại đợt 1).
    * **Cột M (hoặc N):** `Chênh lệch` (công thức `= K - L`). Nếu $\ne 0$ $\rightarrow$ Báo động đỏ kế toán đã sửa sổ 6 tháng đầu năm!
- **Yêu cầu:** Tự động hóa hoàn toàn quy trình này: KTV chỉ cần add bộ GLV Đợt 1 vào khi làm Đợt 2, hệ thống sẽ tự động điền các cột ẩn này.

## 2. Mục Tiêu (Outcome)
1. **Module `InterimPeriodReconciler.ts`:**
   - Trích xuất toàn bộ số dư đã chốt tại ngày 30/06 từ bộ GLV Đợt 1 (quét từ file `A - B - H` sheet `bcdsps-Truoc DC` hoặc các file Lead Schedule).
   - Tính toán số dư lũy kế đến 30/06 từ sổ NKC cả năm nạp ở Đợt 2.
2. **Điền Cột Ẩn trên các Lead Schedules (`x10`):**
   - `G 210` (Giá vốn): Cột K & L, chênh lệch Cột M.
   - `D 110` (Tiền): Cột K & L, chênh lệch Cột M.
   - `D 310` (Phải thu): Cột K & L, chênh lệch Cột M.
   - `D 510` (Hàng tồn kho): Cột K & L, chênh lệch Cột M.
   - `E 110` (Vay): Cột L & M, chênh lệch Cột N.
   - `E 210` (Phải trả): Cột L & M, chênh lệch Cột N.
3. **Giao diện người dùng (`WorkingPaperPage.tsx`):**
   - Bổ sung Toggle chọn: `[Kiểm toán Đợt 1 (01/01 - 30/06)]` | `[Kiểm toán Đợt 2 / Cả năm (01/07 - 31/12)]`.
   - Khi chọn Đợt 2: Hiển thị thêm DropZone nạp `Bộ Giấy làm việc Đợt 1` (chấp nhận thư mục hoặc file .zip).
4. **Kiểm thử:** Đảm bảo 100% test suite và typecheck pass.

---

## 3. Lộ Trình Triển Khai (Phases)

| Phase | Nhiệm vụ chính | Files tác động |
| :--- | :--- | :--- |
| **Phase 1** | Xây dựng Module `InterimPeriodReconciler.ts` | `src/domain/workingpaper/InterimPeriodReconciler.ts`<br>`src/domain/workingpaper/types.ts` |
| **Phase 2** | Tích hợp điền cột ẩn K & L trên các Lead Schedules | `src/domain/workingpaper/fillers/*.ts` |
| **Phase 3** | Bổ sung UI chọn đợt và khay nạp GLV Đợt 1 | `src/renderer/pages/WorkingPaperPage.tsx`<br>`src/renderer/styles.css` |
| **Phase 4** | Kiểm thử, viết regression tests và nghiệm thu | `tests/interim-reconciler.test.ts`<br>`tests/workingpaper.test.ts` |
