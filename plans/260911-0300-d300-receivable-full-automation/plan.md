# Plan: Hoàn Thiện Tự Động Hóa 6 Sheet Trọng Yếu Của Giấy Làm Việc Phải Thu Khách Hàng (D300)

## 1. Bối Cảnh & Yêu Cầu Cốt Lõi (Context & Requirements)
Người dùng yêu cầu hoàn thiện đầy đủ dữ liệu cho 6 sheet trọng yếu trong tệp giấy làm việc **`D300 - Phai thu - Mau 2025 - Thinh.xlsx`**:
1. **Sheet `D 341` (Bút toán điều chỉnh AJE)**: Lấy từ chênh lệch/bút toán điều chỉnh khi đối chiếu NKC (`ctx.adjustingEntries` liên quan TK 131), điền đầy đủ số tiền và chỉ tiêu CĐKT.
2. **Sheet `D 351.1` (Đợt 1 - 30/06)**: Tổng hợp số dư công nợ khách hàng Đợt 1 nếu bảng CĐSPS / Sổ chi tiết có số liệu.
3. **Sheet `D 351.2` (Đợt 2 - 31/12)**: Tổng hợp số dư công nợ khách hàng cả năm từ CDFS/NKC (Mã KH, Tên KH, Dư Nợ, Dư Có, Ref `D 352`, AJE điều chỉnh và Số dư sau ĐC).
4. **Sheet `D 352` (Theo dõi Thư xác nhận công nợ)**: Lấy danh sách khách hàng từ `D 351.2` chuyển sang, điền số dư cần xác nhận và cột theo dõi thu tiền sau niên độ.
5. **Sheet `D 390` (Phân tích đối ứng TK 131)**: Tổng hợp cơ cấu tài khoản đối ứng Nợ 131 (511, 33311...) và Có 131 (111, 112, 521...), gắn tham chiếu REF chuẩn mực (`G 100`, `E 300`, `D 100`), bảo toàn tuyệt đối dòng `SUM` hàng 23.
6. **Sheet `D 391` (Chọn mẫu VSA 530)**: Bốc mẫu kiểm tra cơ bản nghiệp vụ phát sinh Nợ 131 (bán hàng) và Có 131 (thu tiền).
7. **Bảo toàn định dạng OpenXML**: Chuyển đổi sang `OpenXmlPackageEditor` để không bị lỗi cảnh báo Repair của Excel.

## 2. Mục Tiêu (Outcome)
- Xuất file `D300` hoàn thiện cả 6 sheets (`D 341`, `D 351.1`, `D 351.2`, `D 352`, `D 390`, `D 391`) cùng sheet `ADD` và `D 310`.
- Khớp 100% dòng, cột và bảo toàn nguyên vẹn công thức có sẵn trên template.
- Mở file bằng Microsoft Excel mượt mà, không xuất hiện bảng cảnh báo lỗi nội dung.

## 3. Các Giai Đoạn Triển Khai (Phases)

- [x] **Phase 1: Chuyển đổi `D300_ReceivableFiller.ts` sang `OpenXmlPackageEditor` & Đấu nối `WorkingPaperGenerator.ts`**
  - Cập nhật `WorkingPaperGenerator.ts` đưa `D300` vào nhóm `isOpenXml = true` (tương tự như `G100`, `D200`, `A - B - H`).
  - Đảm bảo file D300 xuất ra không bị mất `drawing` hay `externalLinks`.

- [x] **Phase 2: Triển khai logic điền `D 341` (AJE) và `D 390` (Đối ứng TK 131 & REF)**
  - `D 341`: Lấy `ctx.adjustingEntries` lọc các bút toán Nợ 131 hoặc Có 131, điền từ hàng 14 (hoặc điền "Không phát sinh" nếu rỗng).
  - `D 390`: Quét NKC thống kê đối ứng Nợ 131 (511, 33311, khác) và Có 131 (111, 112, khác), tính tỷ trọng và điền đúng ô, gắn REF `G 100`, `E 300`, `D 100`.

- [x] **Phase 3: Triển khai logic điền `D 351.1`, `D 351.2` và liên kết sang `D 352` (Thư xác nhận)**
  - `D 351.1`: Phân tích số dư khách hàng Đợt 1 (30/06) từ các giao dịch 6 tháng đầu năm.
  - `D 351.2`: Tổng hợp số dư khách hàng Đợt 2 (31/12) cả năm từ CDFS/NKC.
  - `D 352`: Lấy danh sách khách hàng từ `D 351.2` đổ vào bảng theo dõi TXN hàng 16+, điền mã, tên, số dư và trạng thái xác nhận.

- [x] **Phase 4: Triển khai logic bốc mẫu VSA 530 trên `D 391` & Kiểm thử toàn diện**
  - `D 391`: Chọn mẫu giao dịch Nợ 131 và Có 131 giá trị lớn + ngẫu nhiên đại diện, điền từ hàng 17 với tickmark `✓`/`P`.
  - Viết unit test tự động kiểm tra đủ 6 sheets trên file D300 (`tests/d300-receivable-fill.test.ts`).
  - Chạy `npx tsc -p tsconfig.web.json --noEmit` & `vitest run`.
