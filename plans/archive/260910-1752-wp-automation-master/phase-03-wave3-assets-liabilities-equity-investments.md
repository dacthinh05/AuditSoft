# Phase 03: Chuẩn Hóa & Tự Động Hóa Đợt 3 (D700 - TSCĐ, D600 - Chi Phí Trả Trước, E100 - Vay, E400 - Lương, F100 - Vốn, D200 - Đầu Tư)

> **Mục tiêu:** Tự động hóa các phần hành tài sản dài hạn, nợ tài chính, vốn chủ sở hữu và quỹ lương nhân viên.

---

## 1. PLAN-08: GLV D700 - Tài Sản Cố Định & XDCB (`D700 - Tai san - Mau 2024 - Thinh.xlsx`)

### A. Hiện trạng
- Đã có `D 710` tổng hợp số dư TK 211, 213, 214, 241.

### B. Giải pháp tự động hóa mới
1. **Sheet `D 790` - Kiểm tra biến động tăng giảm TSCĐ trong năm**:
   - Quét sổ NKC lấy toàn bộ các nghiệp vụ mua mới/đầu tư nâng cấp TSCĐ (Nợ 211/Có 112, 331, 241) $\rightarrow$ Đổ vào bảng tăng TSCĐ.
   - Quét các nghiệp vụ thanh lý, nhượng bán TSCĐ (Nợ 214, Nợ 811/Có 211) $\rightarrow$ Đổ vào bảng giảm TSCĐ.
2. **Sheet `D 792` - Ước tính độc lập chi phí khấu hao cả năm (VSA 520 / 540)**:
   - Dựa trên nguyên giá bình quân đầu năm và tỷ lệ trích khấu hao chuẩn mực (theo Thông tư 45/2013/TT-BTC), tính toán mức khấu hao độc lập hợp lý.
   - Đối chiếu mức khấu hao tính toán với số khấu hao kế toán đã trích trên TK 214/642 để phát hiện chênh lệch trích thiếu/thừa.

---

## 2. PLAN-09: GLV D600 - Chi Phí Trả Trước Ngắn & Dài Hạn (`D600 - Phan bo - Mau 2024 - Thinh.xlsx`)

### A. Hiện trạng
- Đã có `D 610` tổng hợp số dư TK 242.

### B. Giải pháp tự động hóa mới
1. **Sheet `D 690` - Bảng kê phát sinh tăng Chi phí trả trước (TK 242)**:
   - Trích xuất toàn bộ các khoản phát sinh Nợ 242 trong năm (tiền thuê đất, thuê văn phòng, sửa chữa lớn, bảo hiểm...).
2. **Sheet `D 693` - Bảng kiểm tra phân bổ chi phí hàng tháng**:
   - Tự động điền số tiền phân bổ 12 tháng từ Có 242 sang 627, 641, 642.
   - Phát hiện các tháng kế toán quên phân bổ hoặc phân bổ nhảy vọt bất thường.

---

## 3. PLAN-10: GLV E100 - Vay & Nợ Thuê Tài Chính (`E100 - Vay - Mau 2024 - Thinh.xlsx`)

### A. Hiện trạng
- Đã có `E 110` tổng hợp số dư TK 3411, 3412.

### B. Giải pháp tự động hóa mới
1. **Sheet `E 190` - Kiểm tra chi tiết phát sinh Vay và Trả nợ gốc**:
   - Quét toàn bộ dòng tiền giải ngân (Nợ 112/Có 3411) và dòng tiền trả nợ gốc (Nợ 3411/Có 112).
2. **Sheet `E 191` - Ước tính độc lập chi phí lãi vay (VSA 520)**:
   - Tính toán dư nợ bình quân cả năm $\times$ Lãi suất bình quân hợp đồng vay $\rightarrow$ Đối chiếu trực tiếp với số liệu Chi phí lãi vay trên TK 635.

---

## 4. PLAN-11: GLV E400 - Tiền Lương & Các Khoản Trích Theo Lương (`E400 - Luong - Mau 2025 - Thinh.xlsx`)

### A. Hiện trạng
- Đã có `E 410` tổng hợp số dư TK 334, 3383, 3384, 3386.

### B. Giải pháp tự động hóa mới
1. **Sheet `E 490` - Đối chiếu tổng thể Quỹ lương và Chi phí nhân công**:
   - Lấy tổng phát sinh Có TK 334 cả năm đối chiếu với tổng chi phí nhân công trên các tài khoản 622, 6271, 6411, 6421.
2. **Sheet `E 491` - Bảng kiểm tra trích nộp BHXH, BHYT, BHTN, KPCĐ**:
   - Kiểm tra tỷ lệ trích nộp theo quy định pháp luật (Doanh nghiệp chịu 21.5%, Người lao động chịu 10.5%).
   - Đối chiếu số tiền đã nộp vào cơ quan bảo hiểm qua chứng từ Nợ 3383/Có 112 với thông báo đóng BHXH (Mẫu C12-TS).

---

## 5. PLAN-12: GLV F100 - Vốn Chủ Sở Hữu (`F100 - Von - Mau 2024 - Thinh.xlsx`)

### A. Hiện trạng
- Đã có `F 110` tổng hợp số dư TK 411, 418, 421.

### B. Giải pháp tự động hóa mới
1. **Sheet `F 190` - Kiểm tra biến động Vốn góp chủ sở hữu**:
   - Lọc các bút toán tăng vốn (Nợ 112/Có 4111) hoặc trả vốn góp.
2. **Sheet `F 148` - Bảng biến động Lợi nhuận sau thuế chưa phân phối (TK 421)**:
   - Điền số dư đầu năm, số kết chuyển lãi/lỗ năm nay (từ TK 911), số chia cổ tức/lợi nhuận (Nợ 421/Có 3388) và các khoản trích lập quỹ.

---

## 6. PLAN-13: GLV D200 - Đầu Tư Tài Chính Ngắn & Dài Hạn (`D200 - Dau tu - ABC 2020.xlsx`)

### A. Hiện trạng
- Đã có bảng điểm `D 299_ChamDiem`.

### B. Giải pháp tự động hóa mới
1. **Sheet `D 210` - Leadsheet số dư Đầu tư tài chính**:
   - Đổ số dư CDFS cho TK 121 (Chứng khoán kinh doanh), 128 (Đầu tư nắm giữ đến ngày đáo hạn), 221, 222, 228 (Đầu tư vào công ty con, liên kết).
2. **Sheet `D 280` & `D 290` - Chi tiết biến động tiền gửi có kỳ hạn**:
   - Liệt kê danh sách các hợp đồng tiền gửi tiết kiệm/tiền gửi có kỳ hạn tại các ngân hàng, đối chiếu lãi suất và doanh thu lãi tiền gửi ghi nhận trên TK 515.
