import { moneyFromNumber } from '../../../domain/money'
import { formatVnd } from '../../../shared/utils/moneyFormat'
import { materialityScore } from '../../analytics/MaterialityEngine'
import { scaleMoney, type AuditRule } from '../AuditRuleEngine'

const CTT_RATIO_FOR_WEEKEND = 50_000_000

/** YEAR_END_JOURNAL_CLUSTER — bút toán cuối kỳ nhóm ưu tiên (§15.2). */
export const yearEndJournalClusterRule: AuditRule = {
  id: 'YEAR_END_JOURNAL_CLUSTER',
  description: 'Cụm bút toán phát sinh trong cửa sổ cuối kỳ',
  evaluate(ctx) {
    const pm = ctx.config.materiality.performance
    if (!ctx.yearEnd.byPriorityAccounts) return []
    if (ctx.yearEnd.total.raw < pm.raw) return []
    const scoreM = materialityScore(ctx.yearEnd.total, ctx.config.materiality.overall)
    return [
      {
        ruleId: this.id,
        clusterKey: 'YEAREND',
        title: 'Nhiều bút toán trọng yếu phát sinh sát ngày khóa sổ',
        category: 'JOURNAL_ENTRY',
        observation:
          `Có ${ctx.yearEnd.ids.length} bút toán trong ${ctx.config.yearEndWindowDays} ngày cuối kỳ, tổng ${formatVnd(ctx.yearEnd.total)} ` +
          `(≥ PM). Đề xuất rà soát cutoff và hồ sơ chứng từ của các bút toán này.`,
        currentValue: formatVnd(ctx.yearEnd.total),
        scores: { materiality: scoreM, anomaly: 10, timing: 15, pattern: 0 },
        reasons: [
          `Cửa sổ: ${ctx.config.yearEndWindowDays} ngày trước ${ctx.config.fiscalYearEnd.replace('-', '/')}`,
          `Tổng ${formatVnd(ctx.yearEnd.total)} ≥ PM`,
        ],
        auditImplication: 'Bút toán cuối kỳ tiềm ẩn rủi ro cutoff — cần xem xét, chưa kết luận sai sót.',
        recommendedProcedures: ['Lọc bút toán theo khoảng ngày cuối kỳ', 'Kiểm tra chứng từ kèm theo từng bút toán'],
        evidence: { journalEntryIds: ctx.yearEnd.ids },
      },
    ]
  },
}

/** ROUND_NUMBER_JOURNALS — bút toán tròn số (§15.1). */
export const roundNumberJournalsRule: AuditRule = {
  id: 'ROUND_NUMBER_JOURNALS',
  description: 'Bút toán tròn số cần rà soát',
  evaluate(ctx) {
    const omMin = scaleMoney(ctx.config.materiality.overall, 0.1)
    if (ctx.roundNumbers.count === 0 || ctx.roundNumbers.total.raw < omMin.raw) return []
    return [
      {
        ruleId: this.id,
        clusterKey: 'ROUND',
        title: 'Nhiều bút toán tròn số trị giá lớn',
        category: 'JOURNAL_ENTRY',
        observation:
          `${ctx.roundNumbers.count} bút toán có giá trị lặp tròn số (chia hết ${formatVnd(moneyFromNumber(Number(ctx.config.thresholds.roundDivisor)))}) ` +
          `với tổng ${formatVnd(ctx.roundNumbers.total)}. Tròn số không đồng nghĩa bất thường — liệt kê để rà soát.`,
        currentValue: formatVnd(ctx.roundNumbers.total),
        scores: { materiality: materialityScore(ctx.roundNumbers.total, ctx.config.materiality.overall), anomaly: 8, timing: 0, pattern: 5 },
        reasons: [`Số JE ≥ ngưỡng và tổng ≥ OM×10% (${formatVnd(omMin)})`],
        auditImplication: 'Đặc thù giao dịch tròn số cần được giải trình bằng hợp đồng/chứng từ.',
        recommendedProcedures: ['Soi từng bút toán với hợp đồng/đơn hàng', 'Ưu tiên các bút toán gần cuối kỳ'],
        evidence: { journalEntryIds: ctx.roundNumbers.ids },
      },
    ]
  },
}

/** WEEKEND_ENTRIES — chứng từ T7/CN khi DN không chạy cuối tuần (§15.3). */
export const weekendEntriesRule: AuditRule = {
  id: 'WEEKEND_ENTRIES',
  description: 'Bút toán hạch toán cuối tuần bất thường',
  evaluate(ctx) {
    const ctt = moneyFromNumber(CTT_RATIO_FOR_WEEKEND)
    if (ctx.weekend.share >= ctx.config.thresholds.weekendShareThreshold) return []
    const weekendSet = new Set(ctx.weekend.ids)
    const materialWeekend = ctx.entries.filter((e) => weekendSet.has(e.id) && e.amount.raw >= ctt.raw)
    if (materialWeekend.length < 3) return []
    const total = materialWeekend.reduce((a, e) => a + e.amount.raw, 0n)
    return [
      {
        ruleId: this.id,
        clusterKey: 'WEEKEND',
        title: 'Bút toán cuối tuần với giá trị material',
        category: 'JOURNAL_ENTRY',
        observation:
          `${materialWeekend.length} bút toán T7/CN ≥ CTT, tổng ${formatVnd({ raw: total, scale: 0 })}. ` +
          `Tỷ lệ cuối tuần toàn DN chỉ ${(ctx.weekend.share * 100).toFixed(1).replace('.', ',')}% — đề xuất xác nhận tính chất giao dịch.`,
        scores: { materiality: 8, anomaly: 6, timing: 5, pattern: 5 },
        reasons: [`Share weekend DN < ${(ctx.config.thresholds.weekendShareThreshold * 100).toFixed(0)}%`, '≥3 JE weekend ≥ CTT'],
        auditImplication: 'Chỉ dấu cần xem xét — không kết luận sai phạm.',
        recommendedProcedures: ['Đối chiếu sao kê ngân hàng/ngày thực hiện', 'Hỏi khách hàng về quy trình duyệt chi cuối tuần'],
        evidence: { journalEntryIds: materialWeekend.map((e) => e.id) },
      },
    ]
  },
}

/** DUPLICATE_JOURNAL_GROUPS — trùng lặp exact + near-dup (§15.6). */
export const duplicateJournalGroupsRule: AuditRule = {
  id: 'DUPLICATE_JOURNAL_GROUPS',
  description: 'Nhóm bút toán trùng lặp/near-duplicate',
  evaluate(ctx): RawFindingList {
    const raws: RawFindingList = []

    if (ctx.duplicates.exact.length > 0) {
      const ids = ctx.duplicates.exact.flatMap((g) => g.ids)
      raws.push({
        ruleId: this.id,
        clusterKey: 'EXACTDUP',
        title: 'Có nhóm bút toán trùng lặp hoàn toàn',
        category: 'JOURNAL_ENTRY',
        observation:
          `${ctx.duplicates.exact.length} nhóm bút toán trùng ngày+số CT+TK Nợ/Có+số tiền. ` +
          `Không tự kết luận ghi trùng sổ — đề xuất đối chiếu chứng từ gốc.`,
        scores: { materiality: 8, anomaly: 10, timing: 0, pattern: 10 },
        reasons: ['Trùng đủ: ngày | số CT | TK nợ | TK có | số tiền'],
        auditImplication: 'Cần xác định bản chất: ghi trùng hay nghiệp vụ lặp hợp lệ.',
        recommendedProcedures: ['Đối chiếu hóa đơn/hợp đồng của từng nhóm', 'Hỏi khách hàng quy trình nhập liệu'],
        evidence: { journalEntryIds: ids.slice(0, 200) },
      })
    }
    if (ctx.duplicates.nearDuplicate.length > 0) {
      raws.push({
        ruleId: this.id,
        clusterKey: 'NEARDUP',
        title: 'Có bút toán giống nhau nhưng khác số chứng từ',
        category: 'JOURNAL_ENTRY',
        observation:
          `${ctx.duplicates.nearDuplicate.length} nhóm cùng ngày+TK+N+C+tiền nhưng khác số CT — có thể là thanh toán nhiều đợt hợp lệ. Liệt kê để rà soát.`,
        scores: { materiality: 4, anomaly: 5, timing: 0, pattern: 5 },
        reasons: ['Near-dup: ngày | TK | tiền giống, số CT khác'],
        auditImplication: 'Chỉ dấu tham khảo.',
        recommendedProcedures: ['Rà soát dòng tiền tương ứng'],
        evidence: { journalEntryIds: ctx.duplicates.nearDuplicate.flatMap((g) => g.ids).slice(0, 200) },
      })
    }
    return raws
  },
}

/** RARE_COUNTER_ACCOUNT — cặp đối ứng hiếm học từ chính dữ liệu (§15.4). */
export const rareCounterAccountRule: AuditRule = {
  id: 'RARE_COUNTER_ACCOUNT',
  description: 'Cặp TK đối ứng hiếm gặp với giá trị material',
  evaluate(ctx) {
    if (ctx.rarePairs.length === 0) return []
    const top = ctx.rarePairs.slice(0, 10)
    const total = ctx.rarePairs.reduce((a, p) => (p.total.raw > 0n ? { raw: a.raw + p.total.raw, scale: p.total.scale } : a), moneyFromNumber(0))
    return [
      {
        ruleId: this.id,
        clusterKey: 'RAREPAIR',
        title: 'Cặp tài khoản đối ứng hiếm gặp với giá trị trọng yếu',
        category: 'JOURNAL_ENTRY',
        observation:
          `${ctx.rarePairs.length} cặp TK xuất hiện ≤ ${ctx.config.thresholds.rarePairMaxCount} lần nhưng tổng ≥ CTT ` +
          `(tổng cộng ${formatVnd(total)}), ví dụ: ` +
          top.map((p) => `Nợ ${p.debit}/Có ${p.credit} (${formatVnd(p.total)})`).slice(0, 5).join('; ') +
          '. Đề xuất xem xét tính phù hợp của quan hệ đối ứng.',
        scores: { materiality: 12, anomaly: 10, timing: 0, pattern: 12 },
        reasons: [
          `Ngưỡng: count ≤ ${ctx.config.thresholds.rarePairMaxCount}, share ≤ ${String(ctx.config.thresholds.rarePairMaxShare * 100).replace('.', ',')}%, total ≥ CTT`,
        ],
        auditImplication: 'Quan hệ đối ứng lạ cần được giải trình — chưa kết luận sai sót.',
        recommendedProcedures: ['Xem diễn giải từng bút toán của cặp TK', 'Đối chiếu với nghiệp vụ kinh tế phát sinh'],
        evidence: { accounts: top.flatMap((p) => [p.debit, p.credit]) },
      },
    ]
  },
}

/** MANUAL_KEYWORD_JOURNALS — keyword thủ công gần cuối kỳ & material (§15.5). */
export const manualKeywordJournalsRule: AuditRule = {
  id: 'MANUAL_KEYWORD_JOURNALS',
  description: 'Bút toán thủ công (điều chỉnh/phân bổ/kết chuyển…) trọng yếu',
  evaluate(ctx) {
    const idSet = new Set(ctx.manualIds)
    const ctt = ctx.config.materiality.clearlyTrivial
    const rows = ctx.entries.filter((e) => idSet.has(e.id) && e.amount.raw >= ctt.raw)
    if (rows.length === 0) return []
    const yearEndSet = new Set(ctx.yearEnd.ids)
    const nearYearEnd = rows.filter((e) => yearEndSet.has(e.id)).length
    return [
      {
        ruleId: this.id,
        clusterKey: 'MANUAL',
        title: 'Bút toán thủ công/trị giá lớn theo diễn giải',
        category: 'JOURNAL_ENTRY',
        observation:
          `${rows.length} bút toán có diễn giải thuộc nhóm điều chỉnh/phân bổ/kết chuyển/trích trước… với giá trị ≥ CTT` +
          `${nearYearEnd > 0 ? `, trong đó ${nearYearEnd} nằm sát cuối kỳ` : ''}. Đây là khu vực ưu tiên kiểm tra hồ sơ.`,
        scores: { materiality: 10, anomaly: 6, timing: nearYearEnd > 0 ? 10 : 0, pattern: 8 },
        reasons: [`Keyword matching trên NỘI DUNG (không dùng đơn lẻ để kết luận)`, `≥ CTT ${formatVnd(ctt)}: ${rows.length} dòng`],
        auditImplication: 'Bút toán điều chỉnh cần hồ sơ đầy đủ — chưa kết luận sai sót.',
        recommendedProcedures: ['Thu thập bảng tính/biên bản kèm bút toán điều chỉnh', 'Kiểm tra phê duyệt nội bộ'],
        evidence: { journalEntryIds: rows.map((e) => e.id).slice(0, 300) },
      },
    ]
  },
}

type RawFindingList = import('../../../shared/types/analytics').RawFinding[]
