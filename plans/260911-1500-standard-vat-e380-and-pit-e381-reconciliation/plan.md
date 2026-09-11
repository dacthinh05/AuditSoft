---
title: "Chuẩn Hóa 2 Mẫu Đối Chiếu Thuế: GTGT (Mẫu E380) & TNCN (Mẫu E381)"
description: "Loại bỏ đối chiếu quỹ lương 334 khỏi mẫu TNCN; chuẩn hóa bảng thuế GTGT theo Mẫu E380 và bảng thuế TNCN theo Mẫu E381 trên UI, Engine, Xuất Excel và GLV E300"
status: completed
priority: P1
effort: 3h
author: "Antigravity Assistant"
created: 2026-09-11
tags: [tax, ui, reconciliation, excel, vacpa]
blockedBy: []
blocks: []
phases:
  - id: "phase-01"
    name: "Cập nhật Type và PitXmlParser bóc tách cư trú & không cư trú"
    file: "phase-01-tax-types-and-pit-xml-parser.md"
    status: "pending"
  - id: "phase-02"
    name: "Nâng cấp TaxCrossReconciler đối chiếu chuẩn theo 2 mẫu E380 và E381"
    file: "phase-02-reconciliation-engine-gtgt-and-tncn.md"
    status: "pending"
  - id: "phase-03"
    name: "Tái cấu trúc giao diện TaxAnalyticsTab theo chuẩn Ảnh 2 và Ảnh 3"
    file: "phase-03-ui-redesign-tax-analytics-tab.md"
    status: "pending"
  - id: "phase-04"
    name: "Cập nhật Xuất Excel TaxReconExporter và Điền GLV E381 trong E300_TaxFiller"
    file: "phase-04-excel-export-and-glv-e381-filler.md"
    status: "pending"
  - id: "phase-05"
    name: "Kiểm thử tự động Vitest và xác minh giao diện không lỗi"
    file: "phase-05-verification-and-tests.md"
    status: "pending"
---

# CHUẨN HÓA 2 MẪU ĐỐI CHIẾU THUẾ: GTGT (MẪU E380) & TNCN (MẪU E381)

## 1. Tổng Quan & Bối Cảnh Nghiệp Vụ
Người dùng (Kiểm toán viên) phản hồi chính xác về chuẩn mực kiểm toán VACPA:
- **Bảng Thuế TNCN trước đây:** Đang đối chiếu chỉ tiêu [21] với Chi phí lương (Có 334). Điều này không đúng với mẫu hồ sơ kiểm toán chuẩn mực VACPA, vì [21] chỉ là phần thu nhập chịu thuế (loại trừ các khoản phụ cấp miễn thuế), không đại diện cho toàn bộ quỹ lương và không nằm trong mẫu đối chiếu thuế TNCN.
- **Hai Mẫu Chuẩn Được Cung Cấp:**
  1. **Mẫu E380 (Ảnh 2 - Thuế GTGT):** Đối chiếu 12 tháng đầy đủ (Đầu kỳ, Tháng 1..12, CỘNG) giữa Tờ khai 01/GTGT (Đầu vào [25], Đầu ra [35], Điều chỉnh Tăng [38], Giảm [37], Xin hoàn [42], Phải nộp [40], Số dư [43]) với Sổ kế toán (PS Nợ 133*, CL, PS Có 33311, CL).
  2. **Mẫu E381 (Ảnh 3 - Thuế TNCN):** Đối chiếu nghĩa vụ thuế TNCN TK 3335 theo kỳ (Đk, Tháng 1..12 / Quý, TC):
     - **Tờ khai:** Thuế khấu trừ cá nhân cư trú + Cá nhân không cư trú = Tổng thuế khấu trừ (1)
     - **Sổ sách:** Thuế khấu trừ (2) (Phát sinh Có TK 3335)
     - **Chênh lệch:** (1) - (2)
     - **Đã nộp:** Phát sinh Nợ TK 3335 (nộp vào NSNN)
     - **Còn phải nộp:** Số dư Có TK 3335 cuối kỳ (Lũy kế: Dư Đk + Khấu trừ Có 3335 - Đã nộp Nợ 3335).

---

## 2. Kiến Trúc & Luồng Dữ Liệu Đồng Bộ
```mermaid
flowchart TD
    XML_VAT[Tờ khai 01/GTGT XML] --> PARSE_V[VatXmlParser]
    XML_PIT[Tờ khai 05/KK-TNCN XML] --> PARSE_P[PitXmlParser: Cư trú & Không cư trú]
    NKC[Sổ NKC: 133, 33311, Có 3335, Nợ 3335] --> RECON[TaxCrossReconciler Engine]
    
    PARSE_V & PARSE_P --> RECON
    
    RECON --> UI[Giao diện TaxAnalyticsTab: 2 Bảng Chuẩn E380 & E381]
    RECON --> EXCEL_EXP[TaxReconExporter: Xuất 2 Sheet Chuẩn E380 & E381]
    RECON --> WP_E300[E300_TaxFiller: Tự động điền cả 2 Sheet E 380 & E 381 vào GLV E300]
```

---

## 3. Danh Sách Các Pha Thực Hiện
- **[Pha 1: Types & PitXmlParser](phase-01-tax-types-and-pit-xml-parser.md)**: Mở rộng `PitDeclarationSnapshot` với thuế khấu trừ cá nhân cư trú và không cư trú.
- **[Pha 2: TaxCrossReconciler Engine](phase-02-reconciliation-engine-gtgt-and-tncn.md)**: Bóc tách Nợ 3335 (Đã nộp), tính lũy kế Còn phải nộp, chuẩn hóa VAT 12 tháng E380 và TNCN E381.
- **[Pha 3: Giao diện TaxAnalyticsTab](phase-03-ui-redesign-tax-analytics-tab.md)**: Bỏ quỹ lương 334, tái cấu trúc bảng TNCN chuẩn 8 cột theo Ảnh 3 và bảng GTGT theo Ảnh 2.
- **[Pha 4: Xuất Excel & GLV E300](phase-04-excel-export-and-glv-e381-filler.md)**: Xuất Excel 2 sheet `E380_GTGT` & `E381_TNCN`, tự động điền sheet `E 381` trong GLV `E300 - Thue`.
- **[Pha 5: Kiểm thử Vitest](phase-05-verification-and-tests.md)**: Cập nhật và bổ sung unit tests đảm bảo 100% test pass.
