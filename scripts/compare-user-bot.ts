// Bóc tách số liệu từ 2 ảnh của bạn:
// ẢNH 1: Bạn lọc các bút toán kết chuyển:
// 1. Nợ 154 / Có 62xx:
//    - Nhân công (NC): 527.763.223.730 đ
//    - Khấu hao (KH): 19.958.998.391 đ
//    - Dịch vụ ngoài (DV): 298.311.489.483 đ
//    - Khác bằng tiền: 81.302.780.378 đ
//    => Tổng chi phí sản xuất cấu thành giá thành = 927.336.491.982 đ
//
// 2. Nợ 911 / Có 641, 642 (Chi phí bán hàng & Quản lý doanh nghiệp):
//    - Nhân công: 36.151.941.100 đ
//    - Khấu hao: 586.211.913 đ
//    - Dịch vụ ngoài: 3.709.896.519 đ
//    - Khác bằng tiền: 13.427.634.467 đ
//    => Tổng CPBH & QLDN (641 + 642) = 53.875.683.999 đ

// ẢNH 2: Bảng Thuyết Minh BCTC chuẩn của bạn:
// Chỉ tiêu Mục 28: Chi phí theo yếu tố là TỔNG 5 YẾU TỐ SẢN XUẤT ĐI VÀO GIÁ THÀNH:
// = 927.336.491.982 đ!
// + Tồn kho TP đầu năm (155 ĐK): 34.000.001.634 đ
// - Dở dang cuối năm (154 CK): (4.577.598.159 đ)
// - Tồn kho TP cuối năm (155 CK): (22.820.906.886 đ)
// => Tổng chi phí SXKD trong kỳ = 933.937.988.571 đ!
// Đối ứng sổ sách (Chỉ tiêu Giá vốn 632) = 933.937.988.571 đ!
// Chênh lệch = -0.39 đ ~ 0 đ (CÂN ĐỐI HOÀN HẢO)!

// ẢNH 3: Bảng bot đang chạy ra:
// Bot tính:
// 5 Yếu tố = 930.149.969.691 đ
// + 155 ĐK: 34.000.001.634 đ
// - 154 CK: (4.577.598.159 đ)
// - 155 CK: (22.820.906.886 đ)
// => Tổng tính toán = 936.751.466.280 đ
// Sổ kế toán (632 + 641 + 642) = 933.749.688.807 đ
// Độ lệch = 3.001.777.473 đ!

console.log('927.336.491.982 vs 930.149.969.691 => Bot thừa:', 930149969691 - 927336491982) // 2.813.477.709
