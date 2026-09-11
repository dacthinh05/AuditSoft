---
title: "Phân Hệ #08: Rà Soát Chi Phí Rủi Ro Thuế & B4 QTT 03/TNDN (Ngưỡng Chi Tiền Mặt 5 Triệu Mới NĐ 181/2025 & 20 Triệu Cũ)"
description: "Xây dựng phân hệ rà soát rủi ro chi phí thuế: phát hiện chi tiền mặt >= 5 triệu theo Luật Thuế GTGT 2024 / Nghị định 181/2025 và mốc 20 triệu cũ, phát hiện chia nhỏ phiếu chi trong ngày, tự động ước tính số tiền loại trừ Chỉ tiêu B4 trên tờ khai 03/TNDN và xuất file Excel."
status: completed
priority: P1
effort: "1.5d"
branch: main
tags: [feature, tax, risks, audit, excel]
blockedBy: []
blocks: []
created: 2026-09-10
---

# Kế Hoạch Triển Khai Phân Hệ #08: Rà Soát Rủi Ro Chi Phí Thuế & Chỉ Tiêu B4 (Ngưỡng Tiền Mặt 5 Triệu Mới)

## 1. Tổng Quan & Bối Cảnh Nghiệp Vụ
- **Căn cứ pháp lý mới**: Theo **Luật Thuế GTGT 2024 (Luật số 48/2024/QH15)** và **Nghị định 181/2025/NĐ-CP** (hiệu lực từ 01/07/2025), các giao dịch mua hàng hóa, dịch vụ từng lần có giá trị **từ 05 triệu đồng trở lên** (đã bao gồm VAT) bắt buộc phải có chứng từ thanh toán không dùng tiền mặt để được khấu trừ thuế GTGT và tính vào chi phí được trừ khi tính thuế TNDN.
- **Quy định cũ (áp dụng cho các niên độ tài chính trước đây)**: Ngưỡng khống chế tiền mặt là **từ 20 triệu đồng trở lên** theo Thông tư 78/2014/TT-BTC, Thông tư 96/2015/TT-BTC và Thông tư 219/2013/TT-BTC.
- **Hành vi chia nhỏ phiếu chi**: Doanh nghiệp mua hàng nhiều lần trong ngày từ cùng một nhà cung cấp có tổng giá trị vượt ngưỡng vẫn bị xem là không đủ điều kiện thanh toán không dùng tiền mặt.
- **Hệ quả kiểm toán**: Các khoản chi tiền mặt vi phạm sẽ bị loại khỏi chi phí hợp lý khi quyết toán thuế TNDN và phải được cộng ngược vào **Chỉ tiêu B4** (Các khoản chi không được trừ khi xác định thu nhập chịu thuế) trên Tờ khai Quyết toán thuế TNDN (Mẫu số 03/TNDN).

## 2. Mục Tiêu & Sản Phẩm Đầu Ra
1. Cập nhật thông tin thẻ module #08 trên Hub và Sơ đồ kiến trúc phản ánh chính xác quy định mới 5 triệu và quy định cũ 20 triệu.
2. Xây dựng domain engine `CashTaxRiskScanner`:
   - Quét chứng từ chi tiền mặt (Có TK 111 đối ứng Nợ 15x, 6xx, 242, 331...) vượt ngưỡng.
   - Hỗ trợ linh hoạt 3 chế độ: `5 triệu (NĐ 181/2025)`, `20 triệu (NĐ 209/2013)`, và `Tùy chỉnh`.
   - Thuật toán gom nhóm phát hiện chia nhỏ phiếu chi theo `(Ngày ghi sổ + Nhà cung cấp / Mã đối tượng)` có tổng trong ngày vượt ngưỡng.
   - Tự động tính toán tổng số tiền rủi ro và số thuế TNDN tạm tính (20%) cần điều chỉnh tại Chỉ tiêu B4.
3. Giao diện `TaxRiskScannerPage` (#08):
   - Thống kê 4 KPI Cards: Tổng tiền rủi ro, Số chứng từ đơn lẻ vi phạm, Số cụm tách hóa đơn trong ngày, Tiền thuế TNDN tăng thêm tạm tính (20%).
   - Bộ lọc chuyển đổi ngưỡng (5 triệu vs 20 triệu) mượt mà 1-click.
   - Bảng kê chi tiết từng dòng bút toán vi phạm kèm lý do kiểm toán.
   - Nút **Xuất Excel Bảng Kê Rủi Ro Thuế & B4** phục vụ đính kèm hồ sơ kiểm toán.

## 3. Lộ Trình Triển Khai (Phases Roadmap)

| # | Phase | Mô tả | Trạng thái | Ước lượng |
| 1 | [Phase 1: Registry & Legal Specs](./phase-01-registry-and-legal-specs.md) | Cập nhật định nghĩa module #08 trong `modulesRegistry.ts`, Navigation Slice (`ViewKey 'taxrisk'`), Header Navigation và Architecture Diagram Modal. | Completed | 2h |
| 2 | [Phase 2: Domain Cash Tax Risk Engine](./phase-02-domain-cash-tax-risk-engine.md) | Xây dựng engine `CashTaxRiskScanner` với thuật toán quét đơn lẻ >= ngưỡng, gom tách phiếu chi cùng ngày, ước tính thuế TNDN B4. | Completed | 4h |
| 3 | [Phase 3: UI TaxRiskScannerPage & Export Excel](./phase-03-ui-tax-risk-scanner-page.md) | Xây dựng giao diện trang #08, KPI Cards, Bộ lọc ngưỡng 5tr/20tr, Bảng kê chi tiết và chức năng xuất file Excel bảng kê rủi ro. | Completed | 4h |
| 4 | [Phase 4: Unit Testing & Verification](./phase-04-unit-testing-and-verification.md) | Viết unit tests cho engine quét tiền mặt, kiểm tra typecheck, linting, vitest suite và build production thành công 100%. | Completed | 2h |

---

## 4. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] Thẻ module #08 hiển thị trạng thái `active` trên Hub với nhãn "QUY ĐỊNH MỚI NĐ 181", click vào mở trực tiếp giao diện rà soát.
- [ ] Engine quét chính xác cả 2 trường hợp: từng phiếu $\ge 5$tr (hoặc $\ge 20$tr) và tổng các phiếu trong cùng ngày cho 1 nhà cung cấp $\ge$ ngưỡng.
- [ ] Giao diện cho phép KTV chuyển đổi qua lại giữa mốc 5 triệu (từ 01/07/2025) và mốc 20 triệu (trước 01/07/2025) ngay lập tức.
- [ ] Nút xuất Excel tạo file bảng kê chi tiết có định dạng đẹp mắt, phục vụ hồ sơ kiểm toán.
- [ ] Typecheck, ESLint và full test suite pass 100%.
