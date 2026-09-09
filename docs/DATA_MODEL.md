# DATA_MODEL.md — Mô hình dữ liệu chuẩn hóa

> App: **Audit Analytics Desktop** — nhập NKC + CĐSPS + KQKD → phân tích rủi ro kiểm toán deterministic.
> Mọi số tiền dùng `Money { raw: bigint, scale: number }` (`src/domain/money.ts`) — **không** dùng float cho phép tính.

## 1. Nguồn dữ liệu (workbook mẫu `NKC MAU 20242.xlsx` + họ workbook thực tế)

| Sheet | Vai trò | Dùng cho MVP |
|---|---|---|
| `NKC` | Nhật ký chung | ✅ nguồn giao dịch |
| `CDFS` | Cân đối phát sinh (CĐSPS) | ✅ đối chiếu |
| `KQKD` | Kết quả kinh doanh (nay + trước) | ✅ phân tích xu hướng |
| `CDKT` | Bảng cân đối kế toán (khung B01-DN) | Phase sau |
| `Thong Ke Thue` | Tổng hợp VAT theo tháng | Phase sau |
| `Gia thanh` | Chi phí theo yếu tố | Phase sau |
| `TK` | "Engine" SUMIF theo tháng–TK của Excel | **thay thế bằng TypeScript** |
| `sai sot & luu y` | Metadata hồ sơ + kết luận KT | Phase metadata |

### 1.1. Cấu trúc NKC (đã verify cả template & workbook thật)

- **Dòng header KHÔNG cố định dòng 1** (thường là dòng 2, phía trên có dòng SUBTOTAL). Phát hiện động theo semantic.
- Header chuẩn: `NGÀY, SỐ CT, NỘI DUNG, TK NỢ, TK CÓ, SỐ TIỀN, TỶ GIÁ, USD, MÃ KH, TÊN KH` + cột helper (`Thang, N3, C3, A, B, ...`).
- **KHÔNG phụ thuộc cột helper** — vị trí helper trôi giữa các file (template: pair ở P; Mayer: ở Q). App tự tính month/prefix/pair.
- Ô ngày: `Date object` hoặc serial; TK đôi khi là **number** (`11220`) — bắt buộc coerce chuỗi không mất số 0/scientific notation.
- Diễn giải: tiếng Việt + tiếng Trung trộn. Dòng rỗng đuôi file chứa shared formula → phải skip blank.
- Dòng 1: `SUBTOTAL(9,G:G)` tổng tiền — dùng làm sanity-check (không phải dữ liệu).

### 1.2. Cấu trúc CDFS

Header dòng 3: `TKM | MATK | TENTK | SDNDK | SDCDK | PS No | PS Co | No CK | Co CK`
+ khối gộp `SỐ KẾ TOÁN (No CK / Co CK)` + `LỆCH` + khối USD `P..U`.
Lưu ý: `PS No/Co`, `No CK/Co CK` trong file là **công thức SUMIF từ NKC** — app tự tính lại từ GL, chỉ đọc `MATK/TENTK/SDNDK/SDCDK` (+ số kế toán nếu có).

### 1.3. Cấu trúc KQKD

`MS | CHỈ TIÊU | Năm nay | Tỉ trọng | Năm nay(đã tính) | Tỉ trọng | Năm trước | ...`
- Cột "Năm nay" gốc thường là `VLOOKUP(...,#REF!)` — **link ngoài hỏng**, tuyệt đối không tin.
- Các dòng hidden 25–36: SUMIF theo cặp TK (`511-911`, `911-632`, …) → cách file tự dựng số. App dựng lại từ NKC.
- `G` = số năm trước hardcode → dùng khi user không import KQKD năm trước riêng.
- Danh mục mã số chuẩn §0 (01…70) map bằng **mã số + keyword chỉ tiêu**, không theo vị trí dòng.

## 2. Kiểu dữ liệu chuẩn hóa (src/shared/types/analytics.ts)

```ts
interface SourceRef { fileName: string; sheetName: string; rowNumber: number }

type RowIssueCode =
  | 'MISSING_DATE' | 'INVALID_DATE' | 'MISSING_DEBIT_ACCOUNT' | 'MISSING_CREDIT_ACCOUNT'
  | 'INVALID_AMOUNT' | 'ZERO_AMOUNT' | 'NEGATIVE_AMOUNT' | 'INVALID_DEBIT_FORMAT'
  | 'INVALID_CREDIT_FORMAT' | 'MISSING_DOCUMENT'

interface JournalEntry {
  id: string                    // `${fileName}::${sheetName}::${rowNumber}`
  source: SourceRef             // traceability §34 — không bao giờ mất
  postingDate: string | null    // yyyy-MM-dd (ISO) hoặc null
  documentNumber: string | null
  description: string           // giữ nguyên văn (VN+CN), đã TRIM
  debitAccount: string          // '13111' — chuỗi số, prefix-based
  creditAccount: string
  amount: Money                 // bigint fixed-point
  foreignAmount?: Money         // cột USD
  exchangeRate?: number
  objectCode?: string           // MÃ KH
  customerName?: string
  month: number | null          // 1..12 từ postingDate
  issues: RowIssueCode[]        // chất lượng dòng — KHÔNG âm thầm bỏ dòng
}

interface TrialBalanceRow {
  account: string               // MATK nguyên bản ('11213')
  accountName: string
  openingDebit: Money; openingCredit: Money
  movementDebit: Money; movementCredit: Money   // nếu file chỉ có PS → dùng; nếu không có → null-safe zero
  closingDebit: Money; closingCredit: Money
  source: SourceRef
}

interface IncomeStatementLine {
  maSo: string                  // '01'..'70'
  chiTieu: string
  current: Money | null         // năm nay (từ KQKD sheet hoặc rebuild từ GL)
  prior: Money | null           // năm trước
}
```

## 3. Aggregates (in-memory, Map-based — §42)

```ts
AccountStats { account; name?; debitTurnover; creditTurnover; count; firstDate?; lastDate? }
PairStats    { debit; credit; count; total; firstDate?; lastDate }        // key `${debit}>${credit}` level-3
MonthlyBucket{ month: 1..12; debit; credit; count }
```

Roll-up theo prefix (§7, §35): `aggregateByPrefix(entries, depth)` — `64276` dồn về `642` khi so năm trước chỉ có `6427`.

## 4. Finding object (§27)

`AuditFinding` gồm: `id, ruleId, title, riskLevel(CRITICAL..INFO), category, observation (tiếng Việt),
currentValue?, priorValue?, difference?, percentageChange?, materialityImpact?,
reasons[], auditImplication, recommendedProcedures[], evidence { journalEntryIds?, accounts?, months? },
explanation[] (§29: rule + threshold + giá trị so sánh), score (explainable, tổng điểm thành phần).`

Nguyên tắc văn bản §28/§48: chỉ dùng *unusual / requires review / potential cutoff risk / material fluctuation /
reconciliation difference* — cấm kết luận gian lận/sai sót khi chưa có bằng chứng.

## 5. Data Quality (§43)

`DataQualityReport`: % ngày/TK nợ/TK có/số tiền hợp lệ, số dòng thiếu số CT, dòng trùng lặp, số tiền âm,
TK không hợp lệ; `score` 0–100; `reliable: boolean`. Nếu score < ngưỡng cấu hình → gắn cảnh báo
"Analysis reliability reduced" vào mọi finding. Không drop dòng lỗi — giữ lại kèm `issues`.
