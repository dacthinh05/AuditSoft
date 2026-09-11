import type {
  AnalysisResult,
  IncomeStatementData,
  JournalEntry,
  JournalRowDTO,
} from '../../../shared/types/analytics'
import { makeMoney } from '../../../domain/money'

export function dtoToEntries(rows: JournalRowDTO[]): JournalEntry[] {
  return rows.map((row) => ({
    id: row.id,
    source: { fileName: '', sheetName: '', rowNumber: 0 },
    postingDate: row.date,
    documentNumber: row.doc,
    description: row.desc,
    debitAccount: row.debit,
    creditAccount: row.credit,
    amount: makeMoney(BigInt(Math.round(row.amount)), 0),
    foreignAmount: null,
    exchangeRate: null,
    objectCode: null,
    customerName: null,
    month: row.month,
    issues: [],
  }))
}

export function dtoToKqkd(kqkd: AnalysisResult['kqkd']): IncomeStatementData | null {
  if (!kqkd || !kqkd.lines) return null
  return {
    lines: kqkd.lines.map((l) => ({
      maSo: l.maSo,
      chiTieu: l.chiTieu,
      current: l.current != null ? makeMoney(BigInt(Math.round(l.current)), 0) : null,
      prior: l.prior != null ? makeMoney(BigInt(Math.round(l.prior)), 0) : null,
    })),
    source: null,
  }
}

export function dtoToCdfsMap(tb?: AnalysisResult['trialBalance']): Map<string, { matk: string; tentk: string; sdndk?: number; sdcdk?: number; psndk?: number; pscdk?: number; nock?: number; cock?: number }> {
  const map = new Map<string, { matk: string; tentk: string; sdndk?: number; sdcdk?: number; psndk?: number; pscdk?: number; nock?: number; cock?: number }>()
  if (!tb || !Array.isArray(tb)) return map

  for (const r of tb) {
    map.set(r.account, {
      matk: r.account,
      tentk: r.accountName,
      sdndk: r.openingDebit,
      sdcdk: r.openingCredit,
      psndk: r.movementDebit,
      pscdk: r.movementCredit,
      nock: r.closingDebit,
      cock: r.closingCredit,
    })
  }
  return map
}
