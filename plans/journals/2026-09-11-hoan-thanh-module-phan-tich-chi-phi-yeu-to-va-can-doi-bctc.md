# Nhật Ký Kỹ Thuật: Hoàn Thành Module Phân Tích Chi Phí Theo Yếu Tố 12M & Bảng Cân Đối Thuyết Minh BCTC

- **Ngày thực hiện:** 2026-09-11
- **Phân hệ:** Analytics VSA 520 & Master Working Paper A-B-H (Mục Thuyết minh BCTC VAS 01 / TT 200)
- **Tài liệu tham chiếu:** Screenshot Bảng kiểm tra cân đối Thuyết minh Chi phí theo Yếu tố (Dòng 188-204, YẾU TỐ CHI PHÍ = 0).

## 1. Thành Tựu Kỹ Thuật
1. **Module lõi `ExpenseByNatureEngine.ts`:**
   - Bóc tách tự động 5 yếu tố chi phí qua 12 tháng:
     * `NVL`: Nợ 621, 6272, 6412, 6422, hoặc Có 152.
     * `Nhân công`: Nợ 622, 6271, 6411, 6421, hoặc Có 334, 338.
     * `Khấu hao TSCĐ`: Có 214 hoặc Nợ 6274, 6414, 6424.
     * `Dịch vụ mua ngoài`: Nợ 6277, 6417, 6427 (điện, nước, viễn thông...).
     * `Chi phí khác bằng tiền`: Nợ 6278, 6418, 6428.
   - Loại trừ triệt để các bút toán kết chuyển 911 và kết chuyển nội bộ giá thành (154/62x, 155/154, 632/155) để chống tính trùng lặp chi phí đầu vào.
   - Thu thập tổng chi phí kết chuyển sang 911 (`totalCogs632 + totalSelling641 + totalAdmin642`).
   - Tự động lấy số dư đầu kỳ và cuối kỳ của TK 154 (Dở dang) và TK 155 (Thành phẩm) để tính $\Delta 154$ và $\Delta 155$.
   - Tính toán phương trình cân đối:
     $$\text{Tổng CPSXKD tính toán} = \text{5 Yếu tố} + \text{Thương mại 156} + (154\text{ĐK} - 154\text{CK}) + (155\text{ĐK} - 155\text{CK})$$
     $$\rightarrow \text{Độ lệch (YẾU TỐ CHI PHÍ)} = \text{Tổng CPSXKD tính toán} - \text{Tổng kết chuyển 911} = \mathbf{0\ \text{đ}}!$$
2. **Giao diện Dashboard VSA 520 (`ExpenseByNatureTable.tsx`):**
   - Đặt ngay trong Tab Phân Tích Sổ NKC (`GlAnalyticsTab.tsx`) hiển thị 2 khối:
     * Khối 1: Ma trận 12 tháng x 5 yếu tố chi phí.
     * Khối 2: Bảng đối chiếu Thuyết minh BCTC khớp 100% format ảnh của KTV, có badge xanh `YẾU TỐ CHI PHÍ: 0 đ (Khớp Chuẩn 100%)`.
3. **Tự động điền File Master `A - B - H - Mau 2025 - Thinh.xlsx`:**
   - Trong `ABH_MasterFiller.ts`, tự động điền các dòng 187 đến 195 của Sheet `THUYET-MINH` theo 5 yếu tố và biến động kho, tự động ra kết quả độ lệch $= 0$.

## 2. Kiểm Thử & Nghiệm Thu
- `tests/expense-by-nature.test.ts`: 2/2 tests pass (kiểm tra phân loại 5 yếu tố và cân đối độ lệch = 0).
- `tests/workingpaper.test.ts`: Pass 100%.
- `npm run typecheck`: 0 lỗi TypeScript trên cả 3 tsconfig.
