import type { Money } from '../money'
import {
  addMoney,
  MONEY_ZERO,
  moneyToNumber,
  sumMoney,
} from '../money'
import type { JournalEntry } from '../../shared/types/analytics'
import type { MonthlyTrendRow, Trend12MMatrix } from './types'

interface RowDefinition {
  key: string
  label: string
  accountPattern: string
  match: (e: JournalEntry) => boolean
}

export class Trend12MAnalyzer {
  private static DEFINITIONS: RowDefinition[] = [
    {
      key: 'REV_511',
      label: 'Doanh thu bán hàng & CCDV',
      accountPattern: 'Có 511',
      match: (e) => e.creditAccount.startsWith('511'),
    },
    {
      key: 'PUR_15X',
      label: 'Mua hàng tồn kho trong kỳ',
      accountPattern: 'Nợ 152, 153, 155, 156',
      match: (e) =>
        (e.debitAccount.startsWith('152') ||
          e.debitAccount.startsWith('153') ||
          e.debitAccount.startsWith('155') ||
          e.debitAccount.startsWith('156')) &&
        (e.creditAccount.startsWith('331') ||
          e.creditAccount.startsWith('111') ||
          e.creditAccount.startsWith('112')),
    },
    {
      key: 'COGS_632',
      label: 'Giá vốn hàng bán',
      accountPattern: 'Nợ 632',
      match: (e) => e.debitAccount.startsWith('632'),
    },
    {
      key: 'SELL_641',
      label: 'Chi phí bán hàng',
      accountPattern: 'Nợ 641',
      match: (e) => e.debitAccount.startsWith('641'),
    },
    {
      key: 'ADM_642',
      label: 'Chi phí quản lý doanh nghiệp',
      accountPattern: 'Nợ 642',
      match: (e) => e.debitAccount.startsWith('642'),
    },
    {
      key: 'FIN_EXP_635',
      label: 'Chi phí tài chính',
      accountPattern: 'Nợ 635',
      match: (e) => e.debitAccount.startsWith('635'),
    },
    {
      key: 'FIN_INC_515',
      label: 'Doanh thu hoạt động tài chính',
      accountPattern: 'Có 515',
      match: (e) => e.creditAccount.startsWith('515'),
    },
    {
      key: 'OTHER_EXP_811',
      label: 'Chi phí khác',
      accountPattern: 'Nợ 811',
      match: (e) => e.debitAccount.startsWith('811'),
    },
  ]

  public static analyze(entries: JournalEntry[]): Trend12MMatrix {
    const rawMatrix: Money[][] = Trend12MAnalyzer.DEFINITIONS.map(() =>
      Array.from({ length: 12 }, () => MONEY_ZERO),
    )

    // Duyệt qua từng bút toán
    for (const e of entries) {
      if (e.month == null || e.month < 1 || e.month > 12) continue
      const mIdx = e.month - 1

      for (let dIdx = 0; dIdx < Trend12MAnalyzer.DEFINITIONS.length; dIdx++) {
        const def = Trend12MAnalyzer.DEFINITIONS[dIdx]
        const row = rawMatrix[dIdx]
        if (def && row && def.match(e)) {
          const current = row[mIdx]
          if (current !== undefined) {
            row[mIdx] = addMoney(current, e.amount)
          }
        }
      }
    }

    const rows: MonthlyTrendRow[] = []
    const warningNotes: string[] = []

    for (let dIdx = 0; dIdx < Trend12MAnalyzer.DEFINITIONS.length; dIdx++) {
      const def = Trend12MAnalyzer.DEFINITIONS[dIdx]
      const months = rawMatrix[dIdx]
      if (!def || !months) continue
      const total = sumMoney(months)
      const totalNum = moneyToNumber(total)
      const avgMonthlyNum = totalNum > 0 ? totalNum / 12 : 0

      const momGrowth: Array<number | null> = []
      const anomalyMonths: number[] = []

      // Tính tăng trưởng MoM và phát hiện tháng đột biến
      for (let m = 0; m < 12; m++) {
        const currentMoney = months[m]
        const currentVal = currentMoney ? moneyToNumber(currentMoney) : 0

        if (m > 0) {
          const prevMoney = months[m - 1]
          const prevVal = prevMoney ? moneyToNumber(prevMoney) : 0
          if (prevVal > 0) {
            const growth = ((currentVal - prevVal) / prevVal) * 100
            momGrowth.push(Number(growth.toFixed(1)))

            // Nếu tăng trưởng > 80% so với tháng trước
            if (growth > 80 && currentVal > avgMonthlyNum) {
              anomalyMonths.push(m + 1)
            }
          } else if (currentVal > 0) {
            momGrowth.push(100)
            if (currentVal > avgMonthlyNum * 1.5) {
              anomalyMonths.push(m + 1)
            }
          } else {
            momGrowth.push(0)
          }
        }

        // Cảnh báo nếu một tháng vượt 150% mức trung bình năm
        if (avgMonthlyNum > 0 && currentVal > avgMonthlyNum * 1.5 && !anomalyMonths.includes(m + 1)) {
          anomalyMonths.push(m + 1)
        }
      }

      if (anomalyMonths.length > 0) {
        warningNotes.push(
          `${def.label} (${def.accountPattern}): Phát hiện biến động đột biến tại Tháng ${anomalyMonths.join(', ')}. Cần kiểm tra chứng từ phát sinh lớn hoặc thủ tục cắt niên độ (Cut-off).`,
        )
      }

      rows.push({
        key: def.key,
        label: def.label,
        accountPattern: def.accountPattern,
        months,
        total,
        momGrowth,
        anomalyMonths,
      })
    }
    // ── Kiểm tra bệnh dồn giá vốn cuối năm (VSA 330/520 – Matching Principle) ──
    const cogsRow = rows.find((r) => r.key === 'COGS_632')
    const revRow = rows.find((r) => r.key === 'REV_511')
    if (cogsRow && revRow) {
      const cogsTotal = moneyToNumber(cogsRow.total)
      const cogsDec = moneyToNumber(cogsRow.months[11]!)
      const revTotal = moneyToNumber(revRow.total)
      // Doanh thu 11 tháng đầu phát sinh đều (ít nhất 8/11 tháng có doanh thu)
      const activeRevMonths = revRow.months.slice(0, 11).filter((m) => moneyToNumber(m) > 0).length
      if (
        cogsTotal > 0 &&
        cogsDec / cogsTotal > 0.7 &&
        revTotal > 0 &&
        activeRevMonths >= 8
      ) {
        const decPct = Math.round((cogsDec / cogsTotal) * 100)
        warningNotes.push(
          `VSA 330/520 – Dồn giá vốn cuối năm: Giá vốn Tháng 12 chiếm ${decPct}% cả năm trong khi Doanh thu phát sinh đều ${activeRevMonths}/11 tháng trước. ` +
          `Doanh nghiệp có dấu hiệu không trích giá vốn từng tháng mà dồn toàn bộ vào cuối kỳ, vi phạm nguyên tắc phù hợp (Matching Principle). ` +
          `Cần rà soát bảng kê nhập-xuất-tồn, phương pháp tính giá vốn và chứng từ xuất kho Tháng 12.`,
        )
      }
    }

    return {
      rows,
      warningNotes,
    }
  }
}
