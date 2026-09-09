# RISK_ENGINE_SPEC.md — Engine rủi ro kiểm toán (deterministic)

## 1. Nguyên tắc

1. **Observation ≠ Misstatement** (§28/§48): finding chỉ nêu *quan sát bất thường + khuyến nghị thủ tục*.
   Cấm: "Fraud detected", "Ghi nhận sai", "Trốn thuế".
2. **Explainable** (§29): mỗi finding kèm `explanation[]` — rule id, ngưỡng, giá trị hiện tại/trước đó, materiality.
3. **Materiality gating** (§13): % tăng cao nhưng số nhỏ → không HIGH; % vừa nhưng chênh lớn → có thể material.
4. **Clustering** (§47): rule trả về 1 finding CỤM kèm evidence (số JE, tổng tiền), drill-down ở UI.
5. **False positive control** (§46): mỗi rule khai `minAmount`, `minMaterialityRatio`, `minCount`, và chỉ chạy
   khi dữ liệu đủ (vd. không có KQKD năm trước → bỏ qua rule so sánh).

## 2. Kiến trúc

```
RiskContext {
  entries: JournalEntry[]              // GL năm hiện tại
  accountStats / pairStats / monthly   // từ JournalAnalyticsEngine
  reconciliation                       // NKC ↔ CĐSPS
  isAnalysis?                          // KQKD nay vs trước
  dataQuality
  config: RiskConfig {                 // toàn bộ ngưỡng — ghi lại vào explanation
    materiality: MaterialityConfig     // OM / PM / CTT (Money)
    fiscalYearEnd: 'MM-DD'             // mặc định 12-31
    yearEndWindowDays: number          // mặc định 4
    grossMarginDropPP / revenueGrowthPct / expenseGrowthPct ...
    weekendShareThreshold, rarePairMaxShare, roundDivisor...
  }
}

interface AuditRule {
  id: string; category: FindingCategory; description: string
  applicable(ctx): boolean
  evaluate(ctx): RawFinding[]
}
```

`AuditRuleEngine.run(ctx)` → gom `RawFinding[]`, lọc theo gate của từng rule, tính `score`
(= Σ điểm thành phần khai báo sẵn: materialityScore + anomalyScore + timingScore + patternScore),
map sang `AuditFinding` (id ổn định `${ruleId}:${clusterKey}`), sort theo severity→score.

## 3. Bộ rule MVP (mỗi rule = 1 file)

| Rule ID | Category | Điều kiện phát (gợi ý mặc định) | Severity |
|---|---|---|---|
| GL_DEBIT_CREDIT_MISMATCH | RECONCILIATION | Σ Nợ ≠ Σ Có NKC (> tolerance 1 VND) | CRITICAL |
| RECON_ACCOUNT_DIFF | RECONCILIATION | GL vs CĐSPS lệch > tolerance theo MATK; cụm theo TK | ERROR nếu ≥ PM×0.1, WARNING nhỏ hơn |
| TB_EQUATION_BROKEN | RECONCILIATION | DK + PS ≠ CK (theo nature TK) hoặc Σ Nợ ≠ Σ Có CĐSPS | ERROR |
| REVENUE_FLUCTUATION | REVENUE | \|growth\| ≥ 20% VÀ \|Δ\| ≥ PM; so KQKD/G rebuild | HIGH/MEDIUM |
| GROSS_MARGIN_SHIFT | COGS | GM đổi ≥ 3 pp VÀ ΔCOGS ≥ PM | HIGH |
| DECEMBER_REVENUE_CONCENTRATION | REVENUE | share T12 ≥ 2× trung bình T1–T11 VÀ tiền T12 ≥ PM | HIGH |
| YEAR_END_JOURNAL_CLUSTER | JOURNAL_ENTRY | bút toán nhóm ưu tiên trong window cuối kỳ, tổng ≥ PM | HIGH/MEDIUM |
| ROUND_NUMBER_JOURNALS | JOURNAL_ENTRY | amount chia hết 100tr (hoặc ≥7 chữ số 0) VÀ ≥ OM×10% | MEDIUM |
| WEEKEND_ENTRIES | JOURNAL_ENTRY | T7/CN khi weekend-share DN < 5%, cụm ≥ CTT | LOW/MEDIUM |
| DUPLICATE_JOURNAL_GROUPS | JOURNAL_ENTRY | exact dup (date+doc+N+C+tien) hoặc near-dup khác số CT | MEDIUM |
| RARE_COUNTER_ACCOUNT | JOURNAL_ENTRY | pair count < 3 VÀ share < 2% tài khoản VÀ total ≥ CTT | MEDIUM |
| MANUAL_KEYWORD_JOURNALS | JOURNAL_ENTRY | keyword (DIEU CHINH, PHAN BO, TRICH TRUOC, HOAN NHAP, KET CHUYEN…) gần cuối kỳ & material | MEDIUM |
| NEGATIVE_REVENUE | REVENUE | Có(511*) âm hoặc Nợ(511*) thuần > 0 bất thường | INFO/HIGH |
| NEW_MATERIAL_ACCOUNT | EXPENSE… | TK phát sinh năm nay, không có năm trước (TB/GL trước), movement ≥ PM | MEDIUM |

Mỗi rule khai rõ `minAmount/minRatio/minCount` + `applicable()` (vd. rule so sánh năm cần prior data).
Mục tiêu: hàng trăm raw anomaly → ≤ ~15 finding cụm có ý nghĩa.

## 4. Scoring (explainable)

```
score = materialityScore(0..40: tỷ lệ amount/OM) 
      + anomalyScore(0..30: độ lệch %/σ/share)
      + timingScore(0..15: year-end/cutoff)
      + patternScore(0..15: rare pair/dup/manual keyword)
```
Ngưỡng hiển thị severity: ≥80 CRITICAL, ≥60 HIGH, ≥35 MEDIUM, >0 LOW, 0 INFO.
Điểm từng thành phần ghi vào `explanation[]`.

## 5. Monthly concentration (thay sheet TK)

`MonthlyAnalyticsEngine` bucket theo tháng cho nhóm TK chuẩn:
REVENUE 511*, COGS 632*, SELLING 641*, ADMIN 642*, FIN_COST 635*, CASH 111*/112*,
RECEIVABLE 131*, PAYABLE 331*, INVENTORY 151–157*, VAT_IN 133*, VAT_OUT 33311*.
Chỉ số: share/tháng, max-month, spike = month > mean(T1–T11) + 2σ VÀ month-amount ≥ CTT.

## 6. Prior-year comparison (§35)

So sánh ở **nhiều tầng prefix** (3-digit và 4-digit): map account năm nay về prefix sâu nhất có
ở năm trước. Account mới = có movement nay, không tồn tại trước → indication (không kết luận).
Drill-down vẫn giữ chi tiết subaccount.

## 8. Ghi nhận từ audit trên dữ liệu thật

- **So sánh kỳ lệch nhau**: file D1 (6 tháng) so cả năm trước sẽ luôn ra
  REVENUE_FLUCTUATION HIGH. Workbook gốc xử lý bằng cột "Tương đương tháng năm trước"
  (G/12×số tháng). Phase sau thêm config `currentPeriodMonths/priorPeriodMonths` để
  annualize trước khi so — hiện tại finding vẫn kèm explanation rõ ràng nên KV không bị误导.
- Weekend/rare-pair/manual rules đều có gate CTT/count nên không spam trên dữ liệu 3.795 dòng
  (chỉ 6 findings, trong đó 1 HIGH có giải thích nguyên nhân kỳ).
- 162 dòng trùng lặp hoàn toàn trong dữ liệu thật được cụm thành 1 finding EXACTDUP (đúng §47).

> "Doanh thu tăng 34,2% so với năm trước, trong đó tháng 12 chiếm 28,7% doanh thu năm
> (trung bình tháng T1–T11: 6,7%). Đề xuất kiểm toán: rà soát cutoff và tính hữu hiệu của
> doanh thu cuối kỳ." — [Xem 47 bút toán]

## 7. Wording (vi-VN) — mẫu bắt buộc

> "Doanh thu tăng 34,2% so với năm trước, trong đó tháng 12 chiếm 28,7% doanh thu năm
> (trung bình tháng T1–T11: 6,7%). Đề xuất kiểm toán: rà soát cutoff và tính hữu hiệu của
> doanh thu cuối kỳ." — [Xem 47 bút toán]

Cấu trúc observation luôn: **con số → so sánh → đề xuất thủ tục**, không phán xét.
