---
phase: 1
title: "Mở Rộng ExpenseByNatureEngine Bóc Tách Ma Trận Tài Khoản Chi Tiết"
status: ready
priority: P1
effort: "30m"
files:
  - "src/domain/analytics/types.ts"
  - "src/domain/analytics/ExpenseByNatureEngine.ts"
---

# Phase 01: Mở Rộng ExpenseByNatureEngine Bóc Tách Ma Trận Tài Khoản Chi Tiết

## 1. Mục Tiêu
Cung cấp dữ liệu chi tiết cho từng tài khoản con phát sinh qua 12 tháng (thay vì chỉ có 5 số tổng hợp nhóm), gom nhóm theo 5 yếu tố chi phí chuẩn mực để sẵn sàng cho bộ xuất Excel.

---

## 2. Chi Tiết Thực Hiện

### 2.1. Khai báo Types trong `src/domain/analytics/types.ts`
```ts
export type ExpenseNatureCategory =
  | 'RAW_MATERIALS'    // Nguyên vật liệu (621, 6272, 6412, 6422, đối ứng 152)
  | 'LABOR'            // Nhân công (622, 6271, 6411, 6421, đối ứng 334, 338)
  | 'DEPRECIATION'     // Khấu hao (6274, 6414, 6424, đối ứng 214)
  | 'OUTSIDE_SERVICES' // Dịch vụ ngoài (6277, 6417, 6427)
  | 'OTHER_CASH'       // Khác bằng tiền (6278, 6418, 6428)

export interface ExpenseNatureAccountBreakdown {
  accountCode: string        // Ví dụ: '621', '6272', '6412'...
  accountName: string        // Tên tài khoản tiếng Việt
  category: ExpenseNatureCategory
  categoryLabel: string      // 'Nguyên Vật Liệu', 'Nhân Công'...
  monthlyAmounts: number[]   // 12 phần tử cho tháng 1..12
  annualTotal: number        // Tổng cả năm của tài khoản này
}

// Bổ sung vào ExpenseByNatureReport:
export interface ExpenseByNatureReport {
  rows: ExpenseByNatureMonthRow[]
  annualTotals: { ... }
  bctcReconciliation: ExpenseByNatureBctcRecon
  accountBreakdowns: ExpenseNatureAccountBreakdown[] // MỚI
}
```

### 2.2. Nâng cấp `ExpenseByNatureEngine.ts`
Trong vòng lặp duyệt qua từng bút toán `entries`:
1. Khi phát hiện một bút toán thuộc yếu tố chi phí:
   - Xác định `category` tương ứng (`RAW_MATERIALS`, `LABOR`, `DEPRECIATION`, `OUTSIDE_SERVICES`, `OTHER_CASH`).
   - Lấy mã tài khoản chi tiết `accKey` (ưu tiên mã tài khoản chi phí Nợ như `621`, `6272`, `622`, `6271`, `6274`, `6277`, `6278`, `641x`, `642x`...).
   - Tìm hoặc tạo mới `ExpenseNatureAccountBreakdown` trong `accountMap`.
   - Cộng `amt` vào `monthlyAmounts[mIdx]`.
2. Lấy tên tài khoản từ `cdfsAccounts` (nếu có) hoặc từ từ điển chuẩn tên tài khoản Thông tư 200.
3. Sắp xếp danh sách tài khoản theo thứ tự:
   - Gom theo 5 nhóm yếu tố: Nguyên vật liệu $\rightarrow$ Nhân công $\rightarrow$ Khấu hao $\rightarrow$ Dịch vụ ngoài $\rightarrow$ Khác bằng tiền.
   - Trong từng nhóm, sắp xếp tăng dần theo mã tài khoản (`621` $\rightarrow$ `6272` $\rightarrow$ `6412` $\rightarrow$ `6422`...).
4. Trả về `accountBreakdowns` trong `ExpenseByNatureReport`.

---

## 3. Kiểm Thử
- Chạy unit test `tests/expense-by-nature.test.ts`:
  - Đảm bảo tổng `annualTotal` của tất cả các tài khoản trong nhóm Nguyên vật liệu bằng đúng `annualTotals.rawMaterials`.
  - Tương tự với 4 nhóm còn lại.
  - Không có tài khoản nào bị phân loại trùng lặp hoặc sai lệch số tiền.
