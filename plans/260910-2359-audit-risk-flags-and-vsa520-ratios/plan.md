---
title: "Nâng Cấp Nhận Diện Rủi Ro Kiểm Toán Trọng Yếu & Bộ Tỷ Số Tài Chính VSA 520"
description: "Bổ sung Khối Cảnh Báo Cờ Đỏ Trọng Yếu (Executive Audit Red Flags Panel), Thanh Tỷ Số Tài Chính VSA 520 (Biên gộp, Khả năng trả lãi ICR, Tỷ lệ OPEX), Highlight tự động các dòng âm/đột biến trên B02 và Gợi ý thủ tục Giấy làm việc tương ứng."
status: completed
priority: P1
effort: "2h"
branch: main
tags: [analytics, vsa520, audit-risk, red-flags, financial-ratios, nd132]
blockedBy: []
blocks: []
created: 2026-09-10
---

# Nâng Cấp Nhận Diện Rủi Ro Kiểm Toán Trọng Yếu & Bộ Tỷ Số Tài Chính VSA 520

## Overview

Mặc dù phân hệ Phân Tích Sổ NKC (#05) đã có giao diện hiển thị số liệu hoàn thiện và bố cục 50/50 cân xứng, người đọc báo cáo (Kiểm toán viên, Trưởng nhóm kiểm toán) hiện vẫn phải tự dò từng bảng số liệu để suy luận rủi ro. 

Kế hoạch này nâng cấp module phân tích thành một **"Hệ thống Trợ lý Kiểm toán Chủ động Bắt Bệnh Doanh Nghiệp"**, giúp KTV nhận diện ngay lập tức trong 3 giây:
1. **Khối Cờ Đỏ Trọng Yếu (`AuditRiskAlertPanel`):** Tự động phát hiện và bật còi báo động với 4 nhóm rủi ro lớn nhất:
   - 🔴 **Kinh doanh dưới giá vốn (VSA 520):** Lỗ gộp, biên lãi gộp âm hoặc dồn giá vốn cuối năm.
   - 🔴 **Khống chế lãi vay thuế TNDN (NĐ 132/2020):** EBITDA âm, toàn bộ chi phí lãi vay bị loại (Chỉ tiêu B4).
   - 🔴 **Rủi ro Hoạt động liên tục (VSA 570):** Lỗ thuần từ HĐKD âm sâu, chi phí tài chính vượt quá khả năng tạo tiền.
   - 🟡 **Giao dịch bên liên quan (VSA 550):** Nghiệp vụ mượn tiền 0% lãi suất.
2. **Thanh Tỷ Số Tài Chính Kiểm Toán (VSA 520 Key Ratios Bar):** Tích hợp bộ 4 tỷ số tài chính then chốt kèm ngưỡng kiểm toán (Biên lãi gộp, Khả năng trả lãi ICR, Tỷ lệ OPEX/Doanh thu, Tỷ lệ tập trung Pareto).
3. **Highlight Dòng Âm & Đột Biến Trên Bảng B02:** Tô màu cảnh báo dịu mắt (soft red alert) cho các chỉ tiêu lỗ và gắn badge cảnh báo biến động đột biến.
4. **Gợi Ý Thủ Tục Giấy Làm Việc Tiếp Theo (Actionable Next Steps):** Liên kết trực tiếp rủi ro với các Giấy làm việc cần thực hiện (`E382`, `D595`, `D352/E252`, `E191`).

---

## Goals

| # | Goal | Priority | Effort |
|---|------|----------|--------|
| 1 | Xây dựng component `AuditRiskAlertPanel.tsx` quét tự động 4 cờ đỏ rủi ro VSA 520/550/570 & NĐ 132 | P1 | 40m |
| 2 | Bổ sung thanh tỷ số tài chính kiểm toán VSA 520 (Biên gộp, Khả năng trả lãi ICR, Tỷ lệ OPEX) | P1 | 30m |
| 3 | Highlight tự động các dòng âm/đột biến trên B02 và liên kết gợi ý thủ tục GLV cần làm | P1 | 30m |
| 4 | Kiểm thử xác thực toàn diện, chạy typecheck & test suite 100% | P1 | 20m |
| 1 | [Phase 1: Xây Dựng AuditRiskAlertPanel Quét Tự Động Cờ Đỏ](./phase-01-audit-risk-alert-panel.md) | Completed | P1 | 40m |
| 2 | [Phase 2: Thanh Tỷ Số Tài Chính Kiểm Toán VSA 520](./phase-02-vsa520-financial-ratios.md) | Completed | P1 | 30m |
| 3 | [Phase 3: Highlight B02 & Gợi Ý Thủ Tục GLV](./phase-03-b02-highlight-and-glv-actions.md) | Completed | P1 | 30m |
| 4 | [Phase 4: Kiểm Thử Xác Thực Hoàn Thiện](./phase-04-verification.md) | Completed | P1 | 20m |

---

## Acceptance Criteria

- [x] Xuất hiện Khối Cảnh Báo Cờ Đỏ Trọng Yếu ngay dưới KPI Cards, tự động phát hiện chính xác tình trạng Lỗ gộp, Lãi vay vượt trần NĐ 132, Nguy cơ hoạt động liên tục VSA 570 và Bên liên quan VSA 550.
- [x] Khối hiển thị có thể thu gọn / mở rộng linh hoạt, không chiếm dụng không gian nếu doanh nghiệp có tình hình tài chính an toàn.
- [x] Bổ sung thanh 4 Tỷ số tài chính VSA 520 với màu sắc trực quan (Xanh: An toàn, Vàng: Cảnh báo, Đỏ: Nguy cơ).
- [x] Bảng B02 tự động highlight các dòng lỗ (Mã 60, Mã 70) và các dòng biến động đột biến > 50%.
- [x] Mỗi rủi ro có nút gợi ý mở nhanh phân hệ hoặc hướng dẫn thực hiện Giấy làm việc tương ứng (`E382`, `D595`, `D352`).
- [x] `npm run typecheck` 0 error, toàn bộ 360 tests vượt qua 100%, production build thành công.
