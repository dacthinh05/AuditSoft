# Phase 02: Xây Dựng Script Engine Chuẩn Hóa Thủ Tục Kiểm Toán Chuẩn VACPA

## 1. Mục Tiêu
Xây dựng script Python `scripts/inject-vacpa-procedures.py` sử dụng thư viện `openpyxl` để tự động hóa việc chèn bảng Chương Trình Kiểm Toán vào sheet `*20` của từng file GLV, đảm bảo format chuẩn xác tuyệt đối (Font chữ, viền kẻ, căn lề, độ cao dòng, màu sắc).

## 2. Thiết Kế Cơ Sở Dữ Liệu Thủ Tục Kiểm Toán
Mỗi phần hành kiểm toán có một danh mục thủ tục bám sát Bảng chấm điểm 2014 của Bộ Tài chính:
- **Tiền (D100)**: 6 thủ tục (Kiểm kê quỹ, TXN ngân hàng, đối chiếu sổ phụ, kiểm tra mẫu chứng từ, cutoff, lưu chuyển tiền tệ).
- **Phải thu (D300)**: 6 thủ tục (Gửi TXN, đối chiếu biên bản, thủ tục thay thế, kiểm tra trả trước, trích lập dự phòng khó đòi, cutoff).
- **Hàng tồn kho (D500)**: 6 thủ tục (Chứng kiến kiểm kê, đối chiếu sổ kho, phương pháp tính giá, tính giá thành dở dang, dự phòng giảm giá HTK, cutoff).
- **Chi phí trả trước (D600)**: 3 thủ tục (Chọn mẫu ghi nhận, kiểm tra tiêu thức phân bổ, kiểm tra tính nhất quán).
- **Tài sản cố định (D700)**: 6 thủ tục (Kiểm tra tăng/giảm, hiện hữu, bảng tính khấu hao, **ước tính độc lập khấu hao**, thuyết minh).
- **Vay và nợ (E100)**: 5 thủ tục (TXN vay, thủ tục thay thế, **ước tính độc lập lãi vay**, phân loại ngắn/dài hạn, thuyết minh).
- **Phải trả người bán (E200)**: 6 thủ tục (TXN phải trả, đối chiếu biên bản, thủ tục thay thế, **tìm nợ chưa ghi sổ sau niên độ**, chi phí trích trước, phân loại).
- **Thuế & NSNN (E300)**: 4 thủ tục (Kiểm tra thuế suất, **đối chiếu tờ khai thuế các tháng**, ước tính thuế TNDN/GTGT phải nộp, thuyết minh).
- **Lương & trích theo lương (E400)**: 5 thủ tục (Phân tích biến động lương, phân bổ giá thành, **đối chiếu quyết toán BHXH**, thu nhập ban điều hành).
- **Vốn chủ sở hữu (F100)**: 5 thủ tục (Đối chiếu ĐKKD/danh sách cổ đông, đối chiếu LNST với KQKD, phân phối lợi nhuận, trích lập quỹ).
- **Doanh thu (G100)**: 6 thủ tục (Phân tích biến động, đối chiếu bộ phận bán hàng/kho, đối chiếu tờ khai GTGT, chọn mẫu hóa đơn chứng từ, **kiểm tra Cut-off**).
- **Giá vốn & Chi phí (G200)**: 8 thủ tục (Tỷ lệ lãi gộp, nguyên tắc phù hợp, Cut-off giá vốn, phân tích biến động chi phí QLDN/Bán hàng, chi phí tài chính).

## 3. Quy Chuẩn Format Excel Cần Tuân Thủ
1. **Font chữ**: Sử dụng cùng font chữ với phần còn lại của sheet (`Times New Roman` hoặc `Arial`), cỡ chữ 10-11pt.
2. **Tiêu đề bảng**: In đậm, nền xám nhạt (`#F1F5F9` hoặc `#E2E8F0`), chữ đen `#000000`, chiều cao dòng header 26pt.
3. **Đường viền (Borders)**: Đường kẻ mỏng đen toàn bộ bảng (`Side(style='thin', color='000000')`).
4. **Căn lề (Alignment)**:
   - Cột STT: Căn giữa (`alignment=Alignment(horizontal='center', vertical='center')`).
   - Cột Thủ tục kiểm toán: Căn trái, bật `wrap_text=True`, có thụt đầu dòng rõ ràng giữa nhóm I, II, III và các thủ tục con.
   - Cột CSDL (Cơ sở dẫn liệu): Căn giữa (`C`, `R&O`, `Comp`, `Val`, `Cut-off`, `P&D`).
   - Cột Tham chiếu GLV: Căn giữa, in đậm (`D 110`, `D 141`, `D 146`...).
   - Cột Người thực hiện & Ngày HT: Căn giữa (`KTV`, `15/01/2026`).
   - Cột Kết luận/Ghi chú: Căn trái (`wrap_text=True`).
