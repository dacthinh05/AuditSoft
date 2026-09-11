# Kế Hoạch Chuẩn Hóa & Tự Động Hóa 13 Giấy Làm Việc Kiểm Toán (GLV Working Papers Master Plan)

> **Mã kế hoạch:** `plans/260910-1752-wp-automation-master/`
> **Phạm vi:** 13 file GLV thực địa trong `GLV MAU` (D100 -> G200).
> **Nguyên tắc kỹ thuật:** Bảo toàn 100% định dạng, công thức gốc, font chữ Cambria; tận dụng tối đa dữ liệu có sẵn từ Bảng Cân Đối Số Phát Sinh (CDFS) và Sổ Nhật Ký Chung (NKC).

---

## 1. Lộ Trình 3 Đợt Triển Khai (3 Waves Roadmap)

```mermaid
flowchart TD
  subgraph Wave1 ["ĐỢT 1: CORE PHẦN HÀNH TRỌNG YẾU (70% Khối lượng)"]
    W1_1["Plan 01: D100 - Tiền & Tương đương tiền (Cut-off + Bất thường)"]
    W1_2["Plan 02: G100 - Doanh thu bán hàng (Đối chiếu 12M + Mẫu + Cut-off)"]
    W1_3["Plan 03: G200 - Giá vốn & Chi phí 641/642 (Phân tích + Mẫu chi phí)"]
  end

  subgraph Wave2 ["ĐỢT 2: CÔNG NỢ, HÀNG TỒN KHO & NGHĨA VỤ THUẾ"]
    W2_1["Plan 04: D300 - Phải thu khách hàng (Tổng hợp 131 + Thư xác nhận)"]
    W2_2["Plan 05: E200 - Phải trả người bán (Tổng hợp 331 + Nợ ngoài sổ)"]
    W2_3["Plan 06: D500 - Hàng tồn kho (Đối chiếu NXT 152-156 + Cut-off mua)"]
    W2_4["Plan 07: E300 - Thuế & Các khoản nộp NSNN (GTGT 380 + TNDN 382)"]
  end

  subgraph Wave3 ["ĐỢT 3: TÀI SẢN, NGUỒN VỐN & CÁC KHOẢN MỤC KHÁC"]
    W3_1["Plan 08: D700 - TSCĐ & XDCB (Ước tính khấu hao độc lập VSA 520)"]
    W3_2["Plan 09: D600 - Chi phí trả trước (Phân bổ 242)"]
    W3_3["Plan 10: E100 - Vay & Nợ thuê tài chính (Ước tính lãi vay 635)"]
    W3_4["Plan 11: E400 - Tiền lương & BHXH (Quỹ lương 334 vs Chi phí)"]
    W3_5["Plan 12: F100 - Nguồn vốn chủ sở hữu (Biến động 411, 421)"]
    W3_6["Plan 13: D200 - Đầu tư tài chính (Số dư 121, 221 & Dự phòng)"]
  end

  Wave1 --> Wave2 --> Wave3
```

---

## 2. Danh Sách Các File Kế Hoạch Chi Tiết Theo Từng Phase

- `phase-01-wave1-cash-revenue-expenses.md`: Kế hoạch tự động hóa cho **D100, G100, G200** (D190, D191.2, D195, G152, G191.1, G195, G210, G310, G410, G353, G453).
- `phase-02-wave2-receivables-payables-inventory-tax.md`: Kế hoạch tự động hóa cho **D300, E200, D500, E300** (D351, D390, E250, E295, D550, D595, E380, E382).
- `phase-03-wave3-assets-liabilities-equity-investments.md`: Kế hoạch tự động hóa cho **D700, D600, E100, E400, F100, D200** (D790, D792, D690, D693, E190, E191, E490, E491, F148, F190, D210).

---

## 3. Tiêu Chí Nghiệm Thu Chung
1. Tự động hóa điền đúng dữ liệu vào các sheet mục tiêu mà không phá hỏng công thức liên kết sẵn có.
2. Bộ kiểm thử `vitest run tests/workingpaper.test.ts` xuất đủ 12/12 file đạt 100% thành công.
3. Không làm tăng kích thước file bất thường, tốc độ chạy sinh toàn bộ bộ hồ sơ dưới 10 giây.
