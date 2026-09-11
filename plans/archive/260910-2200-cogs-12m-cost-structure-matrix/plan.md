---
title: "Xây dựng Ma Trận Chi Phí Cấu Thành Giá Vốn 12 Tháng (COGS & Cost Structure Matrix)"
date: "2026-09-10"
status: "completed"
mode: "standard"
tags:
  - analytics
  - cogs
  - cost-structure
  - 12m-matrix
  - vsa520
---

# Kế Hoạch Triển Khai: Ma Trận Chi Phí Cấu Thành Giá Vốn 12 Tháng

## 1. Bối cảnh & Mục tiêu (Outcome)
Trong các doanh nghiệp sản xuất, xây lắp và thương mại, chi phí giá vốn (TK 632) chiếm tỷ trọng lớn nhất (thường từ 60% - 85% doanh thu). Tuy nhiên, hiện tại hệ thống mới chỉ có biểu đồ cột chồng 100% ước lệ và một cột đơn lẻ `Giá vốn hàng bán (Nợ 632)` trên Ma trận tổng thể, khiến kiểm toán viên **hoàn toàn không thấy được các yếu tố chi phí cấu thành nên giá vốn theo từng tháng**:
- Bao nhiêu là Chi phí Nguyên vật liệu trực tiếp (TK 621)?
- Bao nhiêu là Chi phí Nhân công trực tiếp (TK 622)?
- Bao nhiêu là Chi phí Sản xuất chung (TK 627)?
- Chi phí SXKD dở dang luân chuyển qua TK 154 thế nào?
- Hàng hóa (156) và Thành phẩm (155) xuất bán sang 632 ra sao?
- Có hiện tượng **"treo chi phí dở dang trên 154"** các tháng đầu năm rồi **"dồn kết chuyển giá vốn đột biến vào Tháng 12"** để bóp méo lợi nhuận hay không?

Mục tiêu là xây dựng **Bảng Ma Trận Chi Phí Cấu Thành Giá Vốn 12 Tháng (COGS & Cost Structure Matrix)**:
1. Bóc tách chi tiết 12 tháng theo các yếu tố: 621, 622, 627, 154, xuất kho 155 $\rightarrow$ 632, xuất kho 156 $\rightarrow$ 632, Tổng chi phí sản xuất trong kỳ, Giá vốn hạch toán 632, và Chênh lệch tồn kho dở dang.
2. Tự động gắn cờ cảnh báo kiểm toán (Audit Flag) cho các tháng có rủi ro Cutoff / dồn giá vốn cuối năm / chi phí phát sinh nhưng không ghi nhận giá vốn.
3. Hỗ trợ nút chuyển đổi thông minh: `[Ẩn cột không phát sinh]` (tự động tối ưu cho DN thương mại thuần túy) và `[Xem Tỷ Trọng % / Số Tiền VNĐ]`.
4. Xuất khẩu hoặc sao chép dễ dàng để KTV đưa vào Giấy làm việc F-series hoặc D500.

---

## 2. Ràng buộc & Giới hạn (Constraints & Non-goals)

### Constraints:
- Dữ liệu tính toán từ Sổ Nhật ký chung (Journal Entries) và hạch toán Nợ/Có đối ứng chuẩn theo Thông tư 200 / VAS.
- Đảm bảo độ chính xác số học: Dùng Money type an toàn trong domain layer, không làm tròn sai số.
- Tương thích giao diện: Đặt ngay bên dưới hoặc cùng nhóm với Biểu đồ Cấu trúc giá vốn, có thanh cuộn ngang độc lập khi màn hình hẹp, cố định cột Tháng bên trái.

### Non-goals:
- Không tính lại định mức kỹ thuật sản xuất của doanh nghiệp (đây là trách nhiệm của kế toán chi phí).

---

## 3. Tiêu chí nghiệm thu (Acceptance Criteria)
1. Bảng ma trận hiển thị đầy đủ 12 tháng + dòng TỔNG CẢ NĂM.
2. Bóc tách chuẩn xác các cột tài khoản: NVL 621, Nhân công 622, SXC 627, Dở dang 154, Hàng hóa 156 $\rightarrow$ 632, Thành phẩm 155 $\rightarrow$ 632, Tổng giá vốn 632.
3. Nút toggle `[Ẩn cột không phát sinh]` hoạt động mượt mà, giấu các cột toàn số 0/trống.
4. Cột Cảnh báo kiểm toán tự động phát hiện tháng dồn giá vốn cuối năm (như Tháng 12 vọt lên 75 tỷ trong khi các tháng trước bằng 0).
5. 100% test suite, typecheck, linting và build production đều pass.

---

## 4. Các giai đoạn thực hiện (Phased Execution)

* **Phase 1: Domain Engine & Data Structures (`types.ts` & `FinancialCorrelationEngine.ts`)**
  - Mở rộng types: `CogsDetailedMonthRow`, `CogsDetailedMatrixReport`.
  - Triển khai hàm `computeCogsDetailedMatrix(entries: JournalEntry[]): CogsDetailedMatrixReport` bóc tách từng luồng tài khoản 621, 622, 627, 154, 155 $\rightarrow$ 632, 156 $\rightarrow$ 632.
  - Tính toán độ lệch CPSX vs Giá vốn và phát hiện tháng bất thường.

* **Phase 2: Xây dựng UI Component `CogsMatrix12MTable.tsx` & Styling**
  - Xây dựng component React hiển thị bảng ma trận chi tiết.
  - Tích hợp tính năng toggle: Ẩn cột không phát sinh, Đổi chế độ xem Tiền / Tỷ trọng %.
  - CSS styling bảng: Cố định cột tháng, highlight tháng đột biến, định dạng tiền tệ chuyên nghiệp.

* **Phase 3: Tích hợp vào `GlAnalyticsTab.tsx` & Kiểm Thử Toàn Diện**
  - Nhúng bảng vào `GlAnalyticsTab.tsx` ngay cạnh Biểu đồ Cấu trúc giá vốn.
  - Viết test suite trong `tests/cogs-detailed-matrix.test.ts`.
  - Chạy toàn bộ chu trình `typecheck`, `lint`, `test`, `build`.
