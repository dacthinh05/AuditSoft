---
title: "Sửa Toàn Diện Sheet G100: Doanh Thu, Đối Chiếu Thuế G 150, Mapping Cột G 191.1 & Cutoff G 195"
description: "Khắc phục triệt để các vấn đề dữ liệu bị trống và nhảy sai cột trên working paper G100 Doanh thu"
---

# Kế Hoạch Sửa Toàn Diện Sheet G100 (Doanh Thu)

## 1. Mục tiêu (Outcome)
- Dữ liệu doanh thu trên `G 110` được nhận diện và tính toán đầy đủ cho mọi cấu trúc tài khoản (511, 5111, 51111, 5112, 5113...).
- Sheet `G 150` được điền đầy đủ 12 tháng cả 2 khối Kê khai thuế (0%, 5%, 10%) và Sổ kế toán (Có 511, Nợ 521, Có 711, Có 3387).
- Sheet `G 191.1` mapping đúng chuẩn các cột: D = TK Nợ, E = TK Có, F = Số tiền VND.
- Sheet `G 195` bắt đầu từ dòng 14, không đè tiêu đề, ngày chuẩn `DD/MM/YYYY`, số tiền định dạng kế toán `#,##0` (1.000).
- Sheet `G 194` gán tổng doanh thu vào D34 để tính tỷ lệ chuẩn xác.

## 2. Các Files Thay Đổi
- `src/domain/workingpaper/helpers.ts`
- `src/domain/workingpaper/openxml/OpenXmlPackageEditor.ts`
- `src/domain/workingpaper/fillers/G100_RevenueFiller.ts`
- `tests/g100-revenue-filler.test.ts`
