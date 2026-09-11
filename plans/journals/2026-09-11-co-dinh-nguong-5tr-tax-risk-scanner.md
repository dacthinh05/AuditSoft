---
date: 2026-09-11
title: Cố định mặc định ngưỡng 5 triệu và loại bỏ thanh chuyển đổi ngưỡng chi tiền mặt
tags: [ui, tax-risk, clean-up]
---

# Tinh gọn phân hệ Rà soát Rủi Ro Thuế & B4

## Thay đổi thực hiện
- File: `src/renderer/components/TaxRisk/TaxRiskScannerPage.tsx`
- Loại bỏ thanh chuyển đổi ngưỡng chi tiền mặt (vùng nút chọn "5 triệu", "20 triệu", "Tùy chỉnh").
- Cố định mặc định engine `CashTaxRiskScanner.scan(entries, { mode: '5M' })` theo quy định mới nhất của Nghị định 181/2025/NĐ-CP và Luật Thuế GTGT 2024.
- Giao diện trực diện, tự động quét ngay theo mốc 5 triệu mà không làm rối mắt người dùng bởi thanh cấu hình thừa.

## Kết quả kiểm thử
- `npm run typecheck`: Passed 100% sạch (0 lỗi).
