# Journal: Lập Kế Hoạch Phân Hệ #08 Rà Soát Rủi Ro Chi Phí Thuế (Ngưỡng Tiền Mặt 5 Triệu Mới NĐ 181/2025 & 20 Triệu Cũ)

- **Date**: 2026-09-10
- **Author**: AuditSoft Engineering
- **Plan**: `plans/260910-0946-cash-tax-risk-scanner-5m` (Validated OK, 4 phases)

## 1. Bối Cảnh Nghiệp Vụ & Phản Hồi Từ Người Dùng
Người dùng chỉ ra điểm chưa ổn trên thẻ module #08 Lộ trình: hiện tại ghi cứng mốc "chi tiền mặt >= 20 triệu". Theo quy định mới nhất của **Luật Thuế GTGT 2024 (Luật số 48/2024/QH15)** và **Nghị định 181/2025/NĐ-CP** (áp dụng từ 01/07/2025), ngưỡng thanh toán không dùng tiền mặt đã siết chặt xuống từ **5 triệu đồng trở lên**. Bất kỳ khoản chi tiền mặt nào $\ge 5$ triệu cho hàng hóa, dịch vụ đều bị loại thuế GTGT đầu vào và bị loại khỏi chi phí được trừ khi tính thuế TNDN (điều chỉnh tăng Chỉ tiêu B4 trên Tờ khai 03/TNDN).

## 2. Giải Pháp Quy Hoạch & Thiết Kế Kiến Trúc
Kế hoạch triển khai chia làm 4 giai đoạn cụ thể:
1. **Giai đoạn 1**: Cập nhật định nghĩa module #08 trong `modulesRegistry.ts`, bổ sung nhãn `QUY ĐỊNH MỚI NĐ 181`, hỗ trợ song song mốc 5 triệu mới và 20 triệu cũ, thêm `ViewKey 'taxrisk'`, kết nối điều hướng.
2. **Giai đoạn 2**: Xây dựng domain engine `CashTaxRiskScanner`:
   - Quét chứng từ chi tiền mặt đơn lẻ $\ge 5$ triệu (hoặc $\ge 20$ triệu).
   - Thuật toán gom nhóm phát hiện chia nhỏ / xé phiếu chi trong ngày cùng nhà cung cấp có tổng $\ge$ ngưỡng.
   - Loại trừ nghiệp vụ nộp tiền vào tài khoản ngân hàng (Nợ 112 / Có 111).
   - Ước tính tổng chi phí bị loại trừ Chỉ tiêu B4 và thuế TNDN tăng thêm (20%).
3. **Giai đoạn 3**: Xây dựng giao diện `TaxRiskScannerPage`:
   - 4 Thẻ KPI tóm tắt rủi ro chuẩn Enterprise SaaS.
   - Thanh chuyển đổi ngưỡng quét 5tr / 20tr / Tùy chỉnh.
   - Bảng kê chi tiết từng dòng bút toán vi phạm.
   - Tính năng Xuất Excel bảng kê rủi ro thuế phục vụ đính kèm hồ sơ kiểm toán.
4. **Giai đoạn 4**: Kiểm thử đơn vị toàn diện, bảo đảm 100% test suite, typecheck và build production thành công.
