---
title: "Chuẩn Hóa Hồ Sơ Kiểm Toán Mẫu VACPA (Phương Án B: Dọn Sheet, Tickmarks Footers & AJE Bridge Vào Leadsheets)"
description: "Dọn dẹp tên sheet & sheet rác, bổ sung khối chú thích Tickmarks chuẩn VACPA chân bảng kiểm tra mẫu, và tự động liên kết bút toán điều chỉnh AJE từ B410 vào cột Điều chỉnh thuần của 12 Leadsheet (*10)."
status: in_progress
priority: P1
effort: 3h
branch: main
tags:
  - workingpaper
  - vacpa
  - vsa500
  - tickmarks
  - aje
  - b410
  - openxml
created: 2026-09-10
---

# Kế Hoạch Triển Khai: Chuẩn Hóa Hồ Sơ Kiểm Toán Mẫu VACPA (Phương Án B)

## 1. Bối Cảnh & Mục Tiêu (Outcome)

Qua rà soát 15 tệp Giấy làm việc (GLV) mẫu thực tế trong `GLV MAU`, cấu trúc hiện tại đã đạt 85% - 90% chuẩn mực kiểm toán. Để hoàn thiện đạt **100% chuẩn mực hồ sơ kiểm toán mẫu VACPA** và phục vụ thực địa mượt mà, Phương án B tập trung vào 3 trọng tâm:

1. **Dọn dẹp & Khử lỗi tên Sheet**:
   - Loại bỏ khoảng trắng thừa ở đuôi tên sheet (`"E 492 "` $\rightarrow$ `"E 492"`, `"H150 "` $\rightarrow$ `"H150"`).
   - Xóa bỏ sheet phụ mặc định không sử dụng (`Sheet1` trong `E400 - Luong`).
   - Bảo toàn các công thức liên kết giữa các workbook.

2. **Chuẩn Hóa Bảng Chú Thích Ký Hiệu Kiểm Toán (Tickmarks Legend) Chân Trang**:
   - Bổ sung khối Tickmarks chuẩn mực ở chân các sheet kiểm tra mẫu (ví dụ `D 191.1`, `D 191.2`, `D 391`, `E 191`, `E 291`, `G 191.1`):
     * `^`: Đã kiểm tra số cộng số học (Footing/Cross-footing).
     * `✓`: Đã kiểm tra đối chiếu với chứng từ gốc hợp lệ (Vouching).
     * `GL`: Đã khớp đúng với Sổ Cái (Agreed to General Ledger).
     * `TB`: Đã khớp đúng Bảng CĐPS (Agreed to Trial Balance).

3. **Cơ Chế Liên Kết Tự Động Bút Toán Điều Chỉnh (AJE Bridge) Vào Leadsheet (`*10`)**:
   - Hiện tại cột "Điều chỉnh thuần" (Cột E trên các Leadsheet `D 110`, `D 310`, `E 110`, `E 210`, `G 110`...) đang để trống hoặc số 0.
   - Khi có dữ liệu `adjustingEntries` (từ B410 hoặc KTV nhập), tự động tính toán tổng số tiền điều chỉnh Tăng/Giảm theo từng tài khoản cấp 1/cấp 2 và điền vào Cột E.
   - Cột F (`Số dư sau kiểm toán`) tự động cập nhật chính xác theo công thức `= D + E`.

---

## 2. Ràng Buộc & Không Thuộc Phạm Vi (Constraints & Non-goals)

- **Constraints**:
  - Không phá vỡ công thức tính toán và cấu trúc OpenXML sẵn có của 13 file mẫu.
  - Sử dụng `OpenXmlPackageEditor` cho toàn bộ các thao tác ghi file để bảo vệ tuyệt đối drawings và link ngoài.
  - Tương thích ngược: khi `ctx.adjustingEntries` chưa có hoặc rỗng, Leadsheet vẫn hoạt động bình thường, cột E giữ nguyên 0 / `-`.
- **Non-goals**:
  - Không thay đổi các sheet tự chấm điểm `*99_ChamDiem`.
  - Không xóa các dòng mẫu KTV tự ghi chú.

---

## 3. Các Giai Đoạn Thực Hiện (Phased Execution)

| Phase | Tên Giai Đoạn | Tệp Tin Tác Động Chính |
|---|---|---|
| **Phase 1** | Dọn dẹp tên sheet & sheet rác trên template | `GLV MAU/E400...xlsx`, `GLV MAU/A - B - H...xlsx` |
| **Phase 2** | Bổ sung khối chú giải Tickmarks chuẩn VACPA | `src/domain/workingpaper/helpers.ts`, các Fillers mẫu |
| **Phase 3** | Xây dựng AJE Bridge cập nhật Cột Điều Chỉnh trên 12 Leadsheets | `src/domain/workingpaper/helpers.ts`, `D100_CashFiller.ts`, `D300...`, `E100...` |
| **Phase 4** | Kiểm thử tự động, verify bằng Microsoft Excel COM & Build | `tests/workingpaper.test.ts`, `scripts/verify-all-12-glv-com.ts` |
