import { describe, it, expect } from 'vitest'
import ExcelJS from 'exceljs'
import path from 'node:path'
import fs from 'node:fs'
import { fillRevenueWorkingPaper } from '../src/domain/workingpaper/fillers/G100_RevenueFiller'
import { OpenXmlPackageEditor } from '../src/domain/workingpaper/openxml/OpenXmlPackageEditor'
import type { WorkingPaperFillContext, EngagementInfo, NkcTransaction, CdfsAccountRow } from '../src/domain/workingpaper/types'
import type { VatDeclarationSnapshot } from '../src/shared/types/taxAnalytics'
import AdmZip from 'adm-zip'
const ENGAGEMENT: EngagementInfo = {
  clientName: 'Công ty Cổ phần Doanh Thu Test',
  fiscalYearEnd: '31/12/2025',
  auditorName: 'KTV Test',
  auditFirmName: 'Công ty Kiểm toán Test',
}

function makeTxn(month: number, debit: string, credit: string, amount: number): NkcTransaction {
  return {
    rowNum: 1,
    dateStr: `15/${String(month).padStart(2, '0')}/2025`,
    dateVal: `15/${String(month).padStart(2, '0')}/2025`,
    docNo: 'HĐ001',
    desc: 'Bán hàng cung cấp dịch vụ',
    debit,
    credit,
    amount,
    month,
  }
}

function makeVat(month: number, c26_27: bigint, c28: bigint, c29: bigint): VatDeclarationSnapshot {
  const ind = (code: string, num: bigint) => ({ code, name: code, rawValue: String(num), numericValue: num })
  const total = c26_27 + c28 + c29
  return {
    taxpayerId: '0101234567',
    taxpayerName: 'CTY TEST',
    formCode: '01/GTGT',
    period: {
      type: 'MONTH',
      value: `Tháng ${month}/2025`,
      normalizedKey: `2025-M${String(month).padStart(2, '0')}`,
      year: 2025,
      month,
    },
    declarationType: 'ORIGINAL',
    indicators: {
      '26': ind('26', c26_27),
      '27': ind('27', 0n),
      '28': ind('28', c28),
      '29': ind('29', c29),
      '34': ind('34', total),
    },
  }
}

describe('G100 Revenue Working Paper Filler (Sheet G 150)', () => {
  it('điền chuẩn xác cả 2 khối Kê khai thuế và Sổ kế toán vào sheet G 150', async () => {
    const templatePath = path.resolve('GLV MAU', 'G100 - Doanh thu - Mau 2025- Thinh.xlsx')
    if (!fs.existsSync(templatePath)) {
      console.warn('Bỏ qua vì thiếu template G100.')
      return
    }

    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(templatePath)

    // Tháng 3: 0%=100tr, 5%=200tr, 10%=700tr (Tổng thuế=1 tỷ)
    // Sổ NKC: Có 511=950tr, Nợ 521=20tr, Có 711=50tr, Có 3387=10tr
    const decls: VatDeclarationSnapshot[] = [
      makeVat(3, 100_000_000n, 200_000_000n, 700_000_000n),
    ]

    const txns: NkcTransaction[] = [
      makeTxn(3, '131', '5111', 950_000_000),
      makeTxn(3, '5211', '131', 20_000_000),
      makeTxn(3, '112', '711', 50_000_000),
      makeTxn(3, '112', '3387', 10_000_000),
    ]

    const ctx: WorkingPaperFillContext = {
      engagement: ENGAGEMENT,
      cdfsAccounts: new Map(),
      nkcTransactions: txns,
      vatDeclarations: decls,
    }

    const res = fillRevenueWorkingPaper(wb, ctx)
    expect(res.success).toBe(true)
    expect(res.sheetsUpdated).toContain('G 150')

    const ws = wb.getWorksheet('G 150')!
    // Tháng 3: dòng 18 (15 + 3)
    const r18 = ws.getRow(18)

    // Khối Thuế: Cột B (0%), C (5%), D (10%)
    expect(Number(r18.getCell('B').value)).toBe(100_000_000)
    expect(Number(r18.getCell('C').value)).toBe(200_000_000)
    expect(Number(r18.getCell('D').value)).toBe(700_000_000)

    // Cột E: giữ nguyên công thức SUM
    const cellE = r18.getCell('E')
    expect(cellE.value).toBeDefined()
    if (typeof cellE.value === 'object' && cellE.value !== null && 'formula' in cellE.value) {
      expect(cellE.value.formula).toContain('SUM')
    }

    // Khối Sổ sách: Cột G (Có 511), H (Nợ 521), I (Có 711), J (Có 3387)
    expect(Number(r18.getCell('G').value)).toBe(950_000_000)
    expect(Number(r18.getCell('H').value)).toBe(20_000_000)
    expect(Number(r18.getCell('I').value)).toBe(50_000_000)
    expect(Number(r18.getCell('J').value)).toBe(10_000_000)

    // Cột K: giữ nguyên công thức chênh lệch
    const cellK = r18.getCell('K')
    expect(cellK.value).toBeDefined()

    // Bảo vệ dòng 29 không bao giờ sinh lỗi chuỗi '#DIV/0!'
    for (const col of ['B', 'C', 'D', 'G', 'I']) {
      const val = ws.getRow(29).getCell(col).value
      expect(String(val)).not.toContain('#DIV/0!')
    }
  })

  it('điền chuẩn xác OpenXmlPackageEditor: G 110 (tiểu khoản 51111), G 150 (12 tháng), G 191.1 (mapping D=Nợ, E=Có, F=VND), G 195 (hàng 14, ngày DD/MM/YYYY)', () => {
    const templatePath = path.resolve('GLV MAU', 'G100 - Doanh thu - Mau 2025- Thinh.xlsx')
    if (!fs.existsSync(templatePath)) return

    const editor = OpenXmlPackageEditor.load(templatePath)

    const cdfsMap = new Map<string, CdfsAccountRow>()
    cdfsMap.set('51111', { matk: '51111', tentk: 'Doanh thu bán hàng hóa chi tiết 1', sdndk: 0, sdcdk: 0, psno: 0, psco: 800_000_000, nock: 0, cock: 0 })
    cdfsMap.set('51112', { matk: '51112', tentk: 'Doanh thu bán hàng hóa chi tiết 2', sdndk: 0, sdcdk: 0, psno: 0, psco: 200_000_000, nock: 0, cock: 0 })
    cdfsMap.set('5112', { matk: '5112', tentk: 'Doanh thu bán thành phẩm', sdndk: 0, sdcdk: 0, psno: 0, psco: 500_000_000, nock: 0, cock: 0 })
    cdfsMap.set('711', { matk: '711', tentk: 'Thu nhập khác', sdndk: 0, sdcdk: 0, psno: 0, psco: 50_000_000, nock: 0, cock: 0 })

    const decls: VatDeclarationSnapshot[] = [
      makeVat(10, 50_000_000n, 100_000_000n, 850_000_000n),
    ]

    const txns: NkcTransaction[] = [
      {
        rowNum: 1,
        dateStr: 'Thu Jul 10 2025 07:00:00 GMT+0700 (Indochina Time)',
        dateVal: new Date(2025, 6, 10),
        docNo: 'HD00000008',
        desc: 'Doanh thu hợp đồng VP22',
        debit: '1311DBL',
        credit: '51111',
        amount: 22_000_000,
        month: 7,
      },
    ]

    const ctx: WorkingPaperFillContext = {
      engagement: ENGAGEMENT,
      cdfsAccounts: cdfsMap,
      nkcTransactions: txns,
      vatDeclarations: decls,
    }

    const res = fillRevenueWorkingPaper(editor, ctx)
    expect(res.success).toBe(true)
    expect(res.sheetsUpdated).toContain('G 110')
    expect(res.sheetsUpdated).toContain('G 150')
    expect(res.sheetsUpdated).toContain('G 191.1')
    expect(res.sheetsUpdated).toContain('G 194')
    expect(res.sheetsUpdated).toContain('G 195')

    // Lưu file tạm và kiểm tra XML trực tiếp
    const tmpOut = path.resolve('temp-test-g100.xlsx')
    editor.save(tmpOut)

    const zip = new AdmZip(tmpOut)

    // 1. Kiểm tra sheet G 110: Row 11 có số 1 tỷ (800tr + 200tr)
    const xmlG110 = zip.readAsText('xl/worksheets/sheet2.xml')
    expect(xmlG110).toContain('<c r="D11"')
    expect(xmlG110).toContain('>1000000000<')
    // Row 23 có 711
    expect(xmlG110).toContain('<c r="D23"')
    expect(xmlG110).toContain('>50000000<')

    // 2. Kiểm tra sheet G 150: Row 25 (Tháng 10 = 15 + 10): B=50tr, C=100tr, D=850tr
    const xmlG150 = zip.readAsText('xl/worksheets/sheet7.xml')
    expect(xmlG150).toContain('<c r="B25" s="684"><v>50000000</v></c>')
    expect(xmlG150).toContain('<c r="C25" s="684"><v>100000000</v></c>')
    expect(xmlG150).toContain('<c r="D25" s="684"><v>850000000</v></c>')

    // 3. Kiểm tra sheet G 191.1: Row 17 có D=1311DBL, E=51111, F=22000000
    const xmlG191 = zip.readAsText('xl/worksheets/sheet13.xml')
    expect(xmlG191).toContain('r="D17"')
    expect(xmlG191).toContain('>1311DBL<')
    expect(xmlG191).toContain('r="E17"')
    expect(xmlG191).toContain('>51111<')
    expect(xmlG191).toContain('r="F17"')
    expect(xmlG191).toContain('<v>22000000</v>')

    // 4. Kiểm tra sheet G 195: Row 14 (không đè hàng 13), ngày format chuẩn 10/07/2025, số tiền format 22000000 với style 164
    const xmlG195 = zip.readAsText('xl/worksheets/sheet15.xml')
    expect(xmlG195).toContain('<c r="A14" t="inlineStr" s="564"><is><t xml:space="preserve">10/07/2025</t></is></c>')
    expect(xmlG195).toContain('<c r="B14" t="inlineStr" s="564"><is><t xml:space="preserve">HD00000008</t></is></c>')
    expect(xmlG195).toContain('<c r="D14" s="164"><v>22000000</v></c>')
    expect(xmlG195).not.toContain('Indochina Time')

    if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut)
  })
})
