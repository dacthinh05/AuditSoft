---
title: "Phase 3: Tax Cross-Reconciler Engine (Thuần Logic Đối Chiếu)"
description: "Xây dựng lõi đối chiếu chéo số liệu giữa Tờ khai thuế GTGT/TNCN và Sổ Nhật ký chung (NKC) kế toán, phân tích chênh lệch Doanh thu, Thuế GTGT đầu ra/vào và Chi phí tiền lương theo từng Quý và cả Năm."
status: planned
priority: P1
effort: "4h"
created: 2026-09-10
---

# Phase 3: Tax Cross-Reconciler Engine (Thuần Logic Đối Chiếu)

## 1. Mục Tiêu
Xây dựng engine thuần logic `TaxCrossReconciler.ts` có nhiệm vụ so khớp số liệu giữa:
- **Tờ khai thuế GTGT (`VatDeclarationSnapshot[]`)** vs **Phát sinh Sổ NKC** (Doanh thu TK 511, Thuế GTGT đầu ra TK 33311, Thuế GTGT đầu vào TK 1331).
- **Tờ khai thuế TNCN (`PitDeclarationSnapshot[]`)** vs **Phát sinh Sổ NKC** (Chi phí tiền lương TK 334, TK 641, TK 642).
- So sánh tính nhất quán giữa các **Tờ khai Quý (05/KK)** vs **Tờ khai Quyết toán năm (05/QTT)**.

> *Ghi chú*: Phần xuất file Excel Working Paper tạm gác lại theo chỉ đạo của người dùng để chờ hoàn tất file GLV MẪU. Kết quả của engine này sẽ cung cấp dữ liệu trực tiếp cho giao diện hiển thị bảng đối chiếu ở Phase 4.

## 2. Danh Sách Tệp Cần Tạo

| Tệp Mới Trong AuditSoft | Trách Nhiệm |
|-------------------------|-------------|
| `src/domain/analytics/TaxCrossReconciler.ts` | Lõi so khớp dữ liệu Thuế vs Sổ kế toán, sinh cấu trúc so sánh từng Quý/Tháng và Cả năm kèm ghi chú kiểm toán. |
| `tests/tax-cross-reconciler.test.ts` | Bộ unit test kiểm chứng phát hiện đúng các trường hợp khớp 100% và các trường hợp có chênh lệch. |

## 3. Chi Tiết Thuật Toán & Hợp Đồng Dữ Liệu

### 3.1. Hợp đồng dữ liệu `TaxCrossReconciliationResult`
```ts
export interface VatReconRow {
  periodKey: string;      // "2025-Q1", "2025-Q2"...
  periodLabel: string;    // "Quý 1/2025"
  declarationType: string;// "Chính thức" | "Bổ sung lần 1"
  taxRevenue: bigint;     // Chỉ tiêu [34] trên tờ khai 01/GTGT
  glRevenue: bigint;      // Phát sinh Có TK 511 trong kỳ
  revenueDiff: bigint;    // taxRevenue - glRevenue
  taxOutputVat: bigint;   // Chỉ tiêu [35] trên tờ khai 01/GTGT
  glOutputVat: bigint;    // Phát sinh Có TK 33311 trong kỳ
  outputVatDiff: bigint;  // taxOutputVat - glOutputVat
  taxInputVat: bigint;    // Chỉ tiêu [25] Thuế GTGT khấu trừ kỳ này
  glInputVat: bigint;     // Phát sinh Nợ TK 1331 trong kỳ
  inputVatDiff: bigint;   // taxInputVat - glInputVat
  status: 'MATCHED' | 'DISCREPANCY';
  auditNote?: string;
}

export interface PitReconRow {
  periodKey: string;
  periodLabel: string;
  employeeCount: bigint;  // Chỉ tiêu [16]
  taxableIncome: bigint;  // Chỉ tiêu [21]
  withheldTax: bigint;    // Chỉ tiêu [29]
  glPayrollExpense: bigint; // Phát sinh Nợ TK 334 / Nợ 6411, 6421
  payrollDiff: bigint;    // taxableIncome - glPayrollExpense
  status: 'MATCHED' | 'DISCREPANCY';
  auditNote?: string;
}

export interface TaxCrossReconciliationResult {
  vatRows: VatReconRow[];
  vatSummary: {
    totalTaxRevenue: bigint;
    totalGlRevenue: bigint;
    totalRevenueDiff: bigint;
    totalTaxOutputVat: bigint;
    totalGlOutputVat: bigint;
    totalOutputVatDiff: bigint;
    hasDiscrepancy: boolean;
  };
  pitRows: PitReconRow[];
  pitSummary: {
    totalTaxableIncome: bigint;
    totalGlPayroll: bigint;
    totalPayrollDiff: bigint;
    finalizationIncome?: bigint; // Chỉ tiêu quyết toán năm
    finalizationDiff?: bigint;
    hasDiscrepancy: boolean;
  };
}
```

### 3.2. Thuật toán so khớp kỳ khai với ngày ghi sổ
1. **Xác định tháng của giao dịch kế toán**:
   - Dựa vào trường `entry.month` (1 đến 12) của `JournalEntry`:
     + Quý 1: Tháng 1, 2, 3.
     + Quý 2: Tháng 4, 5, 6.
     + Quý 3: Tháng 7, 8, 9.
     + Quý 4: Tháng 10, 11, 12.
2. **Ưu tiên phiên bản tờ khai mới nhất**:
   - Nếu trong một kỳ có cả tờ khai "Chính thức" và các tờ khai "Bổ sung lần 1, lần 2...", engine mặc định lấy bản khai bổ sung có số thứ tự cao nhất (`supplementalNo` lớn nhất) để phản ánh số liệu thuế điều chỉnh cuối cùng của doanh nghiệp.
3. **Phát hiện và gợi ý nguyên nhân chênh lệch (Audit Heuristics)**:
   - Nếu $\text{Doanh thu NKC} > \text{Doanh thu Thuế}$: Gợi ý `"Doanh thu chưa đến thời điểm xuất hóa đơn theo Thông tư 200 hoặc có hóa đơn bị sót kỳ"`.
   - Nếu $\text{Doanh thu NKC} < \text{Doanh thu Thuế}$: Gợi ý `"Hóa đơn xuất trước khi cung cấp dịch vụ hoặc có khoản doanh thu tính thuế GTGT không ghi nhận vào TK 511 (ví dụ thanh lý TSCĐ TK 711)"`.

## 4. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
1. `TaxCrossReconciler.reconcile()` xử lý chính xác khi đầu vào có 4 tờ khai quý và sổ NKC cả năm.
2. Khi số liệu khớp nhau từng đồng, trạng thái hiển thị `MATCHED` và `revenueDiff = 0n`.
3. Khi có chênh lệch, tính chính xác số tiền lệch và gán nhãn giải thích phù hợp.
4. Xử lý an toàn khi thiếu tờ khai của một số kỳ (không crash, hiển thị trạng thái `MISSING_FILING`).
5. Unit tests trong `tests/tax-cross-reconciler.test.ts` pass 100%.
