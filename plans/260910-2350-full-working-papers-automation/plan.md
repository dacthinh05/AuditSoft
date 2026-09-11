---
title: "Kế Hoạch Tự Động Hóa Toàn Bộ 15 Giấy Làm Việc Kiểm Toán Chuẩn VACPA"
description: "Mở rộng độ phủ tự động hóa từ 35 sheets lên hơn 200 sheets trên toàn bộ 15 tệp Excel GLV thực địa và master, tự động lập BCTC, tính mức trọng yếu A710, điền 38 chương trình kiểm toán và các bảng phân tích chuyên sâu."
status: completed
priority: P1
effort: "4h"
branch: main
tags: [workingpaper, vacpa, automation, openxml, excel, audit-master]
blockedBy: []
blocks: []
created: 2026-09-10
---

# Kế Hoạch Tự Động Hóa Toàn Bộ 15 Giấy Làm Việc Kiểm Toán Chuẩn VACPA

## Overview

Sau khi khảo sát chuyên sâu 15 tệp mẫu trong thư mục `GLV MAU` (tổng cộng 317 sheets), hệ thống hiện chỉ mới điền tự động 35 sheets ở mức cơ bản (chủ yếu là `ADD`, các dòng lead tổng hợp `x10` và một số bảng mẫu đơn lẻ). Có tới **282 sheets** vẫn đang để trống, trong đó có hai tệp quan trọng bậc nhất là:
1. **`A - B - H - Mau 2025 - Thinh.xlsx` (42 sheets):** Chứa toàn bộ Báo cáo tài chính (`B420.CDKT`, `B420.KQKD`, `LCTT`), phân tích sơ bộ (`A510`) và Bảng xác định mức trọng yếu (`A710`) chuẩn mực VSA 320.
2. **`Leadsheet - 2025 - Dac Thinh.xlsx` (38 sheets):** Chứa 38 Chương trình kiểm toán chuẩn mực VACPA của tất cả các phần hành (Mục tiêu kiểm toán, rủi ro cơ sở dẫn liệu và danh mục thủ tục).
3. **Các bảng phân tích chuyên sâu bị thiếu trong 13 file phần hành:** Bảng Nhập - Xuất - Tồn kho (`D550`), Bảng tuổi nợ (`D351.1`), Thư xác nhận (`D352`, `E252`), Ước tính chi phí khấu hao độc lập (`D792`), Ước tính chi phí lãi vay (`E191`), Chi tiết chi phí bán hàng & QLDN theo tháng (`G353`, `G453`), và phần hành Đầu tư tài chính (`D200`).

Toàn bộ dữ liệu và công thức cần thiết (từ Sổ NKC, CDFS, Tờ khai thuế XML, Engine EBITDA, Engine Sampling) **đều đã có sẵn 100% trong mã nguồn AuditSoft**. Kế hoạch này kích hoạt toàn diện khả năng tự động hóa, đưa tỷ lệ tự động lập hồ sơ kiểm toán lên **75% - 85%**.

---

## Goals

| # | Goal | Priority | Effort |
|---|------|----------|--------|
| 1 | Kích hoạt `A - B - H`: Đổ CDFS vào `bcdsps-Truoc DC` để tự sinh B01-CDKT, B02-KQKD, LCTT, và tính tự động Mức trọng yếu VSA 320 tại `A710` | P1 | 50m |
| 2 | Kích hoạt `Leadsheet - 2025`: Điền tự động `ADD`, link số dư, tick hoàn thành thủ tục kiểm toán `P` và điền W/P Ref cho 38 sheets | P1 | 40m |
| 3 | Chuyển dịch và hoàn thiện Nhóm Doanh thu & Chi phí (`G100`, `G200`): Port `G353`, `G453`, `G490`, `G291.2` sang OpenXml, bổ sung `G191.1` & `G195` | P1 | 45m |
| 4 | Hoàn thiện Công nợ & Kho (`D300`, `E200`, `D500`): Tuổi nợ `D351.1`, Thư xác nhận `D352/E252`, Nợ ngoài sổ `E290`, Bảng NXT kho `D550` | P1 | 45m |
| 5 | Hoàn thiện Tài sản, Vay, Thuế & Đầu tư (`D700`, `E100`, `E300`, `D200`): Ước tính khấu hao `D792`, Lãi vay `E191`, Thuế TNDN `E382`, Tạo mới `D200` | P1 | 40m |
| 6 | Tích hợp vào `WorkingPaperGenerator.ts`, mở rộng test suite `tests/workingpaper.test.ts` lên 15/15 files và chạy kiểm thử | P1 | 20m |

---

## Phases

| # | Phase | Status | Priority | Effort |
|---|-------|--------|----------|--------|
| 1 | [Phase 1: Kích Hoạt File Master A-B-H và Leadsheet-2025](./phase-01-master-abh-and-leadsheet.md) | Completed | P1 | 50m |
| 2 | [Phase 2: Hoàn Thiện Doanh Thu & Chi Phí G100, G200](./phase-02-revenue-and-expenses-g100-g200.md) | Completed | P1 | 45m |
| 3 | [Phase 3: Hoàn Thiện Công Nợ & Hàng Tồn Kho D300, E200, D500](./phase-03-receivables-payables-inventory.md) | Completed | P1 | 45m |
| 4 | [Phase 4: Hoàn Thiện Tài Sản, Vay, Thuế & Đầu Tư D700, E100, E300, D200](./phase-04-assets-borrowings-tax-investments.md) | Completed | P1 | 40m |
| 5 | [Phase 5: Tích Hợp Generator & Kiểm Thử Hồi Quy 15 Files](./phase-05-generator-integration-and-verification.md) | Completed | P1 | 20m |

## Acceptance Criteria

- [x] File `A - B - H - Mau 2025 - Thinh.xlsx` được điền tự động: `bcdsps-Truoc DC` nhận đủ dữ liệu CDFS, các sheet BCTC (`B420.CDKT`, `B420.KQKD`, `LCTT`) và `A710` (Mức trọng yếu) tính toán chính xác, không phát sinh lỗi công thức.
- [x] File `Leadsheet - 2025 - Dac Thinh.xlsx` được điền tự động 38 sheets chương trình kiểm toán: có đầy đủ tên khách hàng, niên độ, KTV và tick `P` cho các thủ tục đã thực hiện.
- [x] Các sheet phân tích chi phí `G353`, `G453`, `G490`, `G291.2` chạy thông suốt trong engine OpenXmlPackageEditor.
- [x] Các bảng tính toán tự động: Bảng NXT kho `D550`, Tuổi nợ `D351.1`, Ước tính khấu hao `D792`, Ước tính lãi vay `E191`, Bóc tách thuế TNDN NĐ 132 `E382` được điền số liệu chuẩn xác.
- [x] File mới `D200 - Dau tu - ABC 2020.xlsx` được hỗ trợ tự động điền Lead schedule và doanh thu tài chính.
- [x] Bộ kiểm thử `vitest run tests/workingpaper.test.ts` xuất thành công 15/15 files (thay vì 12 files), kích thước file hợp lệ, 0 lỗi runtime.
