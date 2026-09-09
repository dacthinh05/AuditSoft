import { describe, expect, it } from 'vitest'
import { ExcelImportService } from '../src/main/excel/ExcelImportService'
import { tmpDir, writeGlWorkbook, writeIsWorkbook, writeTbWorkbook } from './helpers/workbookFixtures'

const svc = new ExcelImportService()

function glRow(date: unknown, doc: string, desc: string, debit: unknown, credit: unknown, amount: number | string) {
  return { date, doc, desc, debit, credit, amount }
}

describe('Smart import — classification & header detection (§3/§4/§44)', () => {
  it('header ở dòng 1 chuẩn', async () => {
    const dir = tmpDir()
    const f = `${dir}/gl1.xlsx`
    await writeGlWorkbook(f, {
      rows: [glRow('2025-01-07', 'PT001', 'Mua hàng', '152', '331', 1_234_567)],
    })
    const res = await svc.importWorkbook(f)
    expect(res.selected.GENERAL_LEDGER).toBe('Sheet1')
    expect(res.journal?.headerRow).toBe(1)
    expect(res.journal?.entries).toHaveLength(1)
    expect(res.journal?.entries[0]?.debitAccount).toBe('152')
  })

  it('header ở dòng 2 phía trên có dòng SUBTOTAL (mô phỏng NKC mẫu)', async () => {
    const dir = tmpDir()
    const f = `${dir}/gl2.xlsx`
    await writeGlWorkbook(f, {
      subtotalAboveHeader: true,
      rows: [
        glRow(new Date(Date.UTC(2025, 0, 7)), 'PT001', 'Thanh toán', '331', '112', 500),
        glRow(new Date(Date.UTC(2025, 0, 8)), 'PT002', 'Nộp thuế', '333', '112', 250),
      ],
    })
    const res = await svc.importWorkbook(f)
    expect(res.journal?.headerRow).toBe(2)
    expect(res.journal?.entries).toHaveLength(2)
  })

  it('header ở dòng 8 với title phía trên + dòng trống', async () => {
    const dir = tmpDir()
    const f = `${dir}/gl8.xlsx`
    await writeGlWorkbook(f, {
      headerRowNumber: 8,
      titleAbove: 'CÔNG TY ABC — SỔ NHẬT KÝ CHUNG',
      blankRowsBetween: true,
      rows: [glRow('07/01/2025', 'PT001', 'Mua NVL', '1521', '3311', 900000)],
    })
    const res = await svc.importWorkbook(f)
    expect(res.journal?.headerRow).toBe(8)
    expect(res.journal?.entries[0]?.postingDate).toBe('2025-01-07')
    expect(res.journal?.entries[0]?.month).toBe(1)
  })

  it('alias không dấu và tiếng Anh', async () => {
    const dir = tmpDir()
    const f = `${dir}/alias.xlsx`
    await writeGlWorkbook(f, {
      headers: ['Ngay', 'So CT', 'Noi dung', 'TK NO', 'Tai khoan CO', 'So tien'],
      rows: [glRow('2025-02-01', 'PT002', 'Chi phí', '6428', '111', '1.500.000')],
    })
    const res = await svc.importWorkbook(f)
    expect(res.journal?.mapping.debitAccount).toBe(3)
    expect(res.journal?.entries[0]?.amount.raw).toBe(1500000n)

    const fEn = `${dir}/alias-en.xlsx`
    await writeGlWorkbook(fEn, {
      headers: ['Posting Date', 'Document No', 'Description', 'Debit Account', 'Credit Account', 'Amount'],
      rows: [glRow('2025-02-01', 'PT003', 'Expense', '642', '111', 2000)],
    })
    const resEn = await svc.importWorkbook(fEn)
    expect(resEn.selected.GENERAL_LEDGER).toBe('Sheet1')
    expect(resEn.journal?.entries[0]?.creditAccount).toBe('111')
  })

  it('merged header + formula cells + số lưu dạng text VN format', async () => {
    const dir = tmpDir()
    const f = `${dir}/mixed.xlsx`
    await writeGlWorkbook(f, {
      mergedDescriptionHeader: true,
      rows: [
        glRow(45658, 'PT001', 'Serial date', '152', '331', '2.500.000'),
        glRow('08/01/2025', 'PT002', 'Formula cell', '152', '331', 300),
        glRow('09/01/2025', 'PT003', 'Negative paren', '331', '152', '(400)'),
      ],
      formulaAmountRows: [2],
    })
    const res = await svc.importWorkbook(f)
    const e = res.journal!.entries
    expect(e).toHaveLength(3)
    // serial 45658 = 2025-01-01
    expect(e[0]!.postingDate).toBe('2025-01-01')
    // formula cached result
    expect(e[1]!.amount.raw).toBe(200000n)
    // text VN format
    expect(e[0]!.amount.raw).toBe(2500000n)
    // âm dạng ngoặc
    expect(e[2]!.amount.raw).toBe(-400n)
    expect(e[2]!.issues).toContain('NEGATIVE_AMOUNT')
  })

  it('dòng thiếu TK / thiếu tiền vẫn giữ lại kèm issues — không âm thầm bỏ (§43)', async () => {
    const dir = tmpDir()
    const f = `${dir}/bad.xlsx`
    await writeGlWorkbook(f, {
      rows: [
        glRow('2025-03-01', 'PT001', 'Thiếu TK có', '111', '', 100),
        glRow('2025-03-02', 'PT002', 'Thiếu tiền', '111', '511', ''),
        glRow('', 'PT003', 'Thiếu ngày', '111', '511', 50),
      ],
    })
    const res = await svc.importWorkbook(f)
    const e = res.journal!.entries
    expect(e).toHaveLength(3)
    expect(e[0]!.issues).toContain('MISSING_CREDIT_ACCOUNT')
    expect(e[1]!.issues).toContain('INVALID_AMOUNT')
    expect(e[2]!.issues).toContain('MISSING_DATE')
    expect(res.journal!.quality.validAmount).toBeLessThan(3)
  })

  it('TK dạng số (11220) và TK cấp con (64276/131T28-like)', async () => {
    const dir = tmpDir()
    const f = `${dir}/acc.xlsx`
    await writeGlWorkbook(f, {
      rows: [glRow('2025-04-01', 'KB001', 'Nạp tiền NH', 11220, 1111, 700), glRow('2025-04-02', 'PC001', 'CP QLDN', '64276', '1111', 50)],
    })
    const res = await svc.importWorkbook(f)
    expect(res.journal!.entries[0]!.debitAccount).toBe('11220')
    expect(res.journal!.entries[1]!.debitAccount).toBe('64276')
  })
})

describe('Import đa sheet — TB & KQKD & UNKNOWN', () => {
  it('classify TRIAL_BALANCE theo nội dùng dù tên sheet lạ', async () => {
    const dir = tmpDir()
    const f = `${dir}/tb.xlsx`
    await writeTbWorkbook(f, [{ account: '11213', name: 'NH Noi Doi', sdndk: 100, psNo: 50, psCo: 20, noCk: 130 }], 'DATA')
    const res = await svc.importWorkbook(f)
    expect(res.classifications.find((c) => c.sheetName === 'DATA')?.type).toBe('TRIAL_BALANCE')
    expect(res.trialBalance).toHaveLength(1)
    expect(res.trialBalance[0]!.account).toBe('11213')
    expect(res.trialBalanceSource?.rowNumber).toBeGreaterThanOrEqual(1)
  })

  it('classify INCOME_STATEMENT theo mã số + nhãn chuẩn', async () => {
    const dir = tmpDir()
    const f = `${dir}/is.xlsx`
    await writeIsWorkbook(f, [
      { maSo: '01', chiTieu: 'Doanh thu bán hàng và cung cấp dịch vụ', current: 1200, prior: 1000 },
      { maSo: '11', chiTieu: 'Giá vốn hàng bán', current: 700, prior: 650 },
      { maSo: '60', chiTieu: 'Lợi nhuận sau thuế thu nhập doanh nghiệp', current: 90, prior: 80 },
    ])
    const res = await svc.importWorkbook(f)
    expect(res.selected.INCOME_STATEMENT).toBeDefined()
    const l10 = res.incomeStatement?.lines.find((l) => l.maSo === '01')
    expect(l10?.current?.raw).toBe(1200n)
    expect(l10?.prior?.raw).toBe(1000n)
  })

  it('KQKD chứa #REF! → bỏ giá trị lỗi, không crash', async () => {
    const dir = tmpDir()
    const f = `${dir}/is-ref.xlsx`
    await writeIsWorkbook(f, [
      { maSo: '01', chiTieu: 'Doanh thu bán hàng và cung cấp dịch vụ', current: null, prior: null },
      { maSo: '11', chiTieu: 'Giá vốn hàng bán', current: 500, prior: null },
    ])
    const res = await svc.importWorkbook(f)
    const l01 = res.incomeStatement?.lines.find((l) => l.maSo === '01')
    expect(l01?.current ?? null).toBeNull()
  })
})
