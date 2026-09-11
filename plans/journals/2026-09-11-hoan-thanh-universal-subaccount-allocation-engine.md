# Nhật Ký Kỹ Thuật: Hoàn Thành Universal Subaccount Allocation Engine (Bóc Tách Phổ Quát Mọi Loại Hình DN)

- **Ngày thực hiện:** 2026-09-11
- **Phân hệ:** Working Paper Auto-Fill Generator (Universal Engine)
- **Vấn đề giải quyết:** Xóa bỏ rủi ro hardcode mã tài khoản; tự động thích ứng với mọi cách đặt mã con của doanh nghiệp (FDI, TT 200, TT 133, MISA, FAST) và mọi số lượng ngân hàng/khoản vay phát sinh thực tế.

## 1. Thành Tựu Kỹ Thuật
1. **Module lõi `subAccountResolver.ts`:**
   - Xây dựng thuật toán `resolveSubAccountAllocation()`:
     * Nhận diện cây tài khoản con linh hoạt (`1121TCB`, `11211`, `112.VCB`...).
     * Tự động sắp xếp giảm dần theo quy mô số dư thực tế từ CDFS.
     * **Thuật toán Pareto thông minh:**
       - Nếu số lượng $\le \text{maxRows}$: Điền 1:1 đủ các tài khoản, các dòng còn lại đánh dấu `isEmpty: true` để xóa trắng hoàn toàn dữ liệu mẫu cũ (*Shinhan, IVB, HUANAN*).
       - Nếu số lượng $> \text{maxRows}$: Điền $(\text{maxRows} - 1)$ tài khoản lớn nhất; dòng cuối cùng tự động gom toàn bộ các tài khoản còn lại thành dòng `"Các tài khoản khác"` với số dư bằng tổng số dư của nhóm còn lại, đảm bảo dòng tổng cộng `SUM` luôn khớp chuẩn 100% với Sổ Cái mà không làm vỡ form Excel.
2. **Tích hợp sâu vào các phần hành:**
   - `D100_CashFiller.ts`: Tự động phân bổ linh hoạt Tiền gửi ngân hàng (3 dòng 14-16) và Tiền gửi có kỳ hạn (2 dòng 19-20).
   - `E100_BorrowingFiller.ts`: Tự động phân bổ linh hoạt Vay ngắn hạn (2 dòng 11-12) và Vay dài hạn (2 dòng 15-16).
   - `E400_PayrollFiller.ts`: Tự động thích ứng có `3342` (Lao động nước ngoài) hoặc chỉ có `334` chung.
3. **Kiểm thử toàn diện:**
   - Tạo bộ unit test `tests/subaccount-resolver.test.ts` kiểm thử 5 kịch bản: ít hơn số dòng, bằng số dòng, nhiều hơn số dòng (gom Pareto), mã dạng chữ/số/ký tự đặc biệt, và chiều số dư Có (Credit).
   - `npm run typecheck`: 0 lỗi.
   - `tests/workingpaper.test.ts`: Pass 100%.
