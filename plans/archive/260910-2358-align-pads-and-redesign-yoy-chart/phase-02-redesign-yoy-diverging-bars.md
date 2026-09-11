---
title: "Phase 2: Thiết Kế Lại KqkdYoYChart Theo Dạng Biểu Đồ Thanh Ngang Chênh Lệch & Tăng Trưởng YoY"
description: "Thay thế biểu đồ cột tuyệt đối bằng biểu đồ thanh ngang đối xứng qua trục 0 (Diverging Variance Bars) tập trung vào mức chênh lệch Delta và % tăng trưởng VSA 520."
status: completed
priority: P1
effort: "45m"
tags: [analytics, chart, yoy, diverging-bars, vsa520]
---

# Phase 2: Thiết Kế Lại KqkdYoYChart Theo Dạng Biểu Đồ Thanh Ngang Chênh Lệch & Tăng Trưởng YoY

## Mục Tiêu
Khắc phục triệt để lỗi thiết kế biểu đồ hiện tại (Ảnh 1): Doanh thu và Giá vốn 75 tỷ đè bẹp các chi phí 4 tỷ, các cột âm cắm sâu xuống đáy, không mang lại giá trị phân tích mới ngoài việc lặp lại số liệu của bảng bên cạnh.

## Thiết Kế Kỹ Thuật (Phương Án 1: Diverging Horizontal Variance & Growth)

### 1. Ý Tưởng & Bố Cục Biểu Đồ
Thay vì vẽ lại cột 75 tỷ, biểu đồ mới trực quan hóa **Mức Độ Biến Động ($\Delta = \text{Năm nay} - \text{Năm trước}$) và Tỷ Lệ Tăng Trưởng (%)**:
* Gồm 6 hàng ngang tương ứng 6 chỉ tiêu trọng yếu:
  1. `10`: Doanh thu thuần
  2. `11`: Giá vốn hàng bán
  3. `60`: Lợi nhuận gộp
  4. `25`: Chi phí bán hàng
  5. `26`: Chi phí QLDN
  6. `70`: Lợi nhuận thuần từ HĐKD
* Mỗi hàng gồm 3 cột thông tin:
  - **Cột Trái (Tên chỉ tiêu & % Biến động):**
    - Tên chỉ tiêu in đậm kèm mã số (ví dụ: `Doanh thu thuần (10)`).
    - Badge % tăng/giảm màu sắc:
      * Xanh lá: Biến động tích cực (Doanh thu tăng, Lợi nhuận tăng, Chi phí giảm).
      * Đỏ: Biến động tiêu cực/rủi ro (Doanh thu giảm, Lợi nhuận giảm, Chi phí tăng).
  - **Cột Giữa (Thanh ngang trực quan đối xứng qua trục 0):**
    - Trục 0 nằm chính giữa (50% chiều ngang).
    - Nếu $\Delta < 0$: thanh dạt sang trái trục 0.
    - Nếu $\Delta > 0$: thanh dạt sang phải trục 0.
    - Chiều dài thanh tỷ lệ với mức chênh lệch tuyệt đối, chuẩn hóa max để thanh co giãn đẹp mắt.
  - **Cột Phải (Số tiền Chênh lệch & Giá trị so sánh):**
    - Số tiền chênh lệch $\Delta$: In to, đậm, màu xanh/đỏ tương ứng (ví dụ: `-4.15 tỷ`, `+4.08 tỷ`, `+245 tr`).
    - Dòng phụ nhỏ: `Năm nay: 73.7 tỷ · Năm trước: 77.8 tỷ`.

### 2. Legend & Thông Tin Phân Tích Kiểm Toán
* Phía trên có Legend giải thích rõ ràng:
  - 🟢 **Xanh lá:** Tác động tích cực tới lợi nhuận (Tăng doanh thu / Giảm chi phí).
  - 🔴 **Đỏ:** Tác động tiêu cực tới lợi nhuận (Giảm doanh thu / Tăng chi phí / Lỗ).
* Tooltip hover: Khi di chuột vào từng hàng, hiển thị popup giải thích nhận định kiểm toán VSA 520 nhanh cho chỉ tiêu đó.

## Files Thay Đổi
- `src/renderer/components/Analytics/charts/KqkdYoYChart.tsx`: Viết lại toàn diện phần render trực quan.

## Tiêu Chí Nghiệm Thu
- [ ] 6 chỉ tiêu hiển thị rõ ràng, không còn hiện tượng 75 tỷ đè bẹp 4 tỷ.
- [ ] Mức chênh lệch $\Delta$ và % tăng trưởng nổi bật, nhận diện ngay rủi ro kiểm toán.
- [ ] Giao diện hiện đại, sạch sẽ, chuyên nghiệp chuẩn Enterprise SaaS.
