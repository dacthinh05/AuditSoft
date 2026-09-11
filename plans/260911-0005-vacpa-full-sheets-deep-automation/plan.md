---
title: "Tự Động Hóa Toàn Diện & Sâu Sắc 15 Giấy Làm Việc Kiểm Toán Chuẩn VACPA"
description: "Mở rộng độ phủ tự động hóa lên mức tối đa trên toàn bộ 15 tệp Excel GLV: Port G353/G453 ma trận chi phí 12 tháng sang OpenXML, tự động điền toàn bộ các sheet Thủ tục phân tích VSA 520 (D120, D320, D520, D720, E120, E220, E320, E420, G120), hoàn thiện thuyết minh Master A-B-H và các bảng kiểm tra chi tiết."
status: completed
priority: P1
effort: 4h
branch: main
tags:
  - workingpaper
  - vacpa
  - deep-automation
  - vsa520
  - openxml
  - master-abh
created: 2026-09-11
---

# Kế Hoạch: Tự Động Hóa Toàn Diện & Sâu Sắc 15 Giấy Làm Việc Kiểm Toán Chuẩn VACPA

## 1. Bối cảnh & Vấn đề Cần Giải Quyết
- Hệ thống hiện tại đã kết nối thành công 15/15 tệp GLV trong runner, tuy nhiên mức độ tự động hóa ở một số phần hành mới chỉ dừng lại ở Lead schedule (`x10`) và các bảng đơn lẻ:
  1. `G200_ExpenseFiller.ts`: Hai sheet phân tích chi phí quan trọng nhất là `G353` (Chi tiết CPBH 641 12 tháng x tiểu khoản) và `G453` (Chi tiết CPQLDN 642 12 tháng x tiểu khoản) mới chỉ có ở code ExcelJS cũ, chưa được port sang `fillExpenseOpenXml`.
  2. Các sheet **Thủ tục phân tích VSA 520 (`x20`)** của các phần hành (`D120`, `D320`, `D520`, `D720`, `E120`, `E220`, `E320`, `E420`, `G120`, `G220`) hiện đang để trống, trong khi hệ thống đã có sẵn các Engine phân tích tài chính siêu mạnh (`FinancialCorrelationEngine`, `ExpenseDetailAnalyzer`, `KqkdYoY`).
  3. File Master `A - B - H - Mau 2025 - Thinh.xlsx` có các sheet thuyết minh chi tiết (`thongtincty`, `A271`, `BenLienQuan`, `vay`, `Von`) cần được điền đầy đủ dữ liệu từ NKC và CDFS.
  4. Các bảng kiểm tra chi tiết, chọn mẫu và cut-off (`D190` kiểm tra số dư tiền, `D793/D794` tăng giảm TSCĐ, `E152` hợp đồng vay, `G191.chonmau`) cần được nạp số liệu thực tế.

## 2. Mục Tiêu (Outcome)
1. Port trọn vẹn `G353` & `G453` sang OpenXmlPackageEditor để điền ma trận chi phí 12 tháng x các tiểu khoản 641/642 vào file `G200 - 300 - 400`.
2. Tự động điền các sheet Thủ tục phân tích `x20` cho tất cả các phần hành (Tiền, Phải thu, Tồn kho, TSCĐ, Vay, Phải trả, Thuế, Lương, Doanh thu) với số liệu biến động, tỷ trọng và nhận xét kiểm toán.
3. Hoàn thiện các sheet thông tin doanh nghiệp (`thongtincty`), thư giải trình (`A271`), giao dịch bên liên quan (`BenLienQuan`), chi tiết vay & vốn trong file Master `A - B - H`.
4. Điền các bảng kiểm tra chi tiết còn lại (`D190`, `D793`, `D794`, `E152`).
5. Đảm bảo toàn bộ 15 files xuất ra hoàn hảo, không lỗi công thức Excel, không corrupt, 100% tests & typecheck pass.

---

## 3. Lộ Trình Phân Kỳ (Phases)

| Phase | Nhiệm vụ chính | Files tác động |
| :--- | :--- | :--- |
| **Phase 1** | Port `G353` & `G453` sang OpenXML | `src/domain/workingpaper/fillers/G200_ExpenseFiller.ts` |
| **Phase 2** | Tự động điền các sheet Phân tích VSA 520 (`x20`) | `src/domain/workingpaper/fillers/*Filler.ts`<br>`src/domain/workingpaper/helpers.ts` |
| **Phase 3** | Hoàn thiện file Master `A - B - H` (`thongtincty`, `BenLienQuan`, `vay`, `Von`) | `src/domain/workingpaper/fillers/ABH_MasterFiller.ts` |
| **Phase 4** | Hoàn thiện các bảng kiểm tra chi tiết (`D190`, `D793`, `D794`, `E152`) | `src/domain/workingpaper/fillers/D100_CashFiller.ts`<br>`src/domain/workingpaper/fillers/D700_FixedAssetFiller.ts`<br>`src/domain/workingpaper/fillers/E100_BorrowingFiller.ts` |
| **Phase 5** | Kiểm thử hồi quy 15 files, đo lường số lượng sheets và items | `tests/workingpaper.test.ts` |
