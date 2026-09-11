import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fillExpenseWorkingPaper } from '../src/domain/workingpaper/fillers/G200_ExpenseFiller'
import { OpenXmlPackageEditor } from '../src/domain/workingpaper/openxml/OpenXmlPackageEditor'
import type { NkcTransaction, WorkingPaperFillContext } from '../src/domain/workingpaper/types'

function txn(debit: string, credit: string, month: number, amount: number): NkcTransaction {
  return {
    rowNum: month,
    dateStr: '',
    dateVal: null,
    docNo: '',
    desc: '',
    debit,
    credit,
    amount,
    month,
  }
}

function baseCtx(txns: NkcTransaction[]): WorkingPaperFillContext {
  return {
    engagement: {
      clientName: 'Công ty Test',
      fiscalYearEnd: '31/12/2026',
    },
    cdfsAccounts: new Map(),
    nkcTransactions: txns,
  }
}

describe('G353/G453 monthly expense fill (OpenXML Engine)', () => {
  it('điền thành công vào file mẫu G200 bằng OpenXmlPackageEditor', () => {
    const templatePath = path.resolve('GLV MAU/G200 - 300 - 400 -  Mau 2025 - Thinh.xlsx')
    if (!fs.existsSync(templatePath)) return

    const editor = OpenXmlPackageEditor.load(templatePath)
    const res = fillExpenseWorkingPaper(
      editor,
      baseCtx([
        txn('6412', '111', 3, 112860000),
        txn('6412', '111', 6, 138730000),
        txn('6418', '111', 9, 5113908),
        txn('131', '5111', 3, 4194660900),
        txn('131', '5111', 9, 5759930300),
      ]),
    )

    expect(res.success).toBe(true)
    expect(res.sheetsUpdated).toContain('ADD')
    expect(res.sheetsUpdated).toContain('G210')
  })

  it('xử lý an toàn khi thiếu sheet hoặc sheet vắng', () => {
    const templatePath = path.resolve('GLV MAU/G200 - 300 - 400 -  Mau 2025 - Thinh.xlsx')
    if (!fs.existsSync(templatePath)) return

    const editor = OpenXmlPackageEditor.load(templatePath)
    const res = fillExpenseWorkingPaper(editor, baseCtx([txn('6412', '111', 3, 100)]))
    expect(res.success).toBe(true)
  })
})
