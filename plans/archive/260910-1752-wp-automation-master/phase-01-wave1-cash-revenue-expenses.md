# Phase 01: Chuẩn Hóa & Tự Động Hóa Đợt 1 (D100 - Tiền, G100 - Doanh Thu, G200 - Giá Vốn & Chi Phí)

> **Mục tiêu:** Tự động hóa các phần hành chiếm 70% khối lượng kiểm toán hàng ngày của KTV. Tận dụng tối đa dữ liệu từ NKC và CDFS.

---

## 1. PLAN-01: GLV D100 - Tiền & Các Khoản Tương Đương Tiền (`D100 - Tien - Mau 2024 - Thinh.xlsx`)

### A. Hiện trạng
- Đã có điền số dư tổng hợp `D 110` (TK 1111, 1112, 1121, 1122, 1281).
- Các sheet kiểm tra chi tiết còn để trống toàn bộ.

### B. Giải pháp tự động hóa mới
1. **Sheet `D 190` - Kiểm tra nghiệp vụ bất thường về tiền**:
   - Quét sổ NKC lấy toàn bộ giao dịch tiền mặt (TK 111) có giá trị $\ge 20.000.000\text{ đ}$ (nguy cơ vi phạm quy định thanh toán không dùng tiền mặt theo Luật Thuế TNDN).
   - Lọc các bút toán phát sinh vào ngày Thứ Bảy / Chủ Nhật hoặc ngày lễ.
   - Điền trực tiếp vào bảng kê `D 190` từ dòng 11: Ngày, Số CT, Diễn giải, TK Đối ứng, Số tiền.
2. **Sheet `D 191.2` - Mẫu kiểm tra chi tiết Tiền gửi ngân hàng (TGNH)**:
   - Tự động bốc 15-20 bút toán chi tiền lớn nhất từ TK 1121 sang 331, 141, 642...
   - Điền ngày, số séc/UNC, người nhận, số tiền, mục đích thanh toán.
3. **Sheet `D 195TM` & `D 195TGNH` - Kiểm tra Cut-off (Khóa sổ) Tiền**:
   - Trích xuất tự động:
     - 5 chứng từ tiền cuối cùng phát sinh trước ngày 31/12.
     - 5 chứng từ tiền đầu tiên phát sinh sau ngày 01/01 năm sau.
   - Điền vào bảng cut-off, đánh dấu kiểm tra tính đúng kỳ niên độ kiểm toán.

---

## 2. PLAN-02: GLV G100 - Doanh Thu Bán Hàng & CCDV (`G100 - Doanh thu - Mau 2025- Thinh.xlsx`)

### A. Hiện trạng
- Đã có điền `G 110` tổng hợp số dư TK 5111, 5112, 5113, 521.

### B. Giải pháp tự động hóa mới
1. **Sheet `G 152` - Bảng đối chiếu Doanh thu 12 tháng**:
   - Điền tự động số phát sinh Có TK 511 của từng tháng từ T1 đến T12 (lấy trực tiếp từ kết quả `Trend12MAnalyzer`).
   - Tự động đối chiếu với số thuế GTGT đầu ra (TK 33311) tương ứng của tháng đó.
2. **Sheet `G 191.1` - Bảng kiểm tra chọn mẫu Doanh thu (VSA 530)**:
   - Lấy danh sách mẫu doanh thu từ `SamplingEngine` (chọn mẫu theo KCM và bốc ngẫu nhiên hệ thống).
   - Đổ danh sách hóa đơn, khách hàng, doanh thu chưa thuế, thuế GTGT vào bảng kiểm tra.
3. **Sheet `G 195` - Kiểm tra Cut-off Doanh thu**:
   - Lấy 10 hóa đơn bán hàng xuất trước ngày 31/12 và 10 hóa đơn xuất sau ngày 31/12.
   - Đối chiếu ngày lập hóa đơn, ngày ghi sổ và ngày biên bản bàn giao/phiếu xuất kho.

---

## 3. PLAN-03: GLV G200 - Giá Vốn & Chi Phí 641/642 (`G200 - 300 - 400 -  Mau 2025 - Thinh.xlsx`)

### A. Hiện trạng
- Đã có `G353` và `G453` điền tỷ trọng chi phí bán hàng và QLDN theo tháng.

### B. Giải pháp tự động hóa mới
1. **Sheet `G210`, `G310`, `G410` - Bảng tổng hợp số liệu Giá vốn, CP Bán hàng, CP Quản lý**:
   - Đổ số dư đầu năm, phát sinh Nợ/Có trong năm từ CDFS cho toàn bộ tài khoản cấp 2:
     - 6321, 6322...
     - 6411, 6412, 6413, 6414, 6417, 6418...
     - 6421, 6422, 6423, 6424, 6425, 6426, 6427, 6428...
2. **Sheet `G291.1`, `G390`, `G490` - Mẫu kiểm tra chi tiết Giá vốn và Chi phí**:
   - Bốc mẫu các chứng từ xuất kho giá vốn lớn nhất.
   - Bốc mẫu chi phí dịch vụ mua ngoài (TK đối ứng 111, 112, 331) có giá trị trên ngưỡng kiểm tra chi tiết.
3. **Sheet `G395`, `G495` - Kiểm tra Cut-off Chi phí**:
   - Quét các khoản chi phí hóa đơn phát sinh trong tháng 12 và tháng 1 năm sau để phát hiện rủi ro ghi nhận chi phí dồn kỳ hoặc trích trước chi phí không có căn cứ.

---

## 4. Kế Hoạch Kiểm Thử & Nghiệm Thu Phase 01
- Viết test `tests/wp-wave1-automation.test.ts`.
- Chạy thử nghiệm trên file `MAU NKC.xlsx`.
- Kiểm tra các sheet `D 190, D 195TM, G 152, G 191.1, G210, G310, G410` đã có dữ liệu thực tế.
