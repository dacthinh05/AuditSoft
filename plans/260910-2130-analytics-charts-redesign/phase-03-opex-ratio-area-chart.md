# Phase 3: Tối Ưu OpexRatioAreaChart (Tỷ Lệ Chi Phí Hoạt Động OPEX)

## Mục tiêu
Loại bỏ cảm giác lơ lửng, mờ ảo của dải Area Chart, làm rõ ranh giới giữa Chi phí bán hàng (641) và Chi phí QLDN (642), bổ sung đường ngưỡng Benchmark kiểm toán.

## Nhiệm vụ cụ thể
1. **Chuyển đổi kiểu hiển thị nét (Crisp Multi-Line / Segmented Area):**
   - Giảm độ mờ gradient của vùng diện tích, tăng độ dày viền của đường Tổng OPEX (`strokeWidth: 2.5`) và CP Bán hàng.
   - Hiển thị rõ các data points (nốt chấm) tại từng tháng trên đường biểu diễn để người xem dễ định vị giá trị.
2. **Thêm đường Benchmark / Trung bình năm:**
   - Vẽ một đường nét đứt ngang biểu thị mức OPEX trung bình năm (`annualOpexRatioPct`) với nhãn "TB năm: X%".
3. **Phát hiện & Cảnh báo tháng vượt ngưỡng:**
   - Tháng có OPEX tăng vọt bất thường (cao hơn trung bình hoặc > 20%) sẽ có chấm cảnh báo màu cam/đỏ.
4. **Cải tiến trục Y & Lưới tọa độ:**
   - Tăng độ tương phản cho nhãn trục Y, định dạng rõ % (`0%`, `5%`, `10%`, `15%`, `20%`, `25%`).

## File liên quan
- `src/renderer/components/Analytics/charts/OpexRatioAreaChart.tsx`
