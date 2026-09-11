---
title: "Phase 1: Xây Dựng AuditRiskAlertPanel Quét Tự Động 4 Cờ Đỏ Rủi Ro"
description: "Phát triển component AuditRiskAlertPanel đặt dưới KPI Cards, quét tự động các vi phạm VSA 520 (Kinh doanh dưới giá vốn), NĐ 132/2020 (Lãi vay vượt trần), VSA 570 (Hoạt động liên tục) và VSA 550 (Giao dịch liên kết)."
status: completed
priority: P1
effort: "40m"
tags: [analytics, audit-risk, red-flags, vsa520, nd132, vsa570, vsa550]
---

# Phase 1: Xây Dựng AuditRiskAlertPanel Quét Tự Động 4 Cờ Đỏ Rủi Ro

## Mục Tiêu
Thay vì để KTV phải đọc từng bảng số liệu, `AuditRiskAlertPanel` đóng vai trò là "Trung tâm cảnh báo sớm rủi ro kiểm toán", tổng hợp và làm nổi bật các cờ đỏ (Red Flags) quan trọng nhất của doanh nghiệp.

## Thiết Kế Kỹ Thuật

### 1. Thuật Toán Nhận Diện Cờ Đỏ Tự Động
Component phân tích dữ liệu từ `GlAnalyticsResult`:
1. **Cờ Đỏ 1: Kinh doanh dưới giá vốn (VSA 520 & VSA 240)**
   - Điều kiện: `correlations.grossMargin.annualGrossMarginPct < 0` HOẶC có tháng biên lãi gộp âm cực đoan (`p.grossMarginPct < 0`).
   - Mức độ: 🔴 **NGHIÊM TRỌNG (HIGH RISK)**.
   - Nội dung cảnh báo: Doanh thu thuần nhỏ hơn Giá vốn hàng bán (Lỗ gộp). Rủi ro hạch toán thiếu doanh thu, dồn khống chi phí giá vốn cuối năm hoặc bán phá giá.
2. **Cờ Đỏ 2: Khống chế lãi vay thuế TNDN (Nghị định 132/2020/NĐ-CP)**
   - Điều kiện: `ebitda.isOverCap === true` HOẶC `ebitdaNum <= 0`.
   - Mức độ: 🔴 **NGHIÊM TRỌNG (TAX RISK)**.
   - Nội dung cảnh báo: EBITDA kỳ này âm hoặc không đủ bù lãi vay. Toàn bộ {disallowedNum} đ lãi vay thuần bị loại khi quyết toán thuế TNDN (Điều chỉnh tăng Chỉ tiêu B4).
3. **Cờ Đỏ 3: Nguy cơ vi phạm giả định Hoạt động liên tục (VSA 570)**
   - Điều kiện: `opProfitNum < 0` (Lỗ thuần HĐKD) VÀ chi phí tài chính (`fExpNum`) lớn.
   - Mức độ: 🔴 **CẢNH BÁO CAO (GOING CONCERN)**.
   - Nội dung cảnh báo: Lợi nhuận thuần từ HĐKD âm sâu, gánh nặng chi phí lãi vay bào mòn dòng tiền hoạt động. Cần thực hiện thủ tục đánh giá khả năng thanh toán nợ trong 12 tháng tới.
4. **Cờ Đỏ 4: Giao dịch nội bộ / Bên liên quan đáng ngờ (VSA 550)**
   - Điều kiện: `relatedParties.length > 0`.
   - Mức độ: 🟡 **CHÚ Ý (RELATED PARTY RISK)**.
   - Nội dung cảnh báo: Phát hiện {N} nghiệp vụ vay/mượn tiền không phát sinh lãi suất qua TK 1388/3388/128. Cần kiểm tra nghĩa vụ kê khai Phụ lục Giao dịch liên kết.

### 2. Giao Diện Người Dùng (UI/UX)
- Đặt ngay bên dưới 5 KPI Cards, trên hàng KQKD B02.
- Gồm:
  - Header: Huy hiệu cảnh báo (`🚨 PHÁT HIỆN {N} RỦI RO KIỂM TOÁN TRỌNG YẾU (VSA 520 / NĐ 132)`), nút Thu gọn / Mở rộng.
  - Thân: Danh sách các thẻ cờ đỏ (Red Flag Cards) có viền đỏ/cam, icon cảnh báo, nội dung phân tích súc tích và đề xuất hành động cho KTV.

## Files Tạo Mới / Thay Đổi
- Tạo mới: `src/renderer/components/Analytics/AuditRiskAlertPanel.tsx`
- Cập nhật: `src/renderer/components/Analytics/GlAnalyticsTab.tsx`

## Tiêu Chí Nghiệm Thu
- [ ] Tự động quét và hiển thị đúng 4 cờ đỏ trên tập dữ liệu kiểm toán mẫu `MAU NKC.xlsx`.
- [ ] Giao diện co giãn đẹp mắt, có nút đóng/mở tiện lợi cho KTV.
