#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script tự động hóa tích hợp bảng THỦ TỤC KIỂM TOÁN CHUẨN VACPA 2014
vào các file Giấy làm việc (GLV) mẫu của AuditSoft.
Tuân thủ nghiêm ngặt nguyên tắc FORMAT Excel chuyên nghiệp.
"""

import os
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter

# Thư mục chứa các file GLV hiện tại
TARGET_DIR = 'D:/Desktop/Project/5. AuditSoft/GLV MAU'

# Định nghĩa dữ liệu thủ tục kiểm toán chuẩn VACPA cho 13 file GLV
PROCEDURES_DATABASE = {
    'D100': {
        'title': 'CHƯƠNG TRÌNH KIỂM TOÁN TIỀN VÀ CÁC KHOẢN TƯƠNG ĐƯƠNG TIỀN',
        'ref_code': 'D 120',
        'sheet_candidates': ['D 120', 'D120'],
        'items': [
            ('I', 'THỦ TỤC PHÂN TÍCH BAN ĐẦU', '', '', '', '', ''),
            ('1', 'Lập bảng số liệu tổng hợp, đối chiếu số dư tiền và tương đương tiền với CĐSPS và BCTC (VSA 330, VSA 500)', 'C, Val', 'D 110', 'Thinh', '15/01/2026', 'Khớp đúng số dư'),
            ('2', 'Phân tích biến động số dư tiền, tỷ trọng tiền so với tổng tài sản và kỳ trước (VSA 330, VSA 520)', 'C, Comp', 'D 110', 'Thinh', '15/01/2026', 'Biến động phù hợp'),
            ('II', 'THỦ TỤC KIỂM TRA CHI TIẾT (SUBSTANTIVE PROCEDURES)', '', '', '', '', ''),
            ('3', 'Tham gia chứng kiến kiểm kê quỹ tiền mặt tồn quỹ tại thời điểm khóa sổ (hoặc đối chiếu biến động đến 31/12) (VSA 330, VSA 500)', 'C, R&O', 'D 146', 'Thinh', '31/12/2025', 'Biên bản kiểm kê đầy đủ'),
            ('4', 'Đối chiếu biên bản kiểm kê quỹ thực tế với sổ kế toán; giải thích và đề xuất điều chỉnh chênh lệch (nếu có) (VSA 330, VSA 500)', 'Comp, Val', 'D 146, D198', 'Thinh', '31/12/2025', 'Khớp số liệu thực tế'),
            ('5', 'Chọn mẫu và gửi thư xác nhận (TXN) số dư 100% các tài khoản ngân hàng mở trong kỳ (VSA 330, VSA 505)', 'C, R&O', 'D 141', 'Thinh', '10/01/2026', 'Đã gửi xác nhận đầy đủ'),
            ('6', 'Đối chiếu số liệu thư xác nhận ngân hàng, sổ phụ ngân hàng và bảng chỉnh hợp với Sổ cái kế toán (VSA 330, VSA 505)', 'C, Comp', 'D 143, D 110', 'Thinh', '15/01/2026', 'Khớp số dư xác nhận'),
            ('7', 'Chọn mẫu kiểm tra chi tiết các nghiệp vụ thu, chi tiền mặt và tiền gửi ngân hàng phát sinh trong kỳ (VSA 330, VSA 530)', 'C, Val', 'D 191.1, D 195TM/TGNH', 'Thinh', '18/01/2026', 'Hồ sơ chứng từ hợp lệ'),
            ('8', 'Kiểm tra tính đúng kỳ (Cut-off) của các nghiệp vụ thu, chi tiền trước và sau ngày khóa sổ 31/12 (VSA 330, VSA 560)', 'Cut-off', 'D 196', 'Thinh', '18/01/2026', 'Ghi nhận đúng kỳ kế toán'),
            ('9', 'Đánh giá lại số dư tiền và tiền gửi có gốc ngoại tệ theo tỷ giá thực tế tại ngày kết thúc kỳ kế toán (VSA 330, VSA 540)', 'Val', 'D 110', 'Thinh', '15/01/2026', 'Tỷ giá hạch toán phù hợp'),
            ('III', 'TRÌNH BÀY VÀ KẾT LUẬN', '', '', '', '', ''),
            ('10', 'Kiểm tra việc phân loại và trình bày tiền trên Báo cáo lưu chuyển tiền tệ và Thuyết minh BCTC (VSA 330)', 'P&D', 'D 110.1', 'Thinh', '20/01/2026', 'Trình bày phù hợp chuẩn mực'),
            ('11', 'Tổng hợp các sai sót chưa điều chỉnh phát hiện trong phần hành Tiền (VSA 450)', 'Val', 'D198', 'Thinh', '20/01/2026', 'Không có sai sót trọng yếu'),
        ]
    },
    'D200': {
        'title': 'CHƯƠNG TRÌNH KIỂM TOÁN CÁC KHOẢN ĐẦU TƯ TÀI CHÍNH',
        'ref_code': 'D 220',
        'sheet_candidates': ['D220', 'D 220'],
        'items': [
            ('I', 'THỦ TỤC PHÂN TÍCH BAN ĐẦU', '', '', '', '', ''),
            ('1', 'Lập bảng tổng hợp các khoản đầu tư tài chính ngắn hạn và dài hạn, đối chiếu số dư sổ cái và BCTC (VSA 330, VSA 500)', 'C, Val', 'D210', 'Thinh', '15/01/2026', 'Khớp số liệu tổng hợp'),
            ('II', 'THỦ TỤC KIỂM TRA CHI TIẾT', '', '', '', '', ''),
            ('2', 'Kiểm tra hồ sơ pháp lý, chứng từ chứng minh quyền sở hữu đối với các khoản đầu tư tại ngày kết thúc kỳ (VSA 330, VSA 500)', 'R&O', 'D240', 'Thinh', '16/01/2026', 'Hồ sơ pháp lý đầy đủ'),
            ('3', 'Chọn mẫu gửi thư xác nhận (TXN) số dư các khoản đầu tư với bên nhận đầu tư hoặc tổ chức lưu ký (VSA 330, VSA 505)', 'C, R&O', 'D241', 'Thinh', '10/01/2026', 'Đã gửi xác nhận'),
            ('4', 'Thực hiện thủ tục kiểm toán thay thế đối với các khoản đầu tư không nhận được phản hồi TXN (VSA 505)', 'C, Comp', 'D241, D252', 'Thinh', '18/01/2026', 'Đã thu thập bằng chứng thay thế'),
            ('5', 'Kiểm tra việc trích lập dự phòng giảm giá các khoản đầu tư tài chính theo quy định hiện hành (VSA 330, VSA 540)', 'Val', 'D252, D298', 'Thinh', '18/01/2026', 'Trích lập đúng quy định'),
            ('6', 'Kiểm tra việc ghi nhận doanh thu tài chính (cổ tức, lợi nhuận được chia, lãi tiền gửi có kỳ hạn) (VSA 330)', 'C, Cut-off', 'D230', 'Thinh', '18/01/2026', 'Doanh thu phản ánh chính xác'),
            ('III', 'TRÌNH BÀY VÀ KẾT LUẬN', '', '', '', '', ''),
            ('7', 'Kiểm tra việc phân loại ngắn hạn, dài hạn và trình bày thuyết minh trên BCTC (VSA 330)', 'P&D', 'D220', 'Thinh', '20/01/2026', 'Thuyết minh đầy đủ'),
            ('8', 'Tổng hợp các sai sót chưa điều chỉnh (VSA 450)', 'Val', 'D298', 'Thinh', '20/01/2026', 'Không có sai sót trọng yếu'),
        ]
    },
    'D300': {
        'title': 'CHƯƠNG TRÌNH KIỂM TOÁN CÁC KHOẢN PHẢI THU KHÁCH HÀNG',
        'ref_code': 'D 320',
        'sheet_candidates': ['D 320', 'D320'],
        'items': [
            ('I', 'THỦ TỤC PHÂN TÍCH BAN ĐẦU', '', '', '', '', ''),
            ('1', 'Lập bảng số liệu tổng hợp nợ phải thu, đối chiếu số dư chi tiết với Sổ cái và BCTC (VSA 330, VSA 500)', 'Comp, Val', 'D 310', 'Thinh', '15/01/2026', 'Khớp số liệu chi tiết'),
            ('2', 'Phân tích biến động số dư phải thu so với kỳ trước và phân tích vòng quay khoản phải thu (VSA 520)', 'Comp, Val', 'D 310', 'Thinh', '15/01/2026', 'Biến động phù hợp doanh thu'),
            ('II', 'THỦ TỤC KIỂM TRA CHI TIẾT', '', '', '', '', ''),
            ('3', 'Chọn mẫu và gửi thư xác nhận (TXN) số dư các khoản nợ phải thu trọng yếu với bên thứ ba (VSA 330, VSA 505)', 'C, R&O', 'D 340, D 341', 'Thinh', '10/01/2026', 'Đã gửi xác nhận theo mẫu'),
            ('4', 'Đối chiếu số liệu phản hồi TXN / Biên bản đối chiếu công nợ với sổ sách; xử lý chênh lệch (VSA 330, VSA 505)', 'C, Comp', 'D 341, D 398', 'Thinh', '18/01/2026', 'Chênh lệch đã được giải trình'),
            ('5', 'Thực hiện thủ tục kiểm toán thay thế đối với các khoản nợ không nhận được phản hồi TXN (VSA 505)', 'C, R&O', 'D 351.1, D 351.2', 'Thinh', '19/01/2026', 'Kiểm tra hóa đơn và thu tiền sau kỳ'),
            ('6', 'Kiểm tra chi tiết số dư người mua trả tiền trước ngắn hạn/dài hạn (VSA 330, VSA 240)', 'R&O, Val', 'D353', 'Thinh', '19/01/2026', 'Hợp đồng có căn cứ thực hiện'),
            ('7', 'Phân tích tuổi nợ và kiểm tra tính toán trích lập dự phòng nợ phải thu khó đòi theo quy định (VSA 330, VSA 540)', 'Val', 'D 352', 'Thinh', '19/01/2026', 'Dự phòng trích lập đúng quy định'),
            ('8', 'Kiểm tra tính đúng kỳ (Cut-off) của các khoản phải thu gắn với doanh thu trước và sau 31/12 (VSA 330, VSA 560)', 'Cut-off', 'D354', 'Thinh', '19/01/2026', 'Không có sai lệch kỳ kế toán'),
            ('9', 'Đánh giá lại số dư nợ phải thu có gốc ngoại tệ tại ngày kết thúc niên độ kế toán (VSA 330, VSA 540)', 'Val', 'D 310', 'Thinh', '15/01/2026', 'Tỷ giá hạch toán chính xác'),
            ('III', 'TRÌNH BÀY VÀ KẾT LUẬN', '', '', '', '', ''),
            ('10', 'Kiểm tra phân loại nợ ngắn hạn, dài hạn và tính đầy đủ của thông tin thuyết minh trên BCTC (VSA 330)', 'P&D', 'D 320', 'Thinh', '20/01/2026', 'Trình bày phù hợp chuẩn mực'),
            ('11', 'Tổng hợp các sai sót chưa điều chỉnh (VSA 450)', 'Val', 'D 398', 'Thinh', '20/01/2026', 'Không có sai sót trọng yếu'),
        ]
    },
    'D500': {
        'title': 'CHƯƠNG TRÌNH KIỂM TOÁN HÀNG TỒN KHO',
        'ref_code': 'D 520',
        'sheet_candidates': ['D520', 'D 520'],
        'items': [
            ('I', 'THỦ TỤC PHÂN TÍCH BAN ĐẦU', '', '', '', '', ''),
            ('1', 'Lập bảng tổng hợp hàng tồn kho (151-158), đối chiếu Báo cáo NXT với Sổ cái và BCTC (VSA 330, VSA 500)', 'Comp, Val', 'D 510', 'Thinh', '15/01/2026', 'Khớp số liệu NXT và Sổ cái'),
            ('2', 'Phân tích biến động số dư và tỷ lệ vòng quay hàng tồn kho so với kỳ trước (VSA 520)', 'Comp, Val', 'D 510', 'Thinh', '15/01/2026', 'Vòng quay HTK hợp lý'),
            ('II', 'THỦ TỤC KIỂM TRA CHI TIẾT', '', '', '', '', ''),
            ('3', 'Tham gia chứng kiến kiểm kê hiện vật hàng tồn kho tại ngày kết thúc kỳ (hoặc đối chiếu biến động) (VSA 501, VSA 330)', 'C, R&O', 'D540, D541', 'Thinh', '31/12/2025', 'Đã chứng kiến kiểm kê kho'),
            ('4', 'Đối chiếu số liệu kiểm kê thực tế với thẻ kho, sổ kế toán; xử lý chênh lệch thừa thiếu (VSA 501, VSA 500)', 'Comp, C', 'D540, D598', 'Thinh', '31/12/2025', 'Chênh lệch kiểm kê đã giải trình'),
            ('5', 'Kiểm tra phương pháp tính giá hàng tồn kho (Bình quân, FIFO...), tính phù hợp và nhất quán (VSA 330, VSA 315)', 'Val', 'D553, D554', 'Thinh', '18/01/2026', 'Phương pháp tính giá nhất quán'),
            ('6', 'Kiểm tra việc tập hợp chi phí sản xuất, tính giá thành và xác định giá trị sản phẩm dở dang cuối kỳ (VSA 330)', 'Val, C', 'D556, D556.1', 'Thinh', '18/01/2026', 'Đánh giá dở dang phù hợp'),
            ('7', 'Kiểm tra việc lập dự phòng giảm giá hàng tồn kho (so sánh giá gốc với giá trị thuần có thể thực hiện được) (VSA 330, VSA 540)', 'Val', 'D557', 'Thinh', '19/01/2026', 'Trích lập dự phòng đầy đủ'),
            ('8', 'Kiểm tra tính đúng kỳ (Cut-off) của các nghiệp vụ nhập, xuất kho trước và sau ngày 31/12 (VSA 330, VSA 560)', 'Cut-off', 'D595', 'Thinh', '19/01/2026', 'Không có sai lệch kỳ kế toán'),
            ('9', 'Kiểm tra hàng gửi đi bán, hàng mua đang đi trên đường, hàng nhận giữ hộ (VSA 330)', 'R&O, C', 'D550, D558', 'Thinh', '19/01/2026', 'Hồ sơ đầy đủ, không tranh chấp'),
            ('III', 'TRÌNH BÀY VÀ KẾT LUẬN', '', '', '', '', ''),
            ('10', 'Kiểm tra việc phân loại và trình bày thuyết minh hàng tồn kho trên BCTC (VSA 330)', 'P&D', 'D520', 'Thinh', '20/01/2026', 'Thuyết minh đầy đủ'),
            ('11', 'Tổng hợp các sai sót chưa điều chỉnh (VSA 450)', 'Val', 'D598', 'Thinh', '20/01/2026', 'Không có sai sót trọng yếu'),
        ]
    },
    'D600': {
        'title': 'CHƯƠNG TRÌNH KIỂM TOÁN CHI PHÍ TRẢ TRƯỚC',
        'ref_code': 'D 620',
        'sheet_candidates': ['D620', 'D 620'],
        'items': [
            ('I', 'THỦ TỤC PHÂN TÍCH BAN ĐẦU', '', '', '', '', ''),
            ('1', 'Lập bảng tổng hợp chi phí trả trước (TK 242), đối chiếu số dư Sổ cái và BCTC (VSA 330, VSA 500)', 'Comp, Val', 'D 610', 'Thinh', '15/01/2026', 'Khớp số liệu tổng hợp'),
            ('II', 'THỦ TỤC KIỂM TRA CHI TIẾT', '', '', '', '', ''),
            ('2', 'Chọn mẫu kiểm tra hồ sơ, hóa đơn chứng từ phát sinh tăng chi phí trả trước trong kỳ (VSA 330, VSA 530)', 'C, R&O', 'D 640, D 641', 'Thinh', '17/01/2026', 'Chứng từ hợp lệ, đầy đủ'),
            ('3', 'Kiểm tra tính phù hợp và nhất quán của tiêu thức, thời gian phân bổ chi phí trả trước vào chi phí SXKD (VSA 330, VSA 540)', 'Val, Cut-off', 'D 640', 'Thinh', '17/01/2026', 'Tiêu thức phân bổ nhất quán'),
            ('III', 'TRÌNH BÀY VÀ KẾT LUẬN', '', '', '', '', ''),
            ('4', 'Kiểm tra phân loại chi phí trả trước ngắn hạn và dài hạn trên BCTC (VSA 330)', 'P&D', 'D 610.1, D620', 'Thinh', '20/01/2026', 'Phân loại phù hợp'),
            ('5', 'Tổng hợp các sai sót chưa điều chỉnh (VSA 450)', 'Val', 'D 698', 'Thinh', '20/01/2026', 'Không có sai sót trọng yếu'),
        ]
    },
    'D700': {
        'title': 'CHƯƠNG TRÌNH KIỂM TOÁN TÀI SẢN CỐ ĐỊNH VÀ XÂY DỰNG CƠ BẢN',
        'ref_code': 'D 720',
        'sheet_candidates': ['D720', 'D 720'],
        'items': [
            ('I', 'THỦ TỤC PHÂN TÍCH BAN ĐẦU', '', '', '', '', ''),
            ('1', 'Lập bảng tổng hợp nguyên giá và hao mòn lũy kế TSCĐ, đối chiếu Sổ cái và BCTC (VSA 330, VSA 500)', 'Comp, Val', 'D 710', 'Thinh', '15/01/2026', 'Khớp số dư nguyên giá & hao mòn'),
            ('II', 'THỦ TỤC KIỂM TRA CHI TIẾT', '', '', '', '', ''),
            ('2', 'Chọn mẫu kiểm tra nghiệp vụ tăng, giảm TSCĐ và chi phí XDCBDD trong kỳ (hóa đơn, hợp đồng, nghiệm thu) (VSA 330, VSA 530)', 'C, R&O', 'D 740, D 741', 'Thinh', '18/01/2026', 'Hồ sơ đầu tư mua sắm đầy đủ'),
            ('3', 'Kiểm tra tính hiện hữu và tình trạng hoạt động thực tế của các tài sản cố định trọng yếu (VSA 330, VSA 500)', 'C', 'D 740', 'Thinh', '18/01/2026', 'Tài sản hiện hữu, hoạt động bình thường'),
            ('4', 'Kiểm tra bảng tính khấu hao, phương pháp khấu hao và khung thời gian khấu hao theo Thông tư 45/2013/TT-BTC (VSA 330, VSA 540)', 'Val', 'D 790', 'Thinh', '18/01/2026', 'Khấu hao đúng khung quy định'),
            ('5', 'Thực hiện ước tính độc lập về chi phí khấu hao trong kỳ và so sánh với số liệu của đơn vị (VSA 520, VSA 540)', 'Val, Comp', 'D 792', 'Thinh', '18/01/2026', 'Chênh lệch ước tính không trọng yếu'),
            ('6', 'Kiểm tra chi phí XDCB dở dang, đánh giá tiến độ hoàn thành và điều kiện kết chuyển (VSA 330)', 'Val, Cut-off', 'D794', 'Thinh', '18/01/2026', 'Kết chuyển đúng thời điểm bàn giao'),
            ('III', 'TRÌNH BÀY VÀ KẾT LUẬN', '', '', '', '', ''),
            ('7', 'Kiểm tra tính đầy đủ, phù hợp của thông tin thuyết minh TSCĐ trên BCTC (thế chấp, cam kết) (VSA 330)', 'P&D', 'D720', 'Thinh', '20/01/2026', 'Thuyết minh đầy đủ theo VAS'),
            ('8', 'Tổng hợp các sai sót chưa điều chỉnh (VSA 450)', 'Val', 'D 798', 'Thinh', '20/01/2026', 'Không có sai sót trọng yếu'),
        ]
    },
    'E100': {
        'title': 'CHƯƠNG TRÌNH KIỂM TOÁN VAY VÀ NỢ THUÊ TÀI CHÍNH',
        'ref_code': 'E 120',
        'sheet_candidates': ['E 120', 'E120'],
        'items': [
            ('I', 'THỦ TỤC PHÂN TÍCH BAN ĐẦU', '', '', '', '', ''),
            ('1', 'Lập bảng tổng hợp các khoản vay và nợ tài chính (TK 341), đối chiếu Sổ cái và BCTC (VSA 330, VSA 500)', 'Comp, R&O', 'E 110', 'Thinh', '15/01/2026', 'Khớp số liệu tổng hợp'),
            ('II', 'THỦ TỤC KIỂM TRA CHI TIẾT', '', '', '', '', ''),
            ('2', 'Gửi thư xác nhận (TXN) số dư các khoản vay với các ngân hàng, tổ chức tín dụng và bên cho vay (VSA 330, VSA 505)', 'C, R&O', 'E 140, E141', 'Thinh', '10/01/2026', 'Đã gửi xác nhận 100% ngân hàng'),
            ('3', 'Đối chiếu số liệu phản hồi TXN, hợp đồng tín dụng, khế ước nhận nợ với sổ kế toán; xử lý chênh lệch (VSA 330, VSA 505)', 'C, Comp', 'E 141', 'Thinh', '18/01/2026', 'Khớp số dư nợ gốc và lãi vay'),
            ('4', 'Thực hiện thủ tục kiểm toán thay thế đối với các khoản vay không thể gửi hoặc không nhận được TXN (VSA 505)', 'C, R&O', 'E 150', 'Thinh', '18/01/2026', 'Kiểm tra sao kê và chứng từ trả nợ'),
            ('5', 'Thực hiện ước tính độc lập chi phí lãi vay trong kỳ dựa trên dư nợ bình quân và lãi suất hợp đồng (VSA 520, VSA 540)', 'Val, Comp', 'E 152', 'Thinh', '18/01/2026', 'Chi phí lãi vay khớp ước tính'),
            ('6', 'Kiểm tra việc phân loại các khoản nợ vay đến hạn trả trong vòng 12 tháng (ngắn hạn) và dài hạn (VSA 330)', 'P&D', 'E 110.1', 'Thinh', '18/01/2026', 'Phân loại đúng hạn nợ'),
            ('7', 'Đánh giá lại các khoản vay có gốc ngoại tệ theo tỷ giá bán thực tế tại ngày kết thúc niên độ (VSA 330, VSA 540)', 'Val', 'E 110', 'Thinh', '15/01/2026', 'Tỷ giá hạch toán chính xác'),
            ('III', 'TRÌNH BÀY VÀ KẾT LUẬN', '', '', '', '', ''),
            ('8', 'Kiểm tra tính đầy đủ của thuyết minh nợ vay (tài sản bảo đảm, cam kết tài chính, vi phạm hợp đồng) (VSA 330)', 'P&D', 'E 120', 'Thinh', '20/01/2026', 'Thuyết minh đầy đủ'),
            ('9', 'Tổng hợp các sai sót chưa điều chỉnh (VSA 450)', 'Val', 'E 198', 'Thinh', '20/01/2026', 'Không có sai sót trọng yếu'),
        ]
    },
    'E200': {
        'title': 'CHƯƠNG TRÌNH KIỂM TOÁN CÁC KHOẢN PHẢI TRẢ NGƯỜI BÁN & CHI PHÍ PHẢI TRẢ',
        'ref_code': 'E 220',
        'sheet_candidates': ['E220', 'E 220'],
        'items': [
            ('I', 'THỦ TỤC PHÂN TÍCH BAN ĐẦU', '', '', '', '', ''),
            ('1', 'Lập bảng tổng hợp nợ phải trả người bán (TK 331), đối chiếu số dư chi tiết với Sổ cái và BCTC (VSA 330, VSA 500)', 'Comp, R&O', 'E 210', 'Thinh', '15/01/2026', 'Khớp số liệu tổng hợp'),
            ('II', 'THỦ TỤC KIỂM TRA CHI TIẾT', '', '', '', '', ''),
            ('2', 'Chọn mẫu và gửi thư xác nhận (TXN) số dư các khoản nợ phải trả lớn hoặc giao dịch thường xuyên (VSA 330, VSA 505)', 'C, R&O', 'E240, E241', 'Thinh', '10/01/2026', 'Đã gửi xác nhận nhà cung cấp'),
            ('3', 'Đối chiếu số liệu phản hồi TXN, Biên bản đối chiếu công nợ với sổ sách; giải trình và xử lý chênh lệch (VSA 330, VSA 505)', 'C, Comp', 'E241', 'Thinh', '18/01/2026', 'Chênh lệch đã được đối chiếu rõ'),
            ('4', 'Thực hiện thủ tục kiểm toán thay thế đối với các khoản nợ không nhận được phản hồi TXN (VSA 505)', 'Comp, R&O', 'E242', 'Thinh', '18/01/2026', 'Kiểm tra phiếu nhập kho và trả tiền sau kỳ'),
            ('5', 'Kiểm tra tìm kiếm các khoản nợ chưa ghi sổ (Unrecorded liabilities - Cutoff) qua hóa đơn và chi tiền sau 31/12 (VSA 330, VSA 560)', 'Comp, Cut-off', 'E252, E253', 'Thinh', '18/01/2026', 'Không phát hiện nợ giấu ngoài sổ'),
            ('6', 'Kiểm tra chọn mẫu các khoản chi phí phải trả (TK 335) trích trước còn dư tại thời điểm khóa sổ (VSA 330, VSA 540)', 'R&O, Val', 'E260, E270', 'Thinh', '18/01/2026', 'Chi phí trích trước có đủ căn cứ'),
            ('7', 'Đánh giá lại số dư nợ phải trả có gốc ngoại tệ tại ngày kết thúc kỳ kế toán (VSA 330, VSA 540)', 'Val', 'E 210', 'Thinh', '15/01/2026', 'Tỷ giá hạch toán đúng tỷ giá bán NH'),
            ('III', 'TRÌNH BÀY VÀ KẾT LUẬN', '', '', '', '', ''),
            ('8', 'Kiểm tra việc phân loại ngắn hạn, dài hạn và thông tin thuyết minh nợ phải trả trên BCTC (VSA 330)', 'P&D', 'E220', 'Thinh', '20/01/2026', 'Trình bày phù hợp chuẩn mực'),
            ('9', 'Tổng hợp các sai sót chưa điều chỉnh (VSA 450)', 'Val', 'E298', 'Thinh', '20/01/2026', 'Không có sai sót trọng yếu'),
        ]
    },
    'E300': {
        'title': 'CHƯƠNG TRÌNH KIỂM TOÁN THUẾ VÀ CÁC KHOẢN PHẢI NỘP NHÀ NƯỚC',
        'ref_code': 'E 320',
        'sheet_candidates': ['E 320', 'E320'],
        'items': [
            ('I', 'THỦ TỤC PHÂN TÍCH BAN ĐẦU', '', '', '', '', ''),
            ('1', 'Lập bảng tổng hợp các khoản thuế và nghĩa vụ với NSNN (TK 333), đối chiếu với Sổ cái và BCTC (VSA 330, VSA 500)', 'Comp, R&O', 'E 310', 'Thinh', '15/01/2026', 'Khớp số liệu tổng hợp'),
            ('II', 'THỦ TỤC KIỂM TRA CHI TIẾT', '', '', '', '', ''),
            ('2', 'Đối chiếu số liệu hạch toán với các tờ khai thuế định kỳ (GTGT, TNCN, TNDN tạm nộp...), kể cả tờ khai sau 31/12 (VSA 330, VSA 250)', 'Comp, Cut-off', 'E 330, E 340', 'Thinh', '17/01/2026', 'Khớp số liệu trên tờ khai thuế'),
            ('3', 'Kiểm tra việc áp dụng thuế suất và cách tính thuế đối với từng sắc thuế theo quy định hiện hành (VSA 250, VSA 330)', 'Val, Comp', 'E 341', 'Thinh', '17/01/2026', 'Áp dụng thuế suất đúng quy định'),
            ('4', 'Đối chiếu số tiền thuế đã nộp trên sổ với Giấy nộp tiền vào NSNN và Thông báo đối chiếu nghĩa vụ của Cơ quan Thuế (VSA 330)', 'C, Comp', 'E 380, E 381', 'Thinh', '18/01/2026', 'Đã nộp thuế vào NSNN đầy đủ'),
            ('5', 'Thực hiện tính toán và ước tính độc lập nghĩa vụ thuế TNDN hiện hành, rà soát chi phí không được trừ (VSA 330, VSA 520)', 'Val, Comp', 'E 382', 'Thinh', '18/01/2026', 'Chi phí không được trừ đã bóc tách'),
            ('6', 'Kiểm tra biên bản thanh tra, kiểm tra thuế trong niên độ (nếu có) và việc hạch toán kết luận xử lý thuế (VSA 250)', 'Comp, Val', 'E 383', 'Thinh', '18/01/2026', 'Đã hạch toán theo kết luận thuế'),
            ('III', 'TRÌNH BÀY VÀ KẾT LUẬN', '', '', '', '', ''),
            ('7', 'Kiểm tra việc phân loại và trình bày thuyết minh về thuế trên BCTC (VSA 330)', 'P&D', 'E 310.1, E 320', 'Thinh', '20/01/2026', 'Trình bày đầy đủ theo Thông tư 200'),
            ('8', 'Tổng hợp các sai sót chưa điều chỉnh (VSA 450)', 'Val', 'E 398', 'Thinh', '20/01/2026', 'Không có sai sót trọng yếu'),
        ]
    },
    'E400': {
        'title': 'CHƯƠNG TRÌNH KIỂM TOÁN PHẢI TRẢ NGƯỜI LAO ĐỘNG VÀ TRÍCH THEO LƯƠNG',
        'ref_code': 'E 420',
        'sheet_candidates': ['E 420', 'E420'],
        'items': [
            ('I', 'THỦ TỤC PHÂN TÍCH BAN ĐẦU', '', '', '', '', ''),
            ('1', 'Lập bảng tổng hợp nợ lương (TK 334) và bảo hiểm (TK 338), đối chiếu Sổ cái và BCTC (VSA 330, VSA 500)', 'Comp, R&O', 'E 410', 'Thinh', '15/01/2026', 'Khớp số liệu tổng hợp'),
            ('II', 'THỦ TỤC KIỂM TRA CHI TIẾT', '', '', '', '', ''),
            ('2', 'Thực hiện thủ tục phân tích biến động chi phí tiền lương theo tháng/quý hoặc lập ước tính độc lập quỹ lương (VSA 330, VSA 520)', 'Val, Comp', 'E 440', 'Thinh', '17/01/2026', 'Chi phí lương biến động hợp lý'),
            ('3', 'Chọn mẫu kiểm tra hồ sơ bảng lương, đối chiếu với hợp đồng lao động, bảng chấm công và chi tiền lương (VSA 330, VSA 530)', 'C, Val', 'E 441', 'Thinh', '17/01/2026', 'Bảng lương có ký nhận đầy đủ'),
            ('4', 'Kiểm tra việc phân bổ chi phí tiền lương và các khoản trích theo lương vào chi phí SXKD (TK 622, 627, 641, 642) (VSA 330)', 'Val, Cut-off', 'E 490', 'Thinh', '17/01/2026', 'Phân bổ chi phí phù hợp'),
            ('5', 'Đối chiếu số liệu trích nộp BHXH, BHYT, BHTN với Thông báo kết quả đóng BHXH của cơ quan BHXH (C12-TS) (VSA 330, VSA 250)', 'Comp, R&O', 'E 491', 'Thinh', '18/01/2026', 'Khớp đúng với số liệu cơ quan BHXH'),
            ('6', 'Kiểm tra tình hình chi trả tiền lương sau ngày 31/12 để xác định nợ lương thực tế và quỹ dự phòng lương (VSA 330)', 'C, Cut-off', 'E 492', 'Thinh', '18/01/2026', 'Lương đã chi trả hết quý 1'),
            ('III', 'TRÌNH BÀY VÀ KẾT LUẬN', '', '', '', '', ''),
            ('7', 'Kiểm tra tính đầy đủ của thuyết minh thu nhập của Hội đồng quản trị, Ban Giám đốc trên BCTC (VSA 550)', 'P&D', 'E 410.1, E 420', 'Thinh', '20/01/2026', 'Thuyết minh thu nhập minh bạch'),
            ('8', 'Tổng hợp các sai sót chưa điều chỉnh (VSA 450)', 'Val', 'E 498', 'Thinh', '20/01/2026', 'Không có sai sót trọng yếu'),
        ]
    },
    'F100': {
        'title': 'CHƯƠNG TRÌNH KIỂM TOÁN NGUỒN VỐN CHỦ SỞ HỮU',
        'ref_code': 'F 120',
        'sheet_candidates': ['F120', 'F 120'],
        'items': [
            ('I', 'THỦ TỤC PHÂN TÍCH BAN ĐẦU', '', '', '', '', ''),
            ('1', 'Lập bảng tổng hợp biến động nguồn vốn chủ sở hữu (TK 411, 412, 421, 418), đối chiếu Sổ cái và BCTC (VSA 330)', 'Comp, R&O', 'F110', 'Thinh', '15/01/2026', 'Khớp số liệu tổng hợp'),
            ('II', 'THỦ TỤC KIỂM TRA CHI TIẾT', '', '', '', '', ''),
            ('2', 'Kiểm tra hồ sơ pháp lý, Giấy phép ĐKKD, Điều lệ công ty và đối chiếu danh sách cổ đông / thành viên góp vốn (VSA 330, VSA 505)', 'C, R&O', 'F140', 'Thinh', '16/01/2026', 'Vốn góp đúng tiến độ cam kết'),
            ('3', 'Kiểm tra chứng từ thu tiền, tài sản góp vốn đối với các nghiệp vụ tăng, giảm vốn chủ sở hữu trong kỳ (VSA 330, VSA 530)', 'C, Val', 'F141', 'Thinh', '16/01/2026', 'Chứng từ tăng giảm vốn hợp lệ'),
            ('4', 'Đối chiếu số lợi nhuận sau thuế phát sinh trong năm giữa Báo cáo kết quả HĐKD và Bảng CĐKT (VSA 330)', 'Comp, Val', 'F130', 'Thinh', '16/01/2026', 'Khớp số LNST cả năm'),
            ('5', 'Kiểm tra tính tuân thủ pháp lý của các nghiệp vụ phân phối lợi nhuận, chia cổ tức (Biên bản họp ĐHĐCĐ/HĐQT) (VSA 330, VSA 250)', 'C, Val', 'F148', 'Thinh', '16/01/2026', 'Phân phối lợi nhuận đúng thẩm quyền'),
            ('6', 'Kiểm tra việc trích lập và sử dụng các quỹ (quỹ ĐTPT, quỹ KTPF) theo Điều lệ và quy định (VSA 330, VSA 250)', 'Val, Comp', 'F 190', 'Thinh', '16/01/2026', 'Trích lập quỹ đúng quy định'),
            ('III', 'TRÌNH BÀY VÀ KẾT LUẬN', '', '', '', '', ''),
            ('7', 'Kiểm tra việc trình bày Báo cáo biến động vốn chủ sở hữu và thuyết minh trên BCTC (VSA 330)', 'P&D', 'F120', 'Thinh', '20/01/2026', 'Trình bày phù hợp chuẩn mực'),
            ('8', 'Tổng hợp các sai sót chưa điều chỉnh (VSA 450)', 'Val', 'F 198', 'Thinh', '20/01/2026', 'Không có sai sót trọng yếu'),
        ]
    },
    'G100': {
        'title': 'CHƯƠNG TRÌNH KIỂM TOÁN DOANH THU BÁN HÀNG VÀ CUNG CẤP DỊCH VỤ',
        'ref_code': 'G 120',
        'sheet_candidates': ['G120', 'G 120'],
        'items': [
            ('I', 'THỦ TỤC PHÂN TÍCH BAN ĐẦU', '', '', '', '', ''),
            ('1', 'Lập bảng tổng hợp doanh thu theo từng nhóm hàng/dịch vụ (TK 511), đối chiếu Sổ cái và Báo cáo KQKD (VSA 330)', 'Comp, Val', 'G 110', 'Thinh', '15/01/2026', 'Khớp số liệu tổng hợp'),
            ('2', 'Thực hiện thủ tục phân tích biến động doanh thu theo tháng, theo nhóm sản phẩm và so sánh năm trước (VSA 240, VSA 520)', 'Comp, Val', 'G 140', 'Thinh', '15/01/2026', 'Doanh thu biến động phù hợp thị trường'),
            ('II', 'THỦ TỤC KIỂM TRA CHI TIẾT', '', '', '', '', ''),
            ('3', 'Đối chiếu doanh thu hạch toán kế toán với Bảng kê hóa đơn bán ra và Tờ khai thuế GTGT định kỳ (VSA 240, VSA 330, VSA 500)', 'Comp, C', 'G 141', 'Thinh', '17/01/2026', 'Khớp doanh thu kê khai thuế GTGT'),
            ('4', 'Đối chiếu doanh thu kế toán với số liệu giao hàng của bộ phận kho/vận chuyển và hợp đồng kinh tế (VSA 240, VSA 500)', 'C', 'G 150', 'Thinh', '17/01/2026', 'Khớp phiếu xuất kho giao hàng'),
            ('5', 'Chọn mẫu kiểm tra chi tiết các giao dịch ghi nhận doanh thu (Hóa đơn GTGT, Phiếu xuất kho, Biên bản bàn giao) (VSA 330, VSA 530)', 'C, Val', 'G 191.1', 'Thinh', '18/01/2026', 'Hồ sơ chứng từ đầy đủ hợp lệ'),
            ('6', 'Kiểm tra tính đúng kỳ (Cut-off) của doanh thu: Kiểm tra các hóa đơn và phiếu xuất kho trước và sau 31/12 (VSA 240, VSA 560)', 'Cut-off', 'G 194', 'Thinh', '18/01/2026', 'Không có doanh thu ghi nhận sai kỳ'),
            ('7', 'Kiểm tra các khoản giảm trừ doanh thu (chiết khấu, giảm giá, hàng trả lại) và giao dịch bán hàng bên liên quan (VSA 330, VSA 550)', 'Val, C', 'G 151, G 152', 'Thinh', '18/01/2026', 'Giảm trừ có đủ căn cứ pháp lý'),
            ('III', 'TRÌNH BÀY VÀ KẾT LUẬN', '', '', '', '', ''),
            ('8', 'Kiểm tra việc phân loại và trình bày thuyết minh doanh thu trên BCTC (VSA 330)', 'P&D', 'G120', 'Thinh', '20/01/2026', 'Thuyết minh đầy đủ theo VAS'),
            ('9', 'Tổng hợp các sai sót chưa điều chỉnh (VSA 450)', 'Val', 'G 195', 'Thinh', '20/01/2026', 'Không có sai sót trọng yếu'),
        ]
    },
    'G200': {
        'title': 'CHƯƠNG TRÌNH KIỂM TOÁN GIÁ VỐN HÀNG BÁN VÀ CHI PHÍ HOẠT ĐỘNG',
        'ref_code': 'G 220',
        'sheet_candidates': ['G220', 'G 220'],
        'items': [
            ('I', 'THỦ TỤC PHÂN TÍCH BAN ĐẦU', '', '', '', '', ''),
            ('1', 'Lập bảng tổng hợp giá vốn hàng bán (TK 632) và chi phí hoạt động (641, 642, 635), đối chiếu Sổ cái và KQKD (VSA 330)', 'Comp, Val', 'G210, G310, G410', 'Thinh', '15/01/2026', 'Khớp số liệu tổng hợp'),
            ('2', 'Thực hiện thủ tục phân tích biến động giá vốn và tỷ lệ lãi gộp (Gross Margin Analysis) so với doanh thu và kỳ trước (VSA 330, VSA 520)', 'Comp, Val', 'G240', 'Thinh', '15/01/2026', 'Tỷ lệ lãi gộp ổn định'),
            ('II', 'THỦ TỤC KIỂM TRA CHI TIẾT', '', '', '', '', ''),
            ('3', 'Kiểm tra tính phù hợp giữa việc ghi nhận doanh thu và ghi nhận giá vốn hàng bán (Matching principle) (VSA 330, VSA 520)', 'Comp, Val', 'G241', 'Thinh', '17/01/2026', 'Ghi nhận giá vốn tương ứng doanh thu'),
            ('4', 'Đối chiếu giá vốn hàng bán với số liệu xuất kho trên Báo cáo Nhập-Xuất-Tồn kho (VSA 330)', 'C, Comp', 'G242', 'Thinh', '17/01/2026', 'Khớp giá vốn xuất kho'),
            ('5', 'Kiểm tra tính đúng kỳ (Cut-off) của giá vốn hàng bán trước và sau ngày khóa sổ 31/12 (VSA 330, VSA 560)', 'Cut-off', 'G250', 'Thinh', '18/01/2026', 'Không có giá vốn sai kỳ'),
            ('6', 'Kiểm tra các nghiệp vụ giá vốn bất thường (hao hụt vượt định mức, trích lập dự phòng HTK, ngừng sản xuất) (VSA 330, VSA 530)', 'Val, C', 'G260', 'Thinh', '18/01/2026', 'Không có hao hụt bất thường'),
            ('7', 'Thực hiện thủ tục phân tích biến động chi phí bán hàng & QLDN theo từng khoản mục chi phí và theo thời gian (VSA 330, VSA 520)', 'Comp, Val', 'G340, G440', 'Thinh', '18/01/2026', 'Chi phí biến động phù hợp quy mô'),
            ('8', 'Đối chiếu chéo các khoản mục chi phí với các phần hành liên quan (lương, khấu hao, trả trước, trích trước) (VSA 330)', 'Comp', 'G340, G440', 'Thinh', '18/01/2026', 'Khớp chéo với các phần hành D, E'),
            ('9', 'Chọn mẫu kiểm tra hóa đơn, chứng từ chi phí bán hàng và chi phí quản lý phát sinh trong kỳ (VSA 330, VSA 530)', 'C, Val', 'G390, G490', 'Thinh', '19/01/2026', 'Hóa đơn chứng từ hợp lệ'),
            ('10', 'Đối chiếu doanh thu tài chính và chi phí tài chính (lãi vay) với số dư tiền gửi và nợ vay bình quân (VSA 330, VSA 520)', 'Val, Comp', 'G220', 'Thinh', '19/01/2026', 'Lãi vay khớp với dư nợ vay'),
            ('11', 'Kiểm tra các khoản thu nhập khác (TK 711) và chi phí khác (TK 811), thanh lý tài sản, xử lý nợ (VSA 330)', 'C, Val', 'G441', 'Thinh', '19/01/2026', 'Chứng từ thu nhập khác hợp lệ'),
            ('III', 'TRÌNH BÀY VÀ KẾT LUẬN', '', '', '', '', ''),
            ('12', 'Kiểm tra việc phân loại và trình bày các khoản chi phí trên BCTC (VSA 330)', 'P&D', 'G220, G320', 'Thinh', '20/01/2026', 'Trình bày phù hợp chuẩn mực'),
            ('13', 'Tổng hợp các sai sót chưa điều chỉnh (VSA 450)', 'Val', 'G395, G495', 'Thinh', '20/01/2026', 'Không có sai sót trọng yếu'),
        ]
    },
}

def style_cell(cell, font, alignment, fill=None, border=None):
    if font: cell.font = font
    if alignment: cell.alignment = alignment
    if fill: cell.fill = fill
    if border: cell.border = border

def inject_procedures_into_file(code, filename, info):
    filepath = os.path.join(TARGET_DIR, filename)
    if not os.path.exists(filepath):
        print(f"[SKIP] File not found: {filepath}")
        return False

    wb = openpyxl.load_workbook(filepath)
    target_sheet_name = None
    for candidate in info['sheet_candidates']:
        if candidate in wb.sheetnames:
            target_sheet_name = candidate
            break

    if not target_sheet_name:
        print(f"[SKIP] No candidate sheet found in {filename} for {code}")
        return False

    ws = wb[target_sheet_name]

    # Kiểm tra xem sheet đã có bảng thủ tục chưa để tránh chèn đè nhiều lần
    has_procedures = False
    for r in range(1, min(25, ws.max_row + 1)):
        for c in range(1, 6):
            v = str(ws.cell(r, c).value or '').lower()
            if 'chương trình kiểm toán' in v or 'thủ tục kiểm toán' in v:
                has_procedures = True
                break
        if has_procedures:
            break

    if has_procedures:
        print(f"[EXISTS] {filename} [{target_sheet_name}] already has audit procedures table. Skipping insert.")
        return True

    # Xác định font chủ đạo của sheet
    doc_font_name = 'Cambria'
    for r in range(1, 10):
        for c in range(1, 6):
            cell = ws.cell(r, c)
            if cell.value and cell.font and cell.font.name:
                doc_font_name = cell.font.name
                break

    # Cấu hình Style chuẩn mực
    font_section_title = Font(name=doc_font_name, size=11, bold=True, color="002060")
    font_tbl_header = Font(name=doc_font_name, size=10, bold=True, color="000000")
    font_cat_row = Font(name=doc_font_name, size=10, bold=True, color="000000")
    font_body = Font(name=doc_font_name, size=10, bold=False, color="000000")
    font_ref = Font(name=doc_font_name, size=10, bold=True, color="002060")

    fill_header = PatternFill(start_color="F2F2F2", end_color="F2F2F2", fill_type="solid")
    fill_cat = PatternFill(start_color="F9FAFB", end_color="F9FAFB", fill_type="solid")

    thin_border_side = Side(border_style="thin", color="000000")
    double_bottom_side = Side(border_style="double", color="000000")

    cell_border = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)
    tbl_bottom_border = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=double_bottom_side)

    align_center = Alignment(horizontal="center", vertical="center", wrap_text=True)
    align_left = Alignment(horizontal="left", vertical="center", wrap_text=True)

    items = info['items']
    num_rows_to_insert = len(items) + 6 # 1 title + 1 header + items + 2 spacing

    start_insert_row = 7
    ws.insert_rows(start_insert_row, num_rows_to_insert)

    # 1. Tiêu đề phần I
    curr_r = start_insert_row
    ws.row_dimensions[curr_r].height = 24
    cell_title = ws.cell(curr_r, 1, f"I. {info['title']}")
    style_cell(cell_title, font_section_title, align_left)
    curr_r += 1

    # 2. Header bảng thủ tục
    headers = [
        ("STT", 6, align_center),
        ("THỦ TỤC KIỂM TOÁN (Theo chuẩn VSA & VACPA)", 48, align_left),
        ("CSDL", 10, align_center),
        ("THAM CHIẾU", 14, align_center),
        ("NGƯỜI TH", 11, align_center),
        ("NGÀY HT", 12, align_center),
        ("KẾT LUẬN / GHI CHÚ", 28, align_left)
    ]

    ws.row_dimensions[curr_r].height = 26
    for c_idx, (h_title, min_w, h_align) in enumerate(headers, start=1):
        c = ws.cell(curr_r, c_idx, h_title)
        style_cell(c, font_tbl_header, align_center, fill_header, cell_border)
        # Điều chỉnh độ rộng cột an toàn nếu cột chưa đủ rộng
        col_letter = get_column_letter(c_idx)
        current_w = ws.column_dimensions[col_letter].width or 10
        if current_w < min_w:
            ws.column_dimensions[col_letter].width = min_w

    curr_r += 1

    # 3. Điền từng thủ tục kiểm toán
    for item_idx, (stt, proc_text, csdl, ref_glv, performer, comp_date, note) in enumerate(items):
        is_category = (csdl == '' and ref_glv == '')
        is_last = (item_idx == len(items) - 1)
        active_border = tbl_bottom_border if is_last else cell_border

        ws.row_dimensions[curr_r].height = 20 if is_category else 24

        c1 = ws.cell(curr_r, 1, stt)
        c2 = ws.cell(curr_r, 2, proc_text if is_category else f"  {proc_text}")
        c3 = ws.cell(curr_r, 3, csdl)
        c4 = ws.cell(curr_r, 4, ref_glv)
        c5 = ws.cell(curr_r, 5, performer)
        c6 = ws.cell(curr_r, 6, comp_date)
        c7 = ws.cell(curr_r, 7, note)

        if is_category:
            for c in [c1, c2, c3, c4, c5, c6, c7]:
                style_cell(c, font_cat_row, align_left if c == c2 else align_center, fill_cat, active_border)
        else:
            style_cell(c1, font_body, align_center, border=active_border)
            style_cell(c2, font_body, align_left, border=active_border)
            style_cell(c3, font_body, align_center, border=active_border)
            style_cell(c4, font_ref, align_center, border=active_border)
            style_cell(c5, font_body, align_center, border=active_border)
            style_cell(c6, font_body, align_center, border=active_border)
            style_cell(c7, font_body, align_left, border=active_border)

        curr_r += 1

    # Cách dòng và thêm tiêu đề phần II cho nội dung thuyết minh phía dưới
    curr_r += 1
    ws.row_dimensions[curr_r].height = 24
    cell_p2 = ws.cell(curr_r, 1, "II. THÔNG TIN THUYẾT MINH BÁO CÁO TÀI CHÍNH & CHÍNH SÁCH KẾ TOÁN")
    style_cell(cell_p2, font_section_title, align_left)

    wb.save(filepath)
    print(f"[SUCCESS] Injected {len(items)} procedures into {filename} [{target_sheet_name}]")
    return True

def main():
    print("=== BẮT ĐẦU TÍCH HỢP THỦ TỤC KIỂM TOÁN CHUẨN VACPA VÀO GLV MAU ===")
    files_map = [
        ('D100', 'D100 - Tien - Mau 2024 - Thinh.xlsx'),
        ('D200', 'D200 - Dau tu - ABC 2020.xlsx'),
        ('D300', 'D300 - Phai thu - Mau 2025 - Thinh.xlsx'),
        ('D500', 'D500 - HTK - Mau 2024 - Thinh.xlsx'),
        ('D600', 'D600 - Phan bo - Mau 2024 - Thinh.xlsx'),
        ('D700', 'D700 - Tai san - Mau 2024 - Thinh.xlsx'),
        ('E100', 'E100 - Vay - Mau 2024 - Thinh.xlsx'),
        ('E200', 'E200 - Phai tra - Mau 2024 - Thinh.xlsx'),
        ('E300', 'E300 - Thue - Mau 2024 - Thinh.xlsx'),
        ('E400', 'E400 - Luong - Mau 2025 - Thinh.xlsx'),
        ('F100', 'F100 - Von - Mau 2024 - Thinh.xlsx'),
        ('G100', 'G100 - Doanh thu - Mau 2025- Thinh.xlsx'),
        ('G200', 'G200 - 300 - 400 -  Mau 2025 - Thinh.xlsx'),
    ]

    success_count = 0
    for code, filename in files_map:
        info = PROCEDURES_DATABASE.get(code)
        if not info:
            continue
        res = inject_procedures_into_file(code, filename, info)
        if res:
            success_count += 1

    print(f"\n=== HOÀN TẤT: Đã cập nhật thành công {success_count}/{len(files_map)} file GLV ===")

if __name__ == '__main__':
    main()
