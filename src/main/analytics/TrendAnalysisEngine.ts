import { addMoney, moneyFromNumber, moneyToNumber, subtractMoney, type Money } from '../../domain/money'
import type { IncomeStatementData, KqkdComparison } from '../../shared/types/analytics'
import { growthPct } from './MaterialityEngine'

function line(data: IncomeStatementData, maSo: string): Money | null {
  return data.lines.find((l) => l.maSo === maSo)?.current ?? null
}
function linePrior(data: IncomeStatementData, maSo: string): Money | null {
  return data.lines.find((l) => l.maSo === maSo)?.prior ?? null
}

function num(m: Money | null): number | null {
  return m == null ? null : moneyToNumber(m)
}

/** Phân tích dọc + ngang KQKD nay vs trước (§10/§11). */
export function analyzeIncomeStatement(data: IncomeStatementData): KqkdComparison {
  const zero = moneyFromNumber(0)
  const rev01 = line(data, '01')
  const rev02 = line(data, '02')
  const revCur = line(data, '10') ?? (rev01 != null || rev02 != null ? subtractMoney(rev01 ?? zero, rev02 ?? zero) : null)
  const revPri = linePrior(data, '10')
  const cogsCur = line(data, '11')
  const cogsPri = linePrior(data, '11')
  const gpCur = line(data, '20') ?? (revCur && cogsCur ? subtractMoney(revCur, cogsCur) : null)
  const gpPri = linePrior(data, '20') ?? (revPri && cogsPri ? subtractMoney(revPri, cogsPri) : null)

  const marginOf = (profit: number | null, revenue: number | null): number | null =>
    profit != null && revenue != null && revenue !== 0 ? profit / revenue : null

  const opCur = line(data, '30')
  const opPri = linePrior(data, '30')
  const netCur = line(data, '60')
  const netPri = linePrior(data, '60')

  const revCurN = num(revCur)
  const revPriN = num(revPri)

  const linesOut: KqkdComparison['lines'] = data.lines.map((l) => {
    const curN = num(l.current)
    const priN = num(l.prior)
    const absoluteChange =
      l.current != null && l.prior != null
        ? subtractMoney(l.current, l.prior)
        : l.current != null && l.prior == null
          ? l.current
          : null
    return {
      maSo: l.maSo,
      chiTieu: l.chiTieu,
      current: l.current,
      prior: l.prior,
      absoluteChange,
      pctChange: curN != null && priN != null ? growthPct(curN, priN) : null,
      pctOfRevenueCurrent: curN != null && revCurN ? curN / Math.abs(revCurN) : null,
      pctOfRevenuePrior: priN != null && revPriN ? priN / Math.abs(revPriN) : null,
    }
  })

  const gmCur = marginOf(num(gpCur), revCurN)
  const gmPri = marginOf(num(gpPri), revPriN)
  const omCur = marginOf(num(opCur), revCurN)
  const omPri = marginOf(num(opPri), revPriN)
  const nmCur = marginOf(num(netCur), revCurN)
  const nmPri = marginOf(num(netPri), revPriN)

  const adminCur = num(line(data, '25'))
  const adminPri = num(linePrior(data, '25'))
  const sellCur = num(line(data, '24'))
  const sellPri = num(linePrior(data, '24'))
  const finCostCur = num(line(data, '22'))
  const finCostPri = num(linePrior(data, '22'))

  return {
    lines: linesOut,
    metrics: {
      revenueGrowthPct: revCurN != null && revPriN != null ? growthPct(revCurN, revPriN) : null,
      grossMarginCurrent: gmCur,
      grossMarginPrior: gmPri,
      grossMarginChangePP: gmCur != null && gmPri != null ? (gmCur - gmPri) * 100 : null,
      operatingMarginCurrent: omCur,
      operatingMarginPrior: omPri,
      netMarginCurrent: nmCur,
      netMarginPrior: nmPri,
      cogsGrowthPct: num(cogsCur) != null && num(cogsPri) != null ? growthPct(num(cogsCur)!, num(cogsPri)!) : null,
      adminExpenseGrowthPct: adminCur != null && adminPri != null ? growthPct(adminCur, adminPri) : null,
      sellingExpenseGrowthPct: sellCur != null && sellPri != null ? growthPct(sellCur, sellPri) : null,
      financeCostGrowthPct: finCostCur != null && finCostPri != null ? growthPct(finCostCur, finCostPri) : null,
    },
    hasPriorYear: data.lines.some((l) => l.prior != null),
  }
}

/** Dựng KQKD từ NKC khi sheet KQKD hỏng link ngoài (IMPORT_SPEC §4). */
export function rebuildIncomeStatementFromJournal(
  entries: readonly import('../../shared/types/analytics').JournalEntry[],
): IncomeStatementData {
  const sum = (pred: (e: import('../../shared/types/analytics').JournalEntry) => boolean): Money => {
    let acc = moneyFromNumber(0)
    for (const e of entries) if (pred(e)) acc = addMoney(acc, e.amount)
    return acc
  }
  const startsWithAny = (acc: string, prefixes: string[]) => prefixes.some((p) => acc.startsWith(p))

  // Khớp ngữ nghĩa workbook gốc: cặp đối ứng với 911 (kết chuyển) vẫn thuộc chỉ tiêu tương ứng
  const dt511 = sum((e) => startsWithAny(e.creditAccount, ['511']))
  const dt515 = sum((e) => startsWithAny(e.creditAccount, ['515']))
  const thuNhapKhac = sum((e) => startsWithAny(e.creditAccount, ['711']))
  const gvhb = sum((e) => startsWithAny(e.debitAccount, ['632']))
  const cpTc = sum((e) => startsWithAny(e.debitAccount, ['635']))
  const cpBh = sum((e) => startsWithAny(e.debitAccount, ['641']))
  const cpQldn = sum((e) => startsWithAny(e.debitAccount, ['642']))
  const cpKhac = sum((e) => startsWithAny(e.debitAccount, ['811']))

  const mk = (maSo: string, chiTieu: string, m: Money): import('../../shared/types/analytics').IncomeStatementLine => ({
    maSo,
    chiTieu,
    current: m,
    prior: null,
  })
  const zero = moneyFromNumber(0)
  const doanhThu = mk('01', 'Doanh thu bán hàng và cung cấp dịch vụ', dt511)
  const gvhbLine = mk('11', 'Giá vốn hàng bán', gvhb)
  const dtThuần = addMoney(doanhThu.current ?? zero, moneyFromNumber(0))
  const loiNhuanGop = subtractMoney(dtThuần, gvhbLine.current ?? zero)
  const loiNhuanThuan = subtractMoney(
    addMoney(loiNhuanGop, dt515),
    addMoney(addMoney(cpTc, cpBh), cpQldn),
  )
  const loiNhuanKhac = subtractMoney(thuNhapKhac, cpKhac)
  const truocThue = addMoney(loiNhuanThuan, loiNhuanKhac)

  return {
    lines: [
      doanhThu,
      mk('10', 'Doanh thu thuần', dtThuần),
      gvhbLine,
      mk('20', 'Lợi nhuận gộp', loiNhuanGop),
      mk('21', 'Doanh thu hoạt động tài chính', dt515),
      mk('22', 'Chi phí tài chính', cpTc),
      mk('24', 'Chi phí bán hàng', cpBh),
      mk('25', 'Chi phí quản lý doanh nghiệp', cpQldn),
      mk('30', 'Lợi nhuận thuần từ HĐKD', loiNhuanThuan),
      mk('31', 'Thu nhập khác', thuNhapKhac),
      mk('32', 'Chi phí khác', cpKhac),
      mk('40', 'Lợi nhuận khác', loiNhuanKhac),
      mk('50', 'Lợi nhuận trước thuế', truocThue),
    ],
    source: null,
  }
}
