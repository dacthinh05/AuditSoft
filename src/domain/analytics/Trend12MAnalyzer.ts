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
      // Khử dương tính giả: Bút toán kết chuyển 911 không tính vào doanh thu/chi phí hoạt động trong tháng
      if (e.debitAccount.startsWith('911') || e.creditAccount.startsWith('911')) continue
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
      const cellNotes: Record<number, string> = {}
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

            // Cổng trọng yếu kép: Tăng trưởng > 80% VÀ vượt mức bình quân VÀ độ nhảy tuyệt đối >= 50 triệu
            const diffJump = currentVal - prevVal
            const isMaterialJump = diffJump >= 50_000_000

            if (growth > 80 && currentVal > avgMonthlyNum && isMaterialJump) {
              anomalyMonths.push(m + 1)
            }
          } else if (currentVal > 0) {
            momGrowth.push(100)
            const isMaterialJump = currentVal >= 50_000_000
            if (currentVal > avgMonthlyNum * 1.5 && isMaterialJump) {
              anomalyMonths.push(m + 1)
            }
          } else {
            momGrowth.push(0)
          }
        }

        // Cảnh báo nếu một tháng vượt 150% mức trung bình năm VÀ chênh lệch tuyệt đối có ý nghĩa (>= 50tr)
        const diffFromAvg = currentVal - avgMonthlyNum
        if (avgMonthlyNum > 0 && currentVal > avgMonthlyNum * 1.5 && diffFromAvg >= 50_000_000 && !anomalyMonths.includes(m + 1)) {
          anomalyMonths.push(m + 1)
        }
      }
      if (anomalyMonths.length > 0) {
        warningNotes.push(
          `${def.label} (${def.accountPattern}): Phát hiện biến động đột biến tại Tháng ${anomalyMonths.join(', ')}. Cần kiểm tra chứng từ phát sinh lớn hoặc thủ tục cắt niên độ (Cut-off).`,
        )
      }

      // Ghi chú ngắn từng ô đột biến cho hover tooltip (≤ 2 dòng)
      for (const anomalyMonth of anomalyMonths) {
        const mIdx = anomalyMonth - 1
        const monthMoney = months[mIdx]
        const monthVal = monthMoney ? moneyToNumber(monthMoney) : 0
        const prevMoney = anomalyMonth >= 2 ? months[anomalyMonth - 2] : null
        const prevVal = prevMoney ? moneyToNumber(prevMoney) : 0
        const growth = anomalyMonth >= 2 ? (momGrowth[anomalyMonth - 2] ?? null) : null

        const fmtVnd = (num: number) => {
          const abs = Math.abs(num)
          if (abs >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)} tỷ`
          if (abs >= 1_000_000) return `${(num / 1_000_000).toFixed(1)} tr`
          return `${num.toLocaleString('vi-VN')} đ`
        }

        if (growth != null && prevVal > 0) {
          const direction = growth >= 0 ? 'Tăng' : 'Giảm'
          cellNotes[anomalyMonth] =
            `T${String(anomalyMonth).padStart(2, '0')}: ${fmtVnd(monthVal)} (${direction} ${Math.abs(growth)}% so với T${String(anomalyMonth - 1).padStart(2, '0')}: ${fmtVnd(prevVal)}) — rà soát chứng từ phát sinh lớn / cut-off.`
        } else if (avgMonthlyNum > 0 && monthVal > 0) {
          const multiple = (monthVal / avgMonthlyNum).toFixed(1)
          cellNotes[anomalyMonth] =
            `T${String(anomalyMonth).padStart(2, '0')}: ${fmtVnd(monthVal)} (Gấp ${multiple} lần bình quân tháng ${fmtVnd(avgMonthlyNum)}) — rà soát chứng từ phát sinh lớn / cut-off.`
        }
      }

      rows.push({
        key: def.key,
        label: def.label,
        accountPattern: def.accountPattern,
        months,
        total,
        momGrowth,
        anomalyMonths,
        cellNotes,
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
        const decCellNote = `Dồn giá vốn T12 (${decPct}% cả năm), DT đều ${activeRevMonths}/11 tháng — sai Matching Principle, rà soát nhập-xuất-tồn.`
        cogsRow.cellNotes = {
          ...cogsRow.cellNotes,
          12: cogsRow.cellNotes?.[12] ? `${cogsRow.cellNotes[12]} ${decCellNote}` : decCellNote,
        }
      }
    }

    return {
      rows,
      warningNotes,
    }
  }
}
