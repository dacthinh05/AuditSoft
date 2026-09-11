# Phase 01: Bóc Tách Cơ Sở Dữ Liệu Tiêu Chí Chấm Điểm Chi Tiết

## 1. Mục Tiêu
Trích xuất toàn bộ câu hỏi đánh giá thực hiện kiểm toán từ file `D:\Desktop\1. Du thao Bang cham diem HSKT BCTC - 3.11.2014.xls` (Phần III) và cấu trúc hóa thành dữ liệu Python dictionary, ánh xạ chính xác vào 13 file GLV.

## 2. Chi Tiết Các Bộ Tiêu Chí Theo Từng File
1. **D100 (Tiền)**: 6 tiêu chí (1.1 -> 1.6), tổng 6.0 điểm. VSA 330, 500, 505. Tham chiếu: D110, D141, D143, D146, D195TM/NH, D196, D198.
2. **D200 (Đầu tư tài chính)**: 5 tiêu chí (2.1 -> 2.5), tổng 5.0 điểm. VSA 330, 500, 505, 540. Tham chiếu: D210, D240, D241, D252, D298.
3. **D300 (Phải thu)**: 6 tiêu chí (3.1 -> 3.6), tổng 6.0 điểm. VSA 330, 500, 505, 240, 540. Tham chiếu: D310, D340, D341, D351.1, D352, D353, D354, D398.
4. **D500 (Hàng tồn kho)**: 6 tiêu chí (4.1 -> 4.6), tổng 6.0 điểm. VSA 501, 330, 500, 315, 540. Tham chiếu: D510, D540, D541, D553, D556, D557, D595, D598.
5. **D600 (Chi phí trả trước)**: 3 tiêu chí (5.1 -> 5.3), tổng 3.0 điểm. VSA 330, 530, 315, 540. Tham chiếu: D610, D640, D641, D698.
6. **D700 (Tài sản cố định)**: 6 tiêu chí (6.1 -> 6.6), tổng 6.0 điểm. VSA 330, 500, 540, 520. Tham chiếu: D710, D740, D741, D790, D792, D794, D798.
7. **E100 (Vay và nợ)**: 6 tiêu chí (7.1 -> 7.6), tổng 6.0 điểm. VSA 330, 505, 520, 540. Tham chiếu: E110, E140, E141, E150, E152, E198.
8. **E200 (Phải trả & Chi phí trích trước)**: 9 tiêu chí (8.1 -> 8.6 và 11.1 -> 11.3), tổng 9.0 điểm. VSA 330, 505, 560, 540. Tham chiếu: E210, E240, E241, E242, E252, E260, E270, E298.
9. **E300 (Thuế & NSNN)**: 4 tiêu chí (9.1 -> 9.4), tổng 4.0 điểm. VSA 250, 330, 520. Tham chiếu: E310, E330, E340, E341, E380, E382, E398.
10. **E400 (Lương & BHXH)**: 5 tiêu chí (10.1 -> 10.5), tổng 5.0 điểm. VSA 330, 520, 250, 550. Tham chiếu: E410, E440, E441, E490, E491, E492, E498.
11. **F100 (Nguồn vốn CSH)**: 6 tiêu chí (12.1 -> 12.6), tổng 6.0 điểm. VSA 330, 505, 250. Tham chiếu: F110, F140, F141, F130, F148, F190, F198.
12. **G100 (Doanh thu)**: 6 tiêu chí (14.1 -> 14.6), tổng 6.0 điểm. VSA 240, 330, 520, 500, 560. Tham chiếu: G110, G140, G141, G150, G191.1, G194, G195.
13. **G200 (Giá vốn & Chi phí)**: 14 tiêu chí (15.1 -> 15.6, 16.1 -> 16.4, 17.1 -> 17.4), tổng 14.0 điểm. VSA 330, 520, 530, 560. Tham chiếu: G210, G240, G241, G242, G250, G310, G340, G410, G440, G441, G495.

## 3. Tiêu Chí Nghiệm Thu
Dữ liệu được biên soạn chính xác theo nguyên văn tiếng Việt trong file dự thảo, sẵn sàng đưa vào code generator.
