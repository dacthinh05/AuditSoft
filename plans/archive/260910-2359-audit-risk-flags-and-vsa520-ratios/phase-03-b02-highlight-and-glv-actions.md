---
title: "Phase 3: Highlight Dòng Lỗ & Đột Biến Trong Bảng B02 và Gợi Ý Thủ Tục GLV"
description: "Tô màu cảnh báo mềm (soft alert) cho các dòng lợi nhuận âm và biến động đột biến >50% trên bảng B02; bổ sung khối gợi ý thủ tục Giấy làm việc tương ứng cho KTV."
status: completed
priority: P1
effort: "30m"
tags: [analytics, b02, highlight, action-steps, working-papers]
---

# Phase 3: Highlight Dòng Lỗ & Đột Biến Trong Bảng B02 và Gợi Ý Thủ Tục GLV

## Mục Tiêu
1. Trên Bảng Kết Quả Kinh Doanh B02, các dòng chỉ tiêu lỗ (Mã 60, Mã 70) hoặc biến động đột biến (Mã 40, Mã 26) cần được làm nổi bật để KTV lập tức nhận biết điểm bất thường.
2. Cung cấp "Hành động khuyến nghị cho KTV" (Actionable Next Steps): liên kết thẳng tới các mẫu Giấy làm việc cần thực hiện tương ứng với các rủi ro được phát hiện.

## Thiết Kế Kỹ Thuật

### 1. Highlight Thông Minh Trên Bảng B02
Trong `GlAnalyticsTab.tsx` khi render hàng của `data.kqkdYoY.rows`:
- Nếu `r.current < 0` tại các chỉ tiêu lợi nhuận (Mã 60 - LN gộp, Mã 70 - LN HĐKD):
  - Áp dụng màu nền cảnh báo mềm: `background: '#fff1f2'`.
  - Con số tiền in màu đỏ đậm: `color: '#b91c1c'`.
  - Gắn badge nhỏ: `LỖ GỘP` hoặc `LỖ HĐKD`.
- Nếu tỷ lệ biến động `Math.abs(r.pct ?? 0) >= 50%` hoặc khoản mục mới phát sinh:
  - Gắn chấm tròn cảnh báo màu cam kèm tooltip: *"Biến động lớn ({pct}%) — cần bốc mẫu kiểm tra chi tiết chứng từ (VSA 520)."*

### 2. Gợi Ý Thủ Tục Giấy Làm Việc Tương Ứng (Actionable Next Steps)
Ngay dưới khối Cờ đỏ hoặc chân Bảng B02, thêm danh sách các hành động KTV cần làm:
- Nếu có Lãi vay vượt trần $\rightarrow$ Nút: *"Mở GLV E382 (Bóc tách trần lãi vay NĐ 132/2020)"*.
- Nếu có Dồn giá vốn cuối năm $\rightarrow$ Nút: *"Mở GLV D595 (Kiểm tra Cut-off xuất kho cuối năm)"*.
- Nếu có Nghi ngờ bên liên quan $\rightarrow$ Nút: *"Mở GLV D352 / E252 (Gửi thư xác nhận nợ)"*.
- Nếu có Chi phí bán hàng / QLDN biến động $\rightarrow$ Nút: *"Mở GLV G353 / G453 (Phân tích chi phí 12 tháng x TK 4 số)"*.

## Files Thay Đổi
- `src/renderer/components/Analytics/GlAnalyticsTab.tsx`

## Tiêu Chí Nghiệm Thu
- [ ] Bảng B02 tự động làm nổi bật các dòng lỗ và biến động đột biến rõ nét.
- [ ] KTV có thể bấm nút gợi ý để điều hướng trực tiếp sang phân hệ sinh GLV.
