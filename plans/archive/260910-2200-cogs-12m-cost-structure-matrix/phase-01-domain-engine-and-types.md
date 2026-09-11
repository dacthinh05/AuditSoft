---
phase: 1
title: "Mở rộng Domain Types và Thuật Toán Bóc Tách Chi Phí Giá Vốn 12 Tháng Trước Khi Kết Chuyển 911"
status: "pending"
files_modified:
  - "src/domain/analytics/types.ts"
  - "src/domain/analytics/FinancialCorrelationEngine.ts"
---

# Phase 1: Mở rộng Domain Types và Thuật Toán Bóc Tách Chi Phí Giá Vốn 12 Tháng Trước Khi Kết Chuyển 911

## 1. Vấn đề thực tế kiểm toán
Rất nhiều doanh nghiệp tại Việt Nam không hạch toán kết chuyển giá vốn đều đặn từng tháng, mà để chi phí treo trên TK 154/156 trong suốt 11 tháng đầu năm, rồi đến **Tháng 12 mới làm bút toán kết chuyển dồn toàn bộ sang 632 và 911**. 
- Nếu nhìn vào số liệu kết chuyển cuối cùng (`Nợ 911 / Có 632`), biểu đồ và bảng phân tích 11 tháng đầu năm sẽ bằng 0 hoặc bẹp dí, trong khi Tháng 12 vọt lên bất thường.
- **Giải pháp**: Hệ thống phải **bóc tách chi phí phát sinh thực tế 12 tháng TRƯỚC KHI kết chuyển sang 911** (Pre-closing cost breakdown):
  1. **Loại bỏ triệt để các bút toán kết chuyển 911** (`e.debitAccount.startsWith('911') || e.creditAccount.startsWith('911')`).
  2. **Theo dõi chi phí sản xuất & mua hàng phát sinh thực tế trong kỳ (Input Incurred)**:
     - Nợ 621 (Chi phí NVL trực tiếp)
     - Nợ 622 (Chi phí nhân công trực tiếp)
     - Nợ 627 (Chi phí sản xuất chung)
     - Nợ 154 (Chi phí SXKD dở dang tập hợp)
     - Nợ 156 (Mua hàng hóa nhập kho)
  3. **Bóc tách phát sinh Nợ 632 theo tài khoản đối ứng gốc**:
     - Nợ 632 / Có 156 (Xuất kho hàng hóa)
     - Nợ 632 / Có 155 (Xuất kho thành phẩm)
     - Nợ 632 / Có 154 (Chi phí SX/dịch vụ hoàn thành đưa thẳng vào giá vốn)
     - Nợ 632 / Có khác (Chi phí mua ngoài đưa thẳng vào giá vốn)
  4. **Đối chiếu vi phạm nguyên tắc phù hợp (Matching Principle)**:
     - So sánh Doanh thu (511) $\leftrightarrow$ Chi phí SX thực tế $\leftrightarrow$ Giá vốn hạch toán (632) để chỉ ra rủi ro dồn chi phí cuối năm.

---

## 2. Cấu trúc dữ liệu trong `src/domain/analytics/types.ts`

```typescript
export interface CogsBreakdownMonthRow {
  month: number // 1..12
  monthLabel: string // "Tháng 01"...
  
  // 1. Chi phí sản xuất phát sinh thực tế trong tháng (Trước kết chuyển)
  directMaterials621: Money // Nợ 621
  directLabor622: Money     // Nợ 622
  overhead627: Money        // Nợ 627
  wipIncurred154: Money     // Nợ 154
  inventoryPurchased156: Money // Nợ 156 mua hàng nhập kho
  totalProductionCost: Money // 621 + 622 + 627 (hoặc 154)

  // 2. Giá vốn xuất bán hạch toán vào 632 theo tài khoản đối ứng gốc
  cogsTradeGoods156: Money   // Nợ 632 / Có 156
  cogsFinishedGoods155: Money // Nợ 632 / Có 155
  cogsServiceWip154: Money   // Nợ 632 / Có 154
  cogsDirectOther: Money     // Nợ 632 đối ứng TK khác (111, 112, 331...)
  totalCogs632: Money        // Tổng phát sinh NỢ 632 trong tháng (không tính 911)

  // 3. Doanh thu & Tỷ lệ so sánh
  revenue511: Money          // Doanh thu Có 511
  cogsToRevenuePct: number   // % Giá vốn / Doanh thu
  prodCostToRevenuePct: number // % Chi phí SX / Doanh thu
  
  // 4. Cảnh báo kiểm toán (Audit Flags)
  auditFlag: string | null
  isLumpSumYearEnd: boolean  // Cờ báo dồn giá vốn cuối năm
  isSuspiciousDeferred: boolean // Cờ báo treo chi phí 154 không kết chuyển
}

export interface Cogs12MMatrixReport {
  rows: CogsBreakdownMonthRow[]
  annualTotals: {
    directMaterials621: Money
    directLabor622: Money
    overhead627: Money
    wipIncurred154: Money
    inventoryPurchased156: Money
    totalProductionCost: Money
    cogsTradeGoods156: Money
    cogsFinishedGoods155: Money
    cogsServiceWip154: Money
    cogsDirectOther: Money
    totalCogs632: Money
    revenue511: Money
  }
  businessType: 'MANUFACTURING' | 'TRADING' | 'HYBRID'
  summaryWarnings: string[]
}
```

---

## 3. Triển khai trong `FinancialCorrelationEngine.ts`
- Thêm hàm `public static computeCogs12MMatrix(entries: JournalEntry[]): Cogs12MMatrixReport`.
- Loại bỏ toàn bộ bút toán có `e.debitAccount.startsWith('911') || e.creditAccount.startsWith('911')`.
- Quét và bóc tách các tài khoản Nợ 621, 622, 627, 154, 156 và Nợ 632 theo cặp đối ứng.
- Tự động nhận diện loại hình doanh nghiệp:
  - Nếu phát sinh chủ yếu 621, 622, 627, 154 $\rightarrow$ `MANUFACTURING` (Sản xuất / Xây lắp).
  - Nếu phát sinh chủ yếu 156 $\rightarrow$ 632 $\rightarrow$ `TRADING` (Thương mại).
  - Có cả hai $\rightarrow$ `HYBRID`.
- Sinh cảnh báo kiểm toán chuẩn mực VSA 520.
