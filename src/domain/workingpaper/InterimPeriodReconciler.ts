import fs from 'node:fs'
import path from 'node:path'
import ExcelJS from 'exceljs'
import type { CdfsAccountRow, NkcTransaction, WorkingPaperFillContext } from './types'

export interface InterimPeriodBalances {
  /** Map mã tài khoản -> số dư chốt đợt 1 tại 30/06 (đọc từ bộ GLV đợt 1) */
  period1Balances: Map<string, number>
  /** Map mã tài khoản -> số dư/phát sinh lũy kế 6 tháng đầu năm tính từ sổ đợt 2 */
  period2AtInterimBalances: Map<string, number>
}

/**
 * Trích xuất toàn bộ số dư đã chốt tại ngày 30/06 từ thư mục Giấy làm việc Đợt 1
 * Ưu tiên đọc từ tệp Master A - B - H (sheet bcdsps-Truoc DC), hoặc các tệp phần hành.
 */
export async function extractPeriod1BalancesFromWpDir(
  interimDirOrPath: string,
): Promise<Map<string, number>> {
  const result = new Map<string, number>()
  if (!fs.existsSync(interimDirOrPath)) return result

  let filesToScan: string[] = []
  if (fs.statSync(interimDirOrPath).isDirectory()) {
    filesToScan = fs
      .readdirSync(interimDirOrPath)
      .filter((f) => f.endsWith('.xlsx') && !f.startsWith('~$'))
      .map((f) => path.join(interimDirOrPath, f))
  } else if (interimDirOrPath.endsWith('.xlsx')) {
    filesToScan = [interimDirOrPath]
  }

  // 1. Ưu tiên tìm file Master A - B - H
  const abhFile = filesToScan.find((f) => path.basename(f).startsWith('A'))
  if (abhFile) {
    try {
      const wb = new ExcelJS.Workbook()
      await wb.xlsx.readFile(abhFile)
      const ws =
        wb.getWorksheet('bcdsps-Truoc DC') ||
        wb.getWorksheet('bcdsps-TruocDC') ||
        wb.getWorksheet('bcdsps-Dung Bao cao')

      if (ws) {
        for (let r = 6; r <= ws.rowCount; r++) {
          const row = ws.getRow(r)
          const matk = String(row.getCell(4).value || '').trim()
          if (!matk) continue

          const noCK = Number(row.getCell(8).value || 0)
          const coCK = Number(row.getCell(9).value || 0)
          const bal = Math.abs(noCK || coCK || 0)
          result.set(matk, bal)
        }
      }
    } catch {
      // ignore
    }
  }

  // 2. Quét bổ sung từ các file Lead Schedule nếu chưa có trong A-B-H
  for (const f of filesToScan) {
    const bName = path.basename(f)
    if (bName.startsWith('A') || bName.startsWith('Leadsheet')) continue

    try {
      const wb = new ExcelJS.Workbook()
      await wb.xlsx.readFile(f)
      // Tìm các sheet Lead schedule x10 (vd G210, D110, D310, D510, E110, E210...)
      const leadSheet = wb.worksheets.find((s) => /^[A-Z]\s*\d10$/i.test(s.name.trim()))
      if (leadSheet) {
        for (let r = 10; r <= 30; r++) {
          const row = leadSheet.getRow(r)
          const tk = String(row.getCell(1).value || '').trim()
          if (!tk || tk.includes('formula') || tk.length < 3) continue

          // Số trước kiểm toán hoặc số sau kiểm toán (Cột D hoặc F)
          const valD = Number(row.getCell(4).value || 0)
          const valF = Number(row.getCell(6).value || 0)
          const val = valF > 0 ? valF : valD
          if (val > 0 && !result.has(tk)) {
            result.set(tk, val)
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return result
}

/**
 * Tính toán số dư hoặc phát sinh lũy kế đến ngày 30/06 (6 tháng đầu năm) từ sổ kế toán Đợt 2
 */
export function computePeriod2InterimBalances(
  cdfsAccounts: Map<string, CdfsAccountRow>,
  transactions: NkcTransaction[],
): Map<string, number> {
  const result = new Map<string, number>()

  // 1. Gom phát sinh Nợ và Có của 6 tháng đầu năm (tháng 1 đến 6)
  const debit6M = new Map<string, number>()
  const credit6M = new Map<string, number>()

  for (const t of transactions) {
    if (t.month && (t.month < 1 || t.month > 6)) continue

    const d = t.debit.trim()
    const c = t.credit.trim()

    debit6M.set(d, (debit6M.get(d) || 0) + t.amount)
    credit6M.set(c, (credit6M.get(c) || 0) + t.amount)

    // Cộng cho các cấp tài khoản mẹ 3 số, 4 số
    if (d.length > 3) {
      const d3 = d.slice(0, 3)
      debit6M.set(d3, (debit6M.get(d3) || 0) + t.amount)
    }
    if (c.length > 3) {
      const c3 = c.slice(0, 3)
      credit6M.set(c3, (credit6M.get(c3) || 0) + t.amount)
    }
  }

  // 2. Tính số dư 30/06 cho từng tài khoản
  for (const [matk, acc] of cdfsAccounts.entries()) {
    const isIncomeOrExpense = /^[5678]/.test(matk)

    if (isIncomeOrExpense) {
      // Tài khoản Doanh thu (511, 515, 711): Lấy phát sinh Có 6 tháng
      if (/^[57]/.test(matk)) {
        const psCo = credit6M.get(matk) ?? 0
        result.set(matk, psCo)
      } else {
        // Tài khoản Chi phí & Giá vốn (632, 641, 642, 811): Lấy phát sinh Nợ 6 tháng
        const psNo = debit6M.get(matk) ?? 0
        result.set(matk, psNo)
      }
    } else {
      // Tài khoản Bảng cân đối kế toán (loại 1, 2, 3, 4)
      const sdNoDK = acc.sdndk ?? 0
      const sdCoDK = acc.sdcdk ?? 0
      const psNo = debit6M.get(matk) ?? 0
      const psCo = credit6M.get(matk) ?? 0

      if (/^[12]/.test(matk)) {
        // Tài sản: Dư Nợ 30/06 = Đầu năm + Nợ 6M - Có 6M
        const bal = Math.max(0, sdNoDK + psNo - psCo)
        result.set(matk, bal)
      } else {
        // Nợ phải trả và Nguồn vốn (loại 3, 4): Dư Có 30/06 = Đầu năm + Có 6M - Nợ 6M
        const bal = Math.max(0, sdCoDK + psCo - psNo)
        result.set(matk, bal)
      }
    }
  }

  return result
}

/**
 * Xây dựng toàn diện bộ số liệu đối chiếu 2 đợt (InterimPeriodBalances)
 */
export async function buildInterimPeriodBalances(
  interimWpDir: string | undefined,
  ctx: WorkingPaperFillContext,
): Promise<InterimPeriodBalances | undefined> {
  if (!interimWpDir || !fs.existsSync(interimWpDir)) {
    return undefined
  }

  const period1Balances = await extractPeriod1BalancesFromWpDir(interimWpDir)
  const period2AtInterimBalances = computePeriod2InterimBalances(
    ctx.cdfsAccounts,
    ctx.nkcTransactions,
  )

  return {
    period1Balances,
    period2AtInterimBalances,
  }
}
