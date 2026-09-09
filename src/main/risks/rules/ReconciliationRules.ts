import { absMoney, addMoney, MONEY_ZERO, subtractMoney, type Money } from '../../../domain/money'
import { formatVnd } from '../../../shared/utils/moneyFormat'
import { materialityScore } from '../../analytics/MaterialityEngine'
import type { AuditRule } from '../AuditRuleEngine'

/** GL_DEBIT_CREDIT_MISMATCH — tổng Nợ ≠ Có của NKC (§9) → CRITICAL. */
export const glDebitCreditMismatchRule: AuditRule = {
  id: 'GL_DEBIT_CREDIT_MISMATCH',
  description: 'Tổng phát sinh Nợ ≠ Có trên NKC',
  evaluate(ctx) {
    const rec = ctx.reconciliation
    if (!rec || rec.balanced) return []
    const diff = subtractMoney(rec.totalGlDebit, rec.totalGlCredit)
    return [
      {
        ruleId: this.id,
        clusterKey: 'BALANCED',
        title: 'NKC không cân: tổng Nợ khác tổng Có',
        category: 'RECONCILIATION',
        observation:
          `Tổng PS Nợ ${formatVnd(rec.totalGlDebit)} ≠ tổng PS Có ${formatVnd(rec.totalGlCredit)} ` +
          `(lệch ${formatVnd(diff)}). Sổ kế toán kép bị phá vỡ — ưu tiên xử lý trước các phân tích khác.`,
        currentValue: formatVnd(rec.totalGlDebit),
        difference: formatVnd(diff),
        scores: { materiality: 40, anomaly: 30, timing: 0, pattern: 10 },
        reasons: ['Σ Nợ − Σ Có ≠ 0 (dung sai 0 VND)'],
        auditImplication: 'Dữ liệu sổ sách chưa đảm bảo nguyên tắc kế toán kép.',
        recommendedProcedures: ['Truy vết dòng lệch theo tháng/TK', 'Kiểm tra import thiếu dòng một vế'],
        evidence: {},
      },
    ]
  },
}

/** RECON_ACCOUNT_DIFF — cụm lệch NKC ↔ CĐSPS (§8). */
export const reconAccountDiffRule: AuditRule = {
  id: 'RECON_ACCOUNT_DIFF',
  description: 'Chênh lệch phát sinh giữa NKC và CĐSPS',
  evaluate(ctx) {
    const rec = ctx.reconciliation
    if (!rec) return []
    const diffRows = rec.rows.filter((r) => r.status !== 'PASS')
    if (diffRows.length === 0) return []

    let totalAbs: Money = MONEY_ZERO
    for (const r of diffRows) {
      totalAbs = addMoney(totalAbs, addMoney(absMoney(r.diffDebit), absMoney(r.diffCredit)))
    }
    const hasError = diffRows.some((r) => r.status === 'ERROR')
    const scoreM = materialityScore(totalAbs, ctx.config.materiality.overall)
    return [
      {
        ruleId: this.id,
        clusterKey: 'GLTB',
        title: 'Không khớp giữa NKC và CĐSPS',
        category: 'RECONCILIATION',
        observation:
          `${diffRows.length} tài khoản có phát sinh lệch giữa NKC và CĐSPS, tổng độ lớn lệch ${formatVnd(totalAbs)}. ` +
          `App không mặc định bên nào đúng — cần drill-down từng TK. Ví dụ: ` +
          diffRows
            .slice(0, 5)
            .map((r) => `${r.account} (GL ${formatVnd(r.glDebit)} vs TB ${formatVnd(r.tbDebit)})`)
            .join('; '),
        scores: { materiality: scoreM, anomaly: 20, timing: 0, pattern: 0 },
        reasons: [
          'Ngưỡng so từng cột > dung sai',
          `Số TK lệch: ${diffRows.length}${hasError ? ' (có TK lỗi nghiêm trọng — một bên không có dữ liệu)' : ''}`,
        ],
        auditImplication: 'Hai nguồn dữ liệu không đồng nhất — phải làm rõ trước khi dùng cho phân tích sâu.',
        recommendedProcedures: ['Xuất bảng đối chiếu chi tiết', 'Kiểm tra phạm vi kỳ và phạm vi TK của hai nguồn'],
        evidence: { accounts: diffRows.map((r) => r.account).slice(0, 50) },
      },
    ]
  },
}


/** TB_EQUATION_BROKEN — DK+PS≠CK hoặc cả Nợ/Có cùng dư (§9). */
export const tbEquationBrokenRule: AuditRule = {
  id: 'TB_EQUATION_BROKEN',
  description: 'CĐSPS vi phạm phương trình số dư',
  evaluate(ctx) {
    if (ctx.tbEquationIssues.length === 0) return []
    return [
      {
        ruleId: this.id,
        clusterKey: 'EQ',
        title: 'CĐSPS có dòng vi phạm Đầu kỳ + Phát sinh = Cuối kỳ',
        category: 'RECONCILIATION',
        observation:
          `${ctx.tbEquationIssues.length} tài khoản vi phạm phương trình số dư, ví dụ: ` +
          ctx.tbEquationIssues
            .slice(0, 5)
            .map((i) => `${i.account}: ${i.issue}`)
            .join('; ') +
          '. Không tự sửa số — đề xuất lấy lại dữ liệu từ phần mềm kế toán.',
        scores: { materiality: 16, anomaly: 20, timing: 0, pattern: 0 },
        reasons: ['DK + PS ≠ CK hoặc Nợ/Có cuối kỳ cùng > 0'],
        auditImplication: 'Cấu trúc số dư CĐSPS không nhất quán.',
        recommendedProcedures: ['Yêu cầu xuất lại CĐSPS', 'Đối chiếu với sổ cái phần mềm'],
        evidence: { accounts: ctx.tbEquationIssues.map((i) => i.account).slice(0, 50) },
      },
    ]
  },
}
