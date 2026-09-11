---
phase: 1
title: "Chuẩn hóa Logic Đối Chiếu Thuế TNCN & Thuế GTGT trong TaxCrossReconciler"
status: "pending"
files_modified:
  - "src/domain/analytics/TaxCrossReconciler.ts"
---

# Phase 1: Chuẩn hóa Logic Đối Chiếu Thuế TNCN & Thuế GTGT trong TaxCrossReconciler

## Mục tiêu
Sửa đổi hàm `TaxCrossReconciler.reconcile` để hạch toán đúng bản chất kế toán:
1. Chi phí lương trong kỳ: Lấy **Phát sinh CÓ TK 334** (đối ứng Nợ 641, 642, 622, 154) thay vì Nợ 334.
2. Thuế TNCN khấu trừ: Bổ sung bóc tách **Phát sinh CÓ TK 3335** (đặc biệt là Nợ 334 / Có 3335) để đối chiếu trực tiếp với Chỉ tiêu [29] trên tờ khai 05.
3. Thuế GTGT: Thu thập thêm **Phát sinh NỢ TK 133** và **Phát sinh CÓ TK 33311**, **Phát sinh NỢ TK 33311** (nộp thuế) theo từng tháng/quý để phục vụ hiển thị 2 khối song song theo Mẫu E380.

## Chi tiết các bước thực hiện:

1. **Cập nhật `PitReconRow`**:
   ```typescript
   export interface PitReconRow {
     periodKey: string
     periodLabel: string
     employeeCount: bigint // [16]
     taxableIncome: bigint // [21]
     withheldTax: bigint   // [29]
     glPayrollExpense: bigint // Phát sinh Có TK 334
     payrollDiff: bigint      // taxableIncome - glPayrollExpense
     glPitWithheld: bigint    // Phát sinh Có TK 3335 (Nợ 334 / Có 3335)
     pitWithheldDiff: bigint  // withheldTax - glPitWithheld
     status: 'MATCHED' | 'DISCREPANCY'
     auditNote: string
   }
   ```

2. **Cập nhật `VatReconRow` để cấp đủ dữ liệu cho Mẫu E380**:
   ```typescript
   export interface VatReconRow {
     // ... các chỉ tiêu tờ khai ...
     taxInputVat25: bigint  // [25]
     taxOutputVat35: bigint // [35]
     adjustDecrease37: bigint // [37]
     adjustIncrease38: bigint // [38]
     refund42: bigint       // [42]
     taxPayable40: bigint   // [40]
     closingBalance43: bigint // [43]
     openingBalance22: bigint // [22]
     
     // Số liệu Sổ Kế Toán (NKC)
     glInputVat133: bigint    // Phát sinh NỢ 133
     glOutputVat33311: bigint // Phát sinh CÓ 33311
     glPaidVat33311: bigint   // Phát sinh NỢ 33311 (nộp thuế)
     inputVatDiff: bigint     // taxInputVat25 - glInputVat133
     outputVatDiff: bigint    // taxOutputVat35 - glOutputVat33311
   }
   ```

3. **Sửa vòng lặp quét bút toán `entries`**:
   - `if (e.creditAccount.startsWith('334'))`: Cộng dồn vào `glPayrollByPeriod` (Quỹ lương thực tế).
   - `if (e.creditAccount.startsWith('3335'))`: Cộng dồn vào `glPitWithheldByPeriod` (Thuế TNCN đã khấu trừ).
   - `if (e.debitAccount.startsWith('133'))`: Cộng dồn vào `glInputVatByPeriod` (Nợ 133).
   - `if (e.creditAccount.startsWith('33311'))`: Cộng dồn vào `glOutputVatByPeriod` (Có 33311).
   - `if (e.debitAccount.startsWith('33311'))`: Cộng dồn vào `glPaidVatByPeriod` (Nợ 33311).
