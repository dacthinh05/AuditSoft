---
title: "Phase 3: Hoàn Thiện Nhóm Công Nợ & Hàng Tồn Kho D300, E200, D500"
description: "Tự động phân tích tuổi nợ D351.1, lập danh sách thư xác nhận D352/E252, tìm kiếm nợ ngoài sổ E290 và lập Bảng Nhập - Xuất - Tồn kho D550."
status: completed
priority: P1
effort: "45m"
tags: [workingpaper, receivables, payables, inventory, aging, confirmation, nxt]
---

# Phase 3: Hoàn Thiện Nhóm Công Nợ & Hàng Tồn Kho D300, E200, D500

## Mục Tiêu
Nâng cao chất lượng kiểm toán của 3 phần hành có rủi ro gian lận và sai sót cao nhất:
1. `D300`: Phải thu khách hàng - Bổ sung phân tích tuổi nợ (`D351.1`) và danh sách chọn mẫu gửi thư xác nhận (`D352`).
2. `E200`: Phải trả người bán - Bổ sung công nợ theo nhà cung cấp (`E250.2`), danh sách thư xác nhận (`E252`) và thủ tục tìm kiếm nợ chưa ghi nhận (`E290`).
3. `D500`: Hàng tồn kho - Bổ sung Bảng tổng hợp Nhập - Xuất - Tồn kho (`D550`) và chi phí sản xuất dở dang 154 (`D553`).

## Thiết Kế Kỹ Thuật

### 1. `src/domain/workingpaper/fillers/D300_ReceivableFiller.ts`
- **Sheet `D351.1` (Bảng phân tích tuổi nợ phải thu 131):**
  - Quét các giao dịch Nợ 131 còn dư cuối kỳ theo từng đối tượng khách hàng.
  - Tính số ngày công nợ dựa trên ngày chứng từ phát sinh gần nhất so với ngày khóa sổ (31/12):
    * Trong hạn (< 30 ngày)
    * Quá hạn 1 - 30 ngày
    * Quá hạn 31 - 90 ngày
    * Quá hạn 91 - 180 ngày
    * Quá hạn 181 - 365 ngày
    * Quá hạn trên 1 năm (cần trích lập dự phòng 2293)
  - Điền vào bảng tuổi nợ chuẩn VACPA.
- **Sheet `D352` (Tổng hợp kết quả gửi thư xác nhận nợ phải thu):**
  - Lấy Top khách hàng có số dư nợ lớn nhất chiếm 70% tổng dư nợ (nguyên tắc 70/30).
  - Điền: Tên KH, Mã số, Địa chỉ (nếu có trong NKC), Số dư theo sổ, Số tiền chọn gửi xác nhận, Trạng thái (Đang chờ hồi âm / Khớp đúng).

### 2. `src/domain/workingpaper/fillers/E200_PayableFiller.ts`
- **Sheet `E250.2` (Tổng hợp công nợ phải trả theo nhà cung cấp):**
  - Tổng hợp số dư Có TK 331 theo từng mã đối tượng nhà cung cấp.
  - Phân loại: Dư Có (Phải trả người bán), Dư Nợ (Trả trước cho người bán).
- **Sheet `E252` (Tổng hợp gửi thư xác nhận công nợ phải trả):**
  - Lấy Top các nhà cung cấp có doanh số mua hàng lớn nhất trong năm (kể cả số dư cuối kỳ nhỏ hoặc bằng 0 - thủ tục phát hiện nợ giấu giếm theo VSA 500).
- **Sheet `E290` (Tìm kiếm nợ chưa ghi nhận / Nợ ngoài sổ):**
  - Quét các khoản thanh toán bằng tiền mặt/tiền gửi trong tháng 1 và tháng 2 năm sau (sau ngày 31/12).
  - Kiểm tra xem hóa đơn/dịch vụ phát sinh trong năm cũ nhưng chưa ghi nhận Nợ 331 vào 31/12.

### 3. `src/domain/workingpaper/fillers/D500_InventoryFiller.ts`
- **Sheet `D550` (Bảng tổng hợp Nhập - Xuất - Tồn kho theo tài khoản):**
  - Lấy số dư đầu kỳ (DK), số phát sinh Nợ (Nhập trong kỳ), số phát sinh Có (Xuất trong kỳ) và số dư cuối kỳ (CK) cho các tài khoản:
    * TK 152: Nguyên liệu, vật liệu
    * TK 153: Công cụ, dụng cụ
    * TK 154: Chi phí sản xuất, kinh doanh dở dang
    * TK 155: Thành phẩm
    * TK 156: Hàng hóa (1561 giá mua, 1562 chi phí thu mua)
    * TK 157: Hàng gửi đi bán
  - Đối chiếu tổng phát sinh Nhập/Xuất với Sổ Cái và Báo cáo KQKD (Giá vốn 632).
- **Sheet `D553` (Chi phí sản xuất dở dang 154):**
  - Bóc tách chi phí dở dang 154 theo các yếu tố NVL (621), Nhân công (622), SXC (627) kết chuyển sang.

## Files Thay Đổi
- `src/domain/workingpaper/fillers/D300_ReceivableFiller.ts`
- `src/domain/workingpaper/fillers/E200_PayableFiller.ts`
- `src/domain/workingpaper/fillers/D500_InventoryFiller.ts`

## Tiêu Chí Nghiệm Thu
- [ ] Bảng tuổi nợ `D351.1` được phân loại đúng các khoảng thời gian quá hạn.
- [ ] Danh sách thư xác nhận `D352` và `E252` chọn đúng các đối tác trọng yếu.
- [ ] Bảng NXT `D550` khớp đúng 100% với số liệu trên Bảng CĐSPS.
