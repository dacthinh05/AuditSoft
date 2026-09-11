---
title: "Phase 1: Kích Hoạt File Master A-B-H và Leadsheet-2025"
description: "Xây dựng ABH_MasterFiller và LeadsheetFiller để tự động sinh toàn bộ BCTC (B01, B02, LCTT), tính mức trọng yếu A710 và 38 chương trình kiểm toán."
status: completed
priority: P1
effort: "50m"
tags: [workingpaper, master-abh, leadsheet, materiality, a710, b420]
---

# Phase 1: Kích Hoạt File Master A-B-H và Leadsheet-2025

## Mục Tiêu
1. File `A - B - H - Mau 2025 - Thinh.xlsx` là "trái tim" của bộ hồ sơ kiểm toán VACPA. Khi đổ CDFS vào sheet `bcdsps-Truoc DC`, toàn bộ 41 sheets còn lại (`B420.CDKT`, `B420.KQKD`, `LCTT`, `A510.CDKT`, `A510.KQKD`, `A710`...) tự động tính toán số liệu.
2. File `Leadsheet - 2025 - Dac Thinh.xlsx` chứa 38 sheets chương trình kiểm toán (.1 mục tiêu & cơ sở dẫn liệu, .2 thủ tục chi tiết) cần được điền tự động thông tin engagement và đánh dấu các thủ tục đã thực hiện.

## Thiết Kế Kỹ Thuật

### 1. `src/domain/workingpaper/fillers/ABH_MasterFiller.ts`
- **Xử lý sheet `ADD`:** Điền tên khách hàng, niên độ, KTV, người soát xét.
- **Xử lý sheet `bcdsps-Truoc DC`:**
  - Cột A: TK Cấp 1 (3 số đầu).
  - Cột B: TK Cấp 2 (các số tiếp theo).
  - Cột D: Mã số TK đầy đủ.
  - Cột E: Tên tài khoản.
  - Cột F: Số dư đầu năm Nợ.
  - Cột G: Số dư đầu năm Có.
  - Cột H: Số phát sinh trong kỳ Nợ.
  - Cột I: Số phát sinh trong kỳ Có.
  - Cột J: Số dư cuối năm trước Đ/C Nợ.
  - Cột K: Số dư cuối năm trước Đ/C Có.
  - Đổ toàn bộ danh sách `cdfsAccounts` bắt đầu từ hàng 7 trở đi.
- **Xử lý sheet `A710` (Xác định mức trọng yếu VSA 320):**
  - Tiêu chí: Lấy Doanh thu thuần (Mã 10 B02) hoặc Tổng tài sản (Mã 100 B01).
  - Điền giá trị tiêu chí vào ô C24 (Kế hoạch) và D24 (Thực tế).
  - Tỷ lệ ước tính: 1% Doanh thu (ô E28 = 0.01).
  - Tỷ lệ MTY thực hiện (PM): 75% (ô E33 = 0.75).
  - Tỷ lệ Ngưỡng sai sót không đáng kể (CTT): 4% (ô E35 = 0.04).
  - Các ô C32, C34, C36 tự động tính toán qua công thức Excel sẵn có.

### 2. `src/domain/workingpaper/fillers/LeadsheetFiller.ts`
- **Xử lý sheet `ADD`:** Điền thông tin engagement.
- **Xử lý 38 sheets chương trình kiểm toán:**
  - Nhận diện các sheet `.1` (Mục tiêu & Cơ sở dẫn liệu): Điền mức đánh giá rủi ro cơ sở dẫn liệu (Mặc định: "THẤP" / "TRUNG BÌNH" tùy thuộc rủi ro sơ bộ).
  - Nhận diện các sheet `.2` (Danh mục thủ tục kiểm toán):
    - Cột Người thực hiện: Điền tên KTV.
    - Cột Ngày: Điền ngày lập.
    - Cột Thủ tục (F): Tự động điền dấu tick `P` (Performed) cho các thủ tục đối chiếu số dư, phân tích biến động, kiểm tra mẫu mà hệ thống đã thực thi.
    - Cột Tham chiếu GLV (W/P Ref): Điền mã GLV tương ứng (ví dụ: `D110`, `D310`, `G110`, `D191`...).

## Files Tạo Mới / Thay Đổi
- Tạo mới `src/domain/workingpaper/fillers/ABH_MasterFiller.ts`
- Tạo mới `src/domain/workingpaper/fillers/LeadsheetFiller.ts`
- Cập nhật `src/domain/workingpaper/WorkingPaperGenerator.ts`: Thêm 2 runner cho `A - B - H` và `Leadsheet`.

## Tiêu Chí Nghiệm Thu
- [ ] Xuất thành công file `A - B - H` với đầy đủ số liệu CDFS tại `bcdsps-Truoc DC`.
- [ ] Bảng cân đối kế toán và KQKD trong `A - B - H` nhảy số chính xác.
- [ ] Mức trọng yếu `A710` được điền đầy đủ số liệu kế hoạch và thực tế.
- [ ] Xuất thành công file `Leadsheet` với 38 sheets được điền thông tin và tham chiếu W/P.
