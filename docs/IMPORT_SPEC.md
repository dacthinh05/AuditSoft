# IMPORT_SPEC.md — Smart Import không phụ thuộc tên sheet

## 0. Kết quả Phase 0 — inspect workbook mẫu (READ-ONLY)

Workbook mẫu: `D:\Desktop\Back-up\Samples\NKC MAU 20242.xlsx` (8 sheet, khớp §0 prompt).
File này là **template rỗng** (NKC 0 dòng dữ liệu, CDFS 0 MATK) → cấu trúc đã verify thêm trên
`NKC Mayer 2025 - new.xlsx` (3.795 dòng thật, cùng họ template).

| Sheet | rows×cols | Header tại dòng | Ghi chú |
|---|---|---|---|
| sai sot & luu y | 37×8 | r1/r8 | metadata KH "CÔNG TY TNHH SX KIM LOẠI CHÍNH XÁC REGENT VIỆT NAM", niên độ 31/12/2025, Cty KT "BẮC ĐẨU" |
| NKC | 5143×16 | **r2** | r1 = SUBTOTAL; helper A..P; template rỗng |
| CDFS | 61×22 | **r3** | merges `K1:L1`, `M1:N1` ("SỐ KẾ TOÁN"/"LỆCH"); MATK rỗng trong template |
| KQKD | 61×15 | r1 | MS 01–70; cột C `VLOOKUP(#REF!)` hỏng; E từ SUMIF cặp TK (r25–36); G hardcode năm trước |
| Thong Ke Thue | 61×24 | r2/r4 | VAT theo tháng, đối chiếu qua sheet TK |
| Gia thanh | 37×7 | r1/r7 | NVL/Nhân công/Khấu hao/DV mua ngoài/Khác |
| CDKT | 119×11 | r2 | B01-DN, SUMIF từ CDFS!A:A (TKM), check cân `C56=C98` |
| TK | 38×36 | r2 | SUMIF theo khóa `Thang-TK3*` — chính là "monthly engine" cần thay |

### Quan sát bắt buộc phải xử lý (đã gặp thật)

1. Header NKC ở dòng 2, phía trên là dòng SUBTOTAL → header detection scan ≥50 dòng.
2. Helper pair column trôi vị trí giữa các file (P ↔ Q) → không bao giờ đọc helper.
3. TK ghi dạng số (`E=11220`) lẫn chuỗi (`'13111'`) → coerce an toàn.
4. KQKD chứa `#REF!`, link ngoài `[1]NKC!...` → bỏ giá trị công thức lỗi, tự tính lại.
5. Dòng rỗng đuôi file vẫn chứa shared formula → skip blank bằng kiểm tra nội dung.
6. Mô tả VN+CN trộn, có khoảng trắng đầu dòng.
7. Ngày là Date object hoặc serial; có thể là chuỗi dd/MM/yyyy ở file khác.

## 1. Pipeline import

```
file (.xlsx/.xlsm/.csv)
  → WorkbookReader      : đọc 1 lần toàn bộ matrix giá trị (formula→cached result,
                          richText→text, Date giữ object)
  → SheetClassifier     : từng sheet → { type, confidence, evidence[] }
  → chọn sheet tốt nhất cho GENERAL_LEDGER / TRIAL_BALANCE / INCOME_STATEMENT
    (confidence < 0.6 → đánh dấu Needs Review, không silently guess)
  → HeaderDetector      : tìm dòng header (scan 1..50) theo dictionary
  → ColumnSemanticDetector: map cột theo alias (VN có dấu/không dấu/EN)
  → Normalizer          : GL → JournalEntry[], TB → TrialBalanceRow[], IS → IncomeStatementLine[]
  → DataQualityReport
```

CSV đi qua parser RFC4180 hiện có (`infrastructure/excel/csvTable.ts`) rồi vào pipeline như matrix.

## 2. Alias dictionary (chuẩn hóa: NFC + UPPER + bỏ dấu + gộp space + bỏ `. , : - ( )`)

### GENERAL_LEDGER
| semantic | alias (ví dụ) |
|---|---|
| postingDate | NGÀY, NGAY, NGÀY CT, NGÀY CHỨNG TỪ, NGÀY HẠCH TOÁN, POSTING DATE, DOCUMENT DATE |
| documentNumber | SỐ CT, SO CT, SỐ CHỨNG TỪ, SỐ PHIẾU, VOUCHER NO, DOCUMENT NO |
| description | NỘI DUNG, NOI DUNG, DIỄN GIẢI, NỘI DUNG NGHIỆP VỤ, DESCRIPTION, MEMO |
| debitAccount | TK NỢ, TKNO, TAI KHOAN NO, DEBIT ACCOUNT, TKN |
| creditAccount | TK CÓ, TKCO, TAI KHOAN CO, CREDIT ACCOUNT, TKC |
| amount | SỐ TIỀN, SO TIEN, THÀNH TIỀN, SỐ TIỀN VND, AMOUNT, GIÁ TRỊ |
| exchangeRate | TỶ GIÁ, TY GIA, EXCHANGE RATE |
| foreignAmount | USD, NGOẠI TỆ, NGUYÊN TỆ, FOREIGN AMOUNT |
| objectCode | MÃ KH, MA KH, MÃ ĐỐI TƯỢNG, MÃ KHÁCH HÀNG, ĐỐI TƯỢNG, CUSTOMER CODE, VENDOR CODE |
| customerName | TÊN KH, TEN KH, TÊN ĐỐI TƯỢNG, CUSTOMER NAME |

Điểm cốt lõi GL: `debitAccount + creditAccount + amount` phải có; `postingDate/description` tăng confidence.

### TRIAL_BALANCE
`account` (MATK, MÃ TK, TÀI KHOẢN, ACCOUNT CODE), `accountName` (TENTK, TÊN TK, ACCOUNT NAME),
`openingDebit/openingCredit` (SDNDK/SDCDK, SỬ DỤNG… SỐ DƯ ĐẦU…), `movementDebit/movementCredit`
(PS NO/PS CO, PHÁT SINH NỢ/CÓ), `closingDebit/closingCredit` (NO CK/CO CK, SỐ DƯ CUỐI…).
Cần `account` + ≥2 trong 4 nhóm số dư/phát sinh.

### INCOME_STATEMENT
`maSo` (MS, MÃ SỐ), `chiTieu` (CHỈ TIÊU), `currentYear` (NĂM NAY, CURRENT YEAR, KỲ NÀY),
`priorYear` (NĂM TRƯỚC, PRIOR YEAR, KỲ TRƯỚC). Fallback semantic: nếu cột chiTieu chứa
≥3 nhãn chuẩn ("DOANH THU BAN HANG…", "GIA VON HANG BAN", "LOI NHUAN GOP", …) → IS.

Confidence = matchedCore / totalCore, cộng bonus nếu nhiều alias hiếm khớp. Type của sheet = argmax;
trả về cả danh sách classification đầy đủ để UI hiển thị "Detected ✓ … 97%".

## 3. Quy tắc normalize dòng GL

- Skip dòng blank (tất cả ô mapping đều rỗng) — kể cả khi ô helper có formula.
- `normalizeAccount`: number→`String(Math.trunc)` qua BigInt để tránh scientific notation; trim; chỉ giữ `[0-9A-Z]`.
- `parseMoney`: hỗ trợ `1234567.89`, `'1.000.000'`, `'1,000,000.00'`, `(500)` âm.
- `parseDateCell`: serial | Date | ISO | dd/MM/yyyy | dd-Mon-yy.
- Âm lượng, thiếu TK, thiếu ngày → ghi `issues[]`, **vẫn giữ entry** (§43).
- `month` từ postingDate (dùng cho monthly analytics); thiếu ngày → month=null.

## 4. KQKD rebuild (khi sheet KQKD hỏng link ngoài)

Từ GL tự dựng: `01`=Σ Có(511*) − Có(521* hướng giảm)... chuẩn TT200:
`10=01−02`, `20=10−11` (11=Σ Nợ 632*), `30=20+21−22−24−25`, `40=31−32`,
`50=30+40`, `60=50−51−52`. Cặp đối ứng loại trừ nội bộ (511↔33311 là VAT — 33311 không vào doanh thu;
911 kết chuyển nhận diện qua TK 911). Ưu tiên dùng sheet KQKD khi cột số hợp lệ; rebuild làm cross-check.

## 5. Needs Review UI contract

`ImportResult.needsReview: SheetClassification[]` + mapping đề xuất; user override bằng tay →
normalizer chạy lại với mapping thủ công (không tự đoán lại).

## 6. Kết quả audit (đã verify trên workbook thật `NKC Mayer 2025 - new.xlsx`)

- Chọn sheet GL dùng tie-breaker: **confidence → name-prior (NKC/GL/…) → số dòng dữ liệu** —
  tránh chọn nhầm sheet phụ trùng cấu trúc (vd. `1111` là sổ chi tiết tiền mặt).
- Header trùng tên (KQKD có 2 cột "Năm nay"): `duplicateColumns` lưu tất cả ứng viên,
  `pickNumericColumn()` chọn cột có nhiều giá trị số nhất trong sample → tự bỏ qua cột #REF!.
- Dung sai đối chiếu mặc định **0,5 VND**; phương trình CĐSPS cho phép nhiễu < 0,01
  (số thực nguồn sinh dấu phẩy động dư cuối).
- Sheet 16k cột (format thừa kiểu A271) bị chặn ở 512 cột / 1 triệu ô mỗi sheet.
- Đã kiểm chứng end-to-end: GL 3.795 entries, quality 99.6%, **recon PASS 104/104 TK,
  cân Nợ=Có**, KQKD đọc đúng cột E (bỏ cột C hỏng), risk engine chạy đủ rule.
- Còn lại (phase sau): wire CSV vào ExcelImportService (parser RFC4180 đã có);
  đọc metadata hồ sơ từ sheet "sai sot & luu y".
