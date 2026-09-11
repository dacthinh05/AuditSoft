# Kế Hoạch Tái Cấu Trúc Bố Cục & Kích Thước Bộ 3 Đồ Thị Tài Chính 12 Tháng (Section 6)

## 1. Bối Cảnh & Vấn Đề Hiện Tại
Trong màn hình **Phân Tích Sổ Cái & NKC (VSA 520)**, cụm 3 biểu đồ tài chính 12 tháng tại Section 6:
1. **Pad 1:** Tương quan Doanh thu — Giá vốn & Biên lãi gộp (`RevenueCogsComboChart`)
2. **Pad 2:** Bóc tách Cấu trúc Chi phí Giá vốn & Sản xuất (`CogsStructureStackedChart`)
3. **Pad 3:** Tỷ lệ Chi phí Hoạt động / Doanh thu (`OpexRatioAreaChart`)

Đang gặp **3 nhược điểm lớn về kích thước và bố cục trực quan** (phản ánh từ người dùng):
- **Lệch chiều cao nghiêm trọng:** Pad 1 bị kéo dài do có thêm khối thông báo kết chuyển dồn 31/12 ở chân biểu đồ, trong khi Pad 2 và Pad 3 không có, tạo ra khoảng hẫng đáy khó coi.
- **Bề ngang bị bóp nghẹt:** Ép cả 3 biểu đồ vào 1 hàng ngang (3 cột) trên màn hình làm mỗi card chỉ còn ~400px. Dữ liệu 12 tháng với 2 cột bar kép và nhãn T1..T12 bị chen chúc, cột bar mỏng dính.
- **Thanh công cụ Pad 1 bị rớt dòng thành 3 tầng:** Nút chọn chuẩn kỳ/sổ sách và 3 nút bật tắt chuỗi dữ liệu bị gãy làm 3 hàng, chiếm dụng diện tích hiển thị của đồ thị.

## 2. Giải Pháp Kiến Trúc & Thiết Kế (Bố Cục 2 + 1 Chuẩn SaaS)
Chuyển đổi toàn bộ cụm Section 6 sang mô hình **2 Hàng (Top 2 Columns + Bottom Full-Width)**:

```
┌───────────────────────────────────────────────────┬───────────────────────────────────────────────────┐
│ HÀNG 1 - CỘT 1 (50%): REVENUE & COGS COMBO        │ HÀNG 1 - CỘT 2 (50%): COGS STRUCTURE STACKED      │
│ - Bề ngang rộng rãi (~700px), cột bar thanh thoát │ - Đồng bộ chiều cao pixel-perfect với Cột 1       │
│ - Header 1 hàng gọn gàng, nút toggle tinh tế      │ - Hiển thị chi tiết tỷ trọng 621/622/627/154/156  │
│ - Alert chuẩn kỳ thu gọn thành micro-badge 1 dòng │ - Bảng màu và khoảng cách thoáng đãng             │
└───────────────────────────────────────────────────┴───────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ HÀNG 2 - FULL WIDTH: TỶ LỆ CHI PHÍ HOẠT ĐỘNG OPEX TRÊN DOANH THU (OPEX EFFICIENCY 12 THÁNG)           │
│ ┌─────────────────────────────────────────────────────────────┬─────────────────────────────────────┐ │
│ │ Biểu đồ diện tích Area Chart trải dài 12 tháng (72% width)  │ Thẻ KPI Tóm Tắt Chi Phí (28% width) │ │
│ │ - Đường cong Bézier CP Bán hàng (641) & CP Quản lý (642)    │ - CP Bán hàng: % TB & Tổng tiền     │ │
│ │ - Thang đo tỷ lệ % thoáng đãng, dễ soi xét điểm đột biến    │ - CP Quản lý: % TB & Tổng tiền      │ │
│ │                                                             │ - Tổng OPEX/DT & Đánh giá hiệu năng │ │
│ └─────────────────────────────────────────────────────────────┴─────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 3. Lộ Trình Triển Khai (Phased Roadmap)

| Phase | Mục tiêu | File chính |
| :--- | :--- | :--- |
| **Phase 1** | Tái cấu trúc grid Section 6 thành 2 Hàng (2 Cột 50/50 + 1 Hàng Full-Width) | `src/renderer/components/Analytics/GlAnalyticsTab.tsx` |
| **Phase 2** | Tinh gọn Header & Chuẩn hóa Callout thành Micro-Badge cho `RevenueCogsComboChart` | `src/renderer/components/Analytics/charts/RevenueCogsComboChart.tsx` |
| **Phase 3** | Tối ưu hóa `OpexRatioAreaChart` Full-Width tích hợp Thẻ KPI Tóm Tắt Chi Phí 641/642 | `src/renderer/components/Analytics/charts/OpexRatioAreaChart.tsx` |
| **Phase 4** | Kiểm thử giao diện, đồng bộ chiều cao pixel-perfect và chạy typecheck/test suite | `tests/`, Toàn bộ UI |

## 4. Tiêu Chí Nghiệm Thu
- [ ] Section 6 không còn bị ép 3 cột hẹp; Pad 1 và Pad 2 chia đều 50% bề ngang, cột bar hiển thị thoáng đãng.
- [ ] Chiều cao của Pad 1 và Pad 2 bằng nhau tuyệt đối (Equal Height), không còn khoảng hẫng đáy.
- [ ] Header của Pad 1 tinh gọn, không bị vỡ thành 3 tầng; khối thông báo dồn 31/12 chuyển thành micro-badge gọn gàng 1 dòng.
- [ ] Pad 3 trải dài full-width với tỷ lệ đồ thị Area Chart 70% + Thẻ KPI 30% đẹp mắt chuẩn Enterprise.
- [ ] 100% Typecheck vượt qua (0 lỗi) và toàn bộ unit test PASS.
