---
id: "phase-02"
name: "Xây dựng hàm bóc tách ma trận chi phí 12 tháng extract12MonthExpenseMatrix"
plan: "plans/260911-1120-fix-sample-column-mapping-and-d692-d792-matrix/plan.md"
status: "pending"
priority: "P1"
effort: "30m"
files:
  - "src/domain/workingpaper/counterpartExtractor.ts"
  - "tests/unit/counterpartExtractor.test.ts"
---

# Pha 2: Xây Dựng Hàm Bóc Tách Ma Trận Chi Phí 12 Tháng `extract12MonthExpenseMatrix`

## 1. Mục Tiêu
Cung cấp engine xử lý chung để bóc tách từ NKC số liệu phân bổ chi phí theo 12 tháng (từ Tháng 1 đến Tháng 12) cho:
1. Chi phí trả trước phân bổ (`Có 242` đối ứng `Nợ 627`, `Nợ 641`, `Nợ 642`) $\rightarrow$ phục vụ sheet `D 692`.
2. Khấu hao tài sản cố định (`Có 214` đối ứng `Nợ 627`, `Nợ 641`, `Nợ 642`) $\rightarrow$ phục vụ sheet `D 792`.

## 2. Thiết Kế Interface & Logic

### 2.1. Cấu Trúc Dữ Liệu
Trong `src/domain/workingpaper/counterpartExtractor.ts`:
```typescript
export interface MonthlyExpenseMatrixRow {
  month: number // 1 đến 12
  tk627: number // Chi phí sản xuất chung
  tk641: number // Chi phí bán hàng
  tk642: number // Chi phí quản lý doanh nghiệp
  total: number // Tổng cộng trong tháng
}

export interface ExpenseMatrix12MResult {
  monthly: MonthlyExpenseMatrixRow[] // Mảng 12 tháng
  totalYear: {
    tk627: number
    tk641: number
    tk642: number
    total: number
  }
}
```

### 2.2. Logic Thuật Toán
```typescript
export function extract12MonthExpenseMatrix(
  transactions: readonly NkcTransaction[],
  creditPrefix: '242' | '214',
): ExpenseMatrix12MResult {
  const monthly: MonthlyExpenseMatrixRow[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    tk627: 0,
    tk641: 0,
    tk642: 0,
    total: 0,
  }))

  for (const t of transactions) {
    if (t.amount <= 0) continue
    if (t.credit.startsWith(creditPrefix)) {
      const mIdx = Math.max(0, Math.min(11, (t.month || 1) - 1))
      const row = monthly[mIdx]
      if (!row) continue

      if (t.debit.startsWith('627')) {
        row.tk627 += t.amount
      } else if (t.debit.startsWith('641')) {
        row.tk641 += t.amount
      } else if (t.debit.startsWith('642')) {
        row.tk642 += t.amount
      }
    }
  }

  // Tính tổng từng tháng và tổng cả năm
  let sum627 = 0, sum641 = 0, sum642 = 0, sumAll = 0
  for (const r of monthly) {
    r.total = r.tk627 + r.tk641 + r.tk642
    sum627 += r.tk627
    sum641 += r.tk641
    sum642 += r.tk642
    sumAll += r.total
  }

  return {
    monthly,
    totalYear: {
      tk627: sum627,
      tk641: sum641,
      tk642: sum642,
      total: sumAll,
    },
  }
}
```

## 3. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] Unit test kiểm tra bóc tách cả 12 tháng cho TK 242 và TK 214 trong `tests/unit/counterpartExtractor.test.ts`.
- [ ] Tổng phát sinh cả năm (`totalYear`) khớp đúng với số liệu phát sinh Có của TK 242/214 đối ứng Nợ 627, 641, 642 trên Sổ Cái.
