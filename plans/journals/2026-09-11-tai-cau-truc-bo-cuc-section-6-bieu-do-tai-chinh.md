# Nhật Ký Kỹ Thuật: Tái Cấu Trúc Bố Cục & Kích Thước Cụm Đồ Thị Tài Chính 12 Tháng (Section 6)

- **Ngày thực hiện:** 2026-09-11
- **Phân hệ:** Giao diện Phân Tích Sổ Cái & NKC (Preliminary Analytics — VSA 520)
- **Tác vụ:** Giải quyết triệt để vấn đề 3 Pad tài chính bị lệch chiều cao, hẹp ngang và vỡ giao diện

---

### 1. Bối cảnh & Vấn đề thực tế
Trước đây, 3 biểu đồ tài chính 12 tháng tại Section 6 được xếp vào 1 hàng ngang duy nhất (`gridTemplateColumns: repeat(auto-fit, minmax(360px, 1fr))`):
1. **Pad 1 (Doanh thu - Giá vốn - Biên gộp):** Bị kéo dài xuống dưới do có khối alert xanh về chuẩn kỳ dồn giá vốn 31/12.
2. **Pad 2 (Cơ cấu chi phí sản xuất) & Pad 3 (OPEX):** Bị hụt đáy, tạo ra khoảng trắng lớn không đồng đều.
3. **Chiều ngang bị bóp hẹp:** Chia 3 cột khiến mỗi đồ thị chỉ còn ~400px, 12 tháng với cột kép mỏng và nhãn T1..T12 bị dồn ứ.

---

### 2. Giải pháp kỹ thuật đã triển khai (Mô hình 2 Hàng 2+1 Chuẩn Enterprise SaaS)

#### A. Tái cấu trúc Layout tại `GlAnalyticsTab.tsx`:
- **Hàng 1 (Tỷ lệ 50% / 50%):** Gom `RevenueCogsComboChart` và `CogsStructureStackedChart` vào lưới 2 cột (`gridTemplateColumns: repeat(auto-fit, minmax(480px, 1fr))`).
  - Bề ngang mỗi card tăng lên ~700px, 12 tháng hiển thị cực kỳ rộng rãi (~55px/tháng).
  - Cả 2 card thiết lập `height: 100%`, `display: flex; flex-direction: column` đảm bảo chiều cao bằng chằn chặn.
- **Hàng 2 (Full-Width 100%):** Đặt `OpexRatioAreaChart` trải dài toàn màn hình, tạo sự liền mạch với bảng ma trận chi phí bên dưới.

#### B. Tinh gọn Header & Chuẩn hóa Callout tại `RevenueCogsComboChart.tsx`:
- Header thu gọn thành hàng linh hoạt, không còn bị rớt dòng thành 3 tầng.
- Khối thông báo dồn 31/12 dày cộp ở đáy được tinh giản thành **thanh micro-alert 1 dòng** tinh tế có icon kiểm toán.
- `CogsStructureStackedChart.tsx` được bổ sung thanh micro-info tương ứng ở chân card, giúp 2 pad có chiều cao pixel-perfect.

#### C. Nâng cấp `OpexRatioAreaChart.tsx` Full-Width với Cột Thẻ KPI 641/642:
- Tận dụng bề ngang 100%, chia card thành 2 phần:
  - **72% bên trái:** Đồ thị diện tích 12 tháng mượt mà cho CP Bán hàng và CP Quản lý.
  - **28% bên phải:** Cột 3 Thẻ KPI tóm tắt cả năm (CP Bán hàng 641, CP Quản lý 642, Tổng OPEX / DT kèm đánh giá hiệu năng).

---

### 3. Kết quả nghiệm thu
- `npm run typecheck`: 0 errors.
- `npm test`: 85/85 test files, 385/385 tests pass 100%.
- Giao diện trực quan, cân đối, thoáng đãng, đáp ứng chuẩn Enterprise SaaS.
