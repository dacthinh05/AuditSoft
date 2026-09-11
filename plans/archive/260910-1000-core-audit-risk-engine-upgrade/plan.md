---
title: "Nâng Cấp Toàn Diện Hệ Thống Nhận Diện Rủi Ro Kiểm Toán: Khử Dương Tính Giả & 4 Bẫy Gian Lận Trọng Yếu"
description: "Nâng cấp hệ thống nhận diện rủi ro kiểm toán VSA: khử triệt để dương tính giả do kết chuyển 911 và biến động số học nhỏ, tích hợp 4 bẫy kiểm toán trọng yếu (Quỹ tiền mặt ảo, Cặp TK đối ứng cấm, Bút toán đảo/ghi âm doanh thu, Treo chi phí giấu lỗ), phân tầng rủi ro VSA 240/330/520."
status: completed
priority: P1
effort: "1.5d"
branch: main
tags: [feature, audit, risks, vsa, analytics]
blockedBy: []
blocks: []
created: 2026-09-10
---

# Kế Hoạch Nâng Cấp Toàn Diện Hệ Thống Nhận Diện Rủi Ro Kiểm Toán (VSA 240, VSA 330, VSA 520)

## 1. Tổng Quan & Bối Cảnh Nghiệp Vụ
Trong thực tế kiểm toán độc lập tại Việt Nam, các hệ thống cảnh báo rủi ro tự động thường mắc phải các lỗi căn bản:
- **Dương tính giả tràn lan (False Positives / Alert Fatigue)**:
  - Bút toán kết chuyển xác định KQKD ngày 31/12 (TK 911, 511 $\rightarrow$ 911, 911 $\rightarrow$ 632) bị báo động nhầm là "đột biến cuối kỳ / rủi ro cutoff".
  - Biến động số học MoM % cực lớn trên số tiền nhỏ (ví dụ từ 1 triệu lên 3 triệu tăng +200%) làm nháy đèn đỏ vô nghĩa.
  - Các giao dịch luân chuyển nội bộ (Nợ 112 / Có 111 nộp tiền ngân hàng) bị coi là chi phí tiền mặt.
- **Bỏ lọt gian lận trọng yếu (False Negatives)**:
  - Doanh nghiệp tồn quỹ tiền mặt "ảo" hàng chục tỷ đồng nhưng vẫn đi vay ngân hàng chịu chi phí lãi vay (TK 111 vs TK 341/635).
  - Cặp tài khoản đối ứng cấm hoặc bất thường (Nợ 211 / Có 111 mua TSCĐ bằng tiền mặt; Nợ 642, 811 / Có 131 xóa nợ không trích dự phòng; Nợ 331 / Có 711 xóa nợ phải trả).
  - Bút toán ghi âm doanh thu Có 511 để trốn thuế hoặc xóa sổ không qua 521.
  - Treo chi phí vào TK 242, 241, 1388, 141 để giấu lỗ, làm đẹp báo cáo tài chính.

## 2. Mục Tiêu Nâng Cấp
1. **Khử triệt để dương tính giả (Tầng 1)**:
   - Tự động loại trừ các bút toán kết chuyển 911 khỏi các thuật toán phát hiện đột biến cuối kỳ và số tiền lớn.
   - Áp dụng nguyên tắc "Trọng yếu kép": Chỉ cảnh báo khi thỏa mãn đồng thời $\Delta\% \ge 80\% \text{ VÀ } |\Delta| \ge \text{CTT (hoặc ngưỡng tối thiểu)}$.
2. **Xây dựng 4 bẫy kiểm toán trọng yếu (Tầng 2 & 4)**:
   - **Bẫy 1: Quỹ tiền mặt ảo / Bất thường tiền mặt (`VIRTUAL_CASH_TRAP`)**: Tồn quỹ tiền mặt lớn bất thường trong khi vẫn chịu chi phí lãi vay ngân hàng.
   - **Bẫy 2: Cặp tài khoản đối ứng cấm / Bất thường (`PROHIBITED_ACCOUNT_PAIRS`)**: Mua TSCĐ bằng tiền mặt, xóa nợ trực tiếp không qua dự phòng, xóa nợ phải trả vào thu nhập khác.
   - **Bẫy 3: Bút toán đảo / Ghi âm doanh thu bất thường (`ABNORMAL_REVENUE_REVERSAL`)**: Có 511 ghi âm hoặc Nợ 511 đối ứng tài khoản lạ.
   - **Bẫy 4: Treo chi phí giấu lỗ (`EXPENSE_PARKING_TRAP`)**: Đột biến treo chi phí vào 242, 241, 1388 qua các kỳ.
3. **Phân tầng & Gắn nhãn chuẩn mực VSA**:
   - Gắn nhãn chuẩn mực kiểm toán: VSA 240, VSA 330, VSA 520, TT 96/2015.
   - Phân loại mức độ: `CRITICAL` / `HIGH` / `MEDIUM` / `LOW` kèm bộ lọc rủi ro trực quan trên giao diện.

---

## 3. Lộ Trình Triển Khai (Phases Roadmap)

| # | Phase | Mô tả | Trạng thái | Ước lượng |
|---|-------|--------------------|------------|-----------|
| 1 | [Phase 1: Noise Cleansing & Materiality Gates](./phase-01-noise-cleansing-and-materiality-gates.md) | Khử triệt để dương tính giả: loại trừ kết chuyển 911 khỏi các rule rủi ro cuối kỳ, bổ sung cổng lọc trọng yếu kép MoM% x Giá trị tuyệt đối CTT. | Completed | 3h |
| 2 | [Phase 2: Four Major Audit Fraud Rules](./phase-02-four-major-audit-fraud-rules.md) | Xây dựng 4 audit rules mới trong `src/main/risks/rules/`: Quỹ tiền mặt ảo, Cặp TK đối ứng cấm, Ghi âm doanh thu 511, Treo chi phí giấu lỗ. | Completed | 5h |
| 3 | [Phase 3: Risk Scoring & UI Integration](./phase-03-risk-scoring-and-ui-integration.md) | Cập nhật hệ thống tính điểm rủi ro, phân tầng CRITICAL/HIGH/MEDIUM/LOW, gắn nhãn chuẩn VSA và hiển thị nổi bật trên UI rủi ro. | Completed | 3h |
| 4 | [Phase 4: Unit Testing & Verification](./phase-04-unit-testing-and-verification.md) | Viết unit tests kiểm chứng từng bẫy kiểm toán, chạy full test suite 60+ files, typecheck, linting và build production 100% Pass. | Completed | 2h |
---

## 4. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] Bút toán kết chuyển 911 hoàn toàn không còn bị gắn cờ "bất thường cuối kỳ" sai lệch.
- [ ] Các biến động số tiền nhỏ dưới ngưỡng CTT (dù % tăng > 100%) không bị nháy cảnh báo đỏ.
- [ ] Bắt trúng 100% các trường hợp gian lận thực tế: tồn quỹ tiền mặt lớn khi vay nợ, mua TSCĐ bằng tiền mặt, xóa nợ 131 vào chi phí trực tiếp, ghi âm doanh thu 511.
- [ ] Toàn bộ 60+ test files trong hệ thống đều Pass, không có bất kỳ lỗi typecheck hay build nào.
