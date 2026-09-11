---
title: "Phase 4: Hoàn Thiện Tài Sản, Vay, Thuế & Đầu Tư D700, E100, E300, D200"
description: "Bổ sung ước tính chi phí khấu hao D792, ước tính lãi vay E191, bóc tách thuế TNDN và trần lãi vay NĐ 132 E382, và xây dựng mới D200_InvestmentFiller."
status: completed
priority: P1
effort: "40m"
tags: [workingpaper, fixed-assets, depreciation, borrowings, interest-cap, tax, investments]
---

# Phase 4: Hoàn Thiện Tài Sản, Vay, Thuế & Đầu Tư D700, E100, E300, D200

## Mục Tiêu
1. `D700`: Bổ sung thủ tục phân tích VSA 520 quan trọng bậc nhất của TSCĐ: Ước tính chi phí khấu hao độc lập (`D792`) dựa trên nguyên giá bình quân x tỷ lệ khấu hao bình quân ngành.
2. `E100`: Bổ sung thủ tục ước tính chi phí lãi vay độc lập (`E191`) dựa trên dư nợ vay bình quân x lãi suất bình quân.
3. `E300`: Bổ sung bảng kiểm tra thuế TNDN và chi phí không được trừ theo Nghị định 132/2020/NĐ-CP (`E382`).
4. `D200`: Xây dựng mới hoàn toàn `D200_InvestmentFiller.ts` cho tệp `D200 - Dau tu - ABC 2020.xlsx`.

## Thiết Kế Kỹ Thuật

### 1. `src/domain/workingpaper/fillers/D700_FixedAssetFiller.ts`
- **Sheet `D792` (Ước tính chi phí khấu hao TSCĐ độc lập):**
  - Lấy Nguyên giá đầu năm (DK 211) và cuối năm (CK 211).
  - Tính Nguyên giá bình quân = (Đầu năm + Cuối năm) / 2 theo từng nhóm tài sản:
    * Nhà cửa, vật kiến trúc (2111) — Tỷ lệ KH ~ 4% - 5% (20 - 25 năm).
    * Máy móc, thiết bị (2112) — Tỷ lệ KH ~ 10% - 15% (7 - 10 năm).
    * Phương tiện vận tải (2113) — Tỷ lệ KH ~ 12.5% - 16% (6 - 8 năm).
    * Thiết bị, dụng cụ quản lý (2114) — Tỷ lệ KH ~ 20% - 33% (3 - 5 năm).
  - Tính toán Chi phí khấu hao ước tính của KTV = Nguyên giá bình quân x Tỷ lệ KH.
  - So sánh với Chi phí khấu hao thực tế đơn vị đã trích (Phát sinh Có 214 trong năm).
  - Tính độ lệch chênh lệch và đánh giá rủi ro trích thừa/thiếu khấu hao.

### 2. `src/domain/workingpaper/fillers/E100_BorrowingFiller.ts`
- **Sheet `E191` (Ước tính chi phí lãi vay độc lập - VSA 520):**
  - Lấy Dư nợ vay ngắn hạn và dài hạn đầu năm và cuối năm (TK 3411, 3412).
  - Tính Dư nợ vay bình quân trong kỳ.
  - Ước tính Lãi suất vay bình quân (từ các hợp đồng vay hoặc lãi suất thị trường ~7% - 9.5%/năm).
  - Tính Chi phí lãi vay ước tính = Dư nợ bình quân x Lãi suất bình quân.
  - So sánh với Chi phí lãi vay thực tế phát sinh (Nợ TK 635 / Có 112, 335).
  - Đánh giá chênh lệch có vượt ngưỡng sai sót CTT hay không.

### 3. `src/domain/workingpaper/fillers/E300_TaxFiller.ts`
- **Sheet `E382` (Bóc tách Chi phí thuế TNDN & Chỉ tiêu B4 - Trần lãi vay 30%):**
  - Tích hợp số liệu từ `EbitdaCalculator`:
    * Lợi nhuận thuần từ HĐKD (Mã 30)
    * Chi phí lãi vay thuần (Nợ 635 - Có 515)
    * Khấu hao TSCĐ (Có 214)
    * EBITDA kỳ này
    * Mức trần 30% EBITDA
    * Chi phí lãi vay không được trừ (Chỉ tiêu B4)
  - Điền vào bảng quyết toán thuế TNDN trên GLV E382.

### 4. `src/domain/workingpaper/fillers/D200_InvestmentFiller.ts` (Mới)
- Xử lý file `D200 - Dau tu - ABC 2020.xlsx`:
  - `ADD`: Điền thông tin engagement.
  - `D210`: Lead schedule các khoản đầu tư tài chính ngắn/dài hạn:
    * TK 121: Chứng khoán kinh doanh
    * TK 128: Đầu tư nắm giữ đến ngày đáo hạn (tiền gửi có kỳ hạn > 3 tháng)
    * TK 221, 222, 228: Đầu tư vào công ty con, liên kết, vốn khác
    * TK 2291: Dự phòng giảm giá đầu tư tài chính
  - `D290`: Kiểm tra doanh thu tài chính phát sinh từ đầu tư (Cổ tức, lãi tiền gửi đối ứng Có TK 515).

## Files Tạo Mới / Thay Đổi
- Tạo mới `src/domain/workingpaper/fillers/D200_InvestmentFiller.ts`
- Cập nhật `src/domain/workingpaper/fillers/D700_FixedAssetFiller.ts`
- Cập nhật `src/domain/workingpaper/fillers/E100_BorrowingFiller.ts`
- Cập nhật `src/domain/workingpaper/fillers/E300_TaxFiller.ts`

## Tiêu Chí Nghiệm Thu
- [ ] Bảng ước tính khấu hao `D792` và lãi vay `E191` tính toán hợp lý, ra số chênh lệch rõ ràng.
- [ ] Sheet `E382` nhận đúng số liệu EBITDA và khuyến nghị điều chỉnh B4.
- [ ] File `D200` được sinh thành công trong runner.
