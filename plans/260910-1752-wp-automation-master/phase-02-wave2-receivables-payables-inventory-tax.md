# Phase 02: Chuẩn Hóa & Tự Động Hóa Đợt 2 (D300 - Phải Thu, E200 - Phải Trả, D500 - Hàng Tồn Kho, E300 - Thuế)

> **Mục tiêu:** Tự động hóa các phần hành liên quan đến số dư công nợ, giá trị tồn kho và nghĩa vụ ngân sách nhà nước.

---

## 1. PLAN-04: GLV D300 - Phải Thu Khách Hàng (`D300 - Phai thu - Mau 2025 - Thinh.xlsx`)

### A. Hiện trạng
- Đã có `D 310` tổng hợp số dư tài khoản 131, 138, 141, 2293.

### B. Giải pháp tự động hóa mới
1. **Sheet `D 351.1` & `D 352` - Tổng hợp số dư công nợ 131 theo khách hàng**:
   - Quét sổ NKC / Bảng kê chi tiết theo Mã khách hàng (`partnerCode`) hoặc Tên khách hàng (`customerName`).
   - Tổng hợp số dư Nợ cuối kỳ của từng khách hàng, sắp xếp giảm dần từ lớn đến nhỏ.
   - Tính toán tỷ trọng của từng khách hàng trên tổng dư nợ để xác định các khách hàng trọng yếu cần gửi Thư xác nhận (VSA 505).
2. **Sheet `D 390` - Bảng kê chọn mẫu gửi Thư xác nhận (TXN)**:
   - Tự động lọc các khách hàng có số dư $\ge \text{PM}$ (ngưỡng trọng yếu) hoặc các khách hàng có số dư âm lớn (nguy cơ treo tiền ứng trước của người mua).
   - Đổ danh sách vào mẫu gửi TXN, tự động đánh mã tham chiếu TXN-01, TXN-02...
3. **Sheet `D 354` - Kiểm tra trích lập Dự phòng nợ khó đòi (TK 2293)**:
   - Quét các khoản công nợ quá hạn (nếu có thông tin tuổi nợ) hoặc công nợ khó đòi.
   - Tính toán mức trích dự phòng theo Thông tư 48/2019/TT-BTC (30%, 50%, 70%, 100%) để KTV so sánh với số liệu kế toán đã trích.

---

## 2. PLAN-05: GLV E200 - Phải Trả Người Bán (`E200 - Phai tra - Mau 2024 - Thinh.xlsx`)

### A. Hiện trạng
- Đã có `E 210` tổng hợp số dư tài khoản 331, 338.

### B. Giải pháp tự động hóa mới
1. **Sheet `E 250.2` - Đánh giá số dư chi tiết phải trả NCC**:
   - Tổng hợp số dư Có TK 331 theo từng nhà cung cấp.
   - Phân tích số dư Nợ TK 331 (trả trước cho người bán) để rà soát rủi ro mất vốn hoặc chậm bàn giao hàng hóa.
2. **Sheet `E252` - Bảng tổng hợp Thư xác nhận nhà cung cấp**:
   - Chọn mẫu các nhà cung cấp có doanh số mua hàng lớn nhất trong năm và số dư nợ cuối kỳ lớn.
3. **Sheet `E295` - Tìm kiếm nợ chưa ghi sổ sau niên độ (Search for Unrecorded Liabilities)**:
   - Thủ tục kiểm toán bắt buộc theo chuẩn mực VSA: Quét toàn bộ các khoản thanh toán tiền mặt/chuyển khoản trong tháng 01 năm sau (từ NKC hoặc sổ phụ ngân hàng).
   - Lọc các khoản chi trả có nguồn gốc từ hóa đơn/phiếu nhập kho phát sinh trong năm kiểm toán nhưng chưa ghi nhận vào công nợ hoặc chi phí năm cũ.

---

## 3. PLAN-06: GLV D500 - Hàng Tồn Kho (`D500 - HTK - Mau 2024 - Thinh.xlsx`)

### A. Hiện trạng
- Đã có `D 510` tổng hợp số dư 151, 152, 153, 154, 155, 156, 157, 2294.

### B. Giải pháp tự động hóa mới
1. **Sheet `D550` - Bảng tổng hợp, đối chiếu số liệu tồn kho**:
   - Đối chiếu số dư trên CDFS với Bảng tổng hợp Nhập - Xuất - Tồn kho.
   - Nhận diện các mặt hàng có số lượng âm, đơn giá âm hoặc không phát sinh biến động trong năm (hàng chậm luân chuyển).
2. **Sheet `D595` - Kiểm tra Cut-off Mua hàng / Nhập kho**:
   - Trích xuất 10 phiếu nhập kho cuối cùng trước ngày khóa sổ và 10 phiếu nhập kho đầu tiên sau ngày khóa sổ.
   - Đối chiếu hóa đơn GTGT đầu vào tương ứng để kiểm tra việc ghi nhận trùng hoặc thiếu hàng đang đi đường.
3. **Sheet `D590` - Đọc lướt Sổ Cái tìm nghiệp vụ bất thường về tồn kho**:
   - Lọc các bút toán Có 152/156 đối ứng với các tài khoản lạ (như Nợ 811, Nợ 1388, Nợ 411...).

---

## 4. PLAN-07: GLV E300 - Thuế & Các Khoản Phải Nộp Nhà Nước (`E300 - Thue - Mau 2024 - Thinh.xlsx`)

### A. Hiện trạng
- Đã có `E 310` và `E 380` (Đối chiếu thuế GTGT 12 tháng).

### B. Giải pháp tự động hóa mới
1. **Sheet `E 382` - Bảng kiểm tra Thuế TNDN (TK 3334)**:
   - Điền số thuế TNDN tạm nộp 4 quý trong năm (Nợ 3334/Có 112).
   - Tính toán số thuế TNDN phải nộp cả năm dựa trên Kết quả kinh doanh và các khoản điều chỉnh chi phí không được trừ theo luật thuế.
   - Kiểm tra rủi ro phạt chậm nộp nếu số thuế tạm nộp 4 quý $< 80\%$ số phải nộp cả năm (Nghị định 126/2020/NĐ-CP).
2. **Sheet `E 395` - Kiểm tra Cut-off Thuế GTGT**:
   - Kiểm tra ngày hóa đơn và kỳ kê khai của các hóa đơn xuất/nhận vào cuối tháng 12 để phát hiện trường hợp kê khai sai kỳ.
