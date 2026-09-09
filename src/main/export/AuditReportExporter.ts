import ExcelJS from 'exceljs'
import type { AnalysisResult } from '../../shared/types/analytics'
import { analyzeExpenseVariance } from '../../shared/utils/expenseVariance'

const MONEY_FMT = '#,##0;[Red](#,##0);-'
const PCT_FMT = '0.0%;[Red]-0.0%;-'
const HEADER_FILL = '1F2A44'
const HEADER_FONT = 'FFFFFFFF'

function styleHeader(ws: ExcelJS.Worksheet): void {
  const header = ws.getRow(1)
  header.font = { bold: true, color: { argb: HEADER_FONT } }
  header.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${HEADER_FILL}` } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  })
  header.height = 20
}

const num = (v: number | null | undefined): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

/** Dựng workbook báo cáo audit — 8 sheet theo §41, giữ tham chiếu dòng nguồn. */
export function buildAuditWorkbook(res: AnalysisResult): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'AuditSoft NKC — Audit Analytics'
  wb.created = new Date()

  // 01_Risk_Summary
  const ws1 = wb.addWorksheet('01_Risk_Summary')
  ws1.columns = [
    { header: 'Mức rủi ro', key: 'level', width: 12 },
    { header: 'Rule', key: 'rule', width: 34 },
    { header: 'Tên rủi ro', key: 'title', width: 46 },
    { header: 'Khu vực', key: 'cat', width: 16 },
    { header: 'Điểm', key: 'score', width: 8 },
  ]
  for (const f of res.findings) ws1.addRow({ level: f.riskLevel, rule: f.ruleId, title: f.title, cat: f.category, score: f.score })
  styleHeader(ws1)
  ws1.views = [{ state: 'frozen', ySplit: 1 }]

  // 02_KQKD_Analysis
  if (res.kqkd) {
    const ws = wb.addWorksheet('02_KQKD_Analysis')
    ws.columns = [
      { header: 'Mã số', width: 8 }, { header: 'Chỉ tiêu', width: 44 },
      { header: 'Năm nay', width: 18 }, { header: 'Năm trước', width: 18 },
      { header: 'Chênh lệch', width: 18 }, { header: '% thay đổi', width: 12 },
    ]
    for (const l of res.kqkd.lines) {
      const row = ws.addRow([l.maSo, l.chiTieu, num(l.current), num(l.prior), num(l.change), l.pctChange ?? null])
      row.getCell(3).numFmt = MONEY_FMT
      row.getCell(4).numFmt = MONEY_FMT
      row.getCell(5).numFmt = MONEY_FMT
      row.getCell(6).numFmt = PCT_FMT
    }
    styleHeader(ws)
  }

  // 03_Account_Analysis
  const ws3 = wb.addWorksheet('03_Account_Analysis')
  ws3.columns = [
    { header: 'TK', width: 12 }, { header: 'Tên TK', width: 30 },
    { header: 'PS Nợ', width: 18 }, { header: 'PS Có', width: 18 }, { header: 'Số bút toán', width: 12 },
  ]
  for (const a of res.accounts) {
    const row = ws3.addRow([a.account, a.name, a.debit, a.credit, a.count])
    row.getCell(3).numFmt = MONEY_FMT
    row.getCell(4).numFmt = MONEY_FMT
  }
  styleHeader(ws3)
  ws3.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 5 } }

  // 04_Monthly_Trend
  const ws4 = wb.addWorksheet('04_Monthly_Trend')
  const head: (string | number)[] = ['Nhóm TK', ...Array.from({ length: 12 }, (_, i) => `T${i + 1}`), 'Tổng năm']
  const headRow = ws4.addRow(head)
  headRow.font = { bold: true, color: { argb: HEADER_FONT } }
  headRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${HEADER_FILL}` } }
  })
  for (const g of res.monthly) {
    const cells: (string | number)[] = [g.group]
    for (let m = 1; m <= 12; m++) {
      const b = g.buckets.find((x) => x.month === m)
      cells.push(Math.round(num(b?.debit) + num(b?.credit)))
    }
    cells.push(Math.round(g.totalAmount))
    const row = ws4.addRow(cells)
    for (let c = 2; c <= 14; c++) row.getCell(c).numFmt = MONEY_FMT
  }

  // 05_JE_Risks
  const ws5 = wb.addWorksheet('05_JE_Risks')
  ws5.columns = [
    { header: 'Mức', width: 10 }, { header: 'Finding ID', width: 40 }, { header: 'Quan sát', width: 110 },
  ]
  for (const f of res.findings) ws5.addRow([f.riskLevel, f.id, f.observation])
  styleHeader(ws5)

  // 06_NKC_CDSPS_Reconciliation
  const ws6 = wb.addWorksheet('06_NKC_CDSPS_Recon')
  ws6.columns = [
    { header: 'TK', width: 12 }, { header: 'Tên', width: 28 },
    { header: 'GL Nợ', width: 17 }, { header: 'GL Có', width: 17 },
    { header: 'TB Nợ', width: 17 }, { header: 'TB Có', width: 17 },
    { header: 'Lệch Nợ', width: 15 }, { header: 'Lệch Có', width: 15 },
    { header: 'Kết luận', width: 10 }, { header: 'Ghi chú', width: 40 },
  ]
  for (const r of res.reconciliation) {
    const row = ws6.addRow([r.account, r.name, r.glDebit, r.glCredit, r.tbDebit, r.tbCredit, r.diffDebit, r.diffCredit, r.status, r.note])
    for (let c = 3; c <= 8; c++) row.getCell(c).numFmt = MONEY_FMT
    if (r.status === 'ERROR') row.getCell(9).font = { bold: true, color: { argb: 'FFCC0000' } }
    else if (r.status === 'WARNING') row.getCell(9).font = { bold: true, color: { argb: 'FFB36B00' } }
  }
  styleHeader(ws6)
  ws6.views = [{ state: 'frozen', ySplit: 1 }]

  // 07_Risk_Detail — explainability đầy đủ
  const ws7 = wb.addWorksheet('07_Risk_Detail')
  ws7.columns = [
    { header: 'Finding', width: 38 }, { header: 'Nội dung', width: 26 }, { header: 'Giá trị', width: 100 },
  ]
  for (const f of res.findings) {
    ws7.addRow([f.id, 'Tiêu đề', f.title])
    ws7.addRow([f.id, 'Quan sát', f.observation])
    ws7.addRow([f.id, 'Hàm ý kiểm toán', f.auditImplication])
    for (const p of f.recommendedProcedures) ws7.addRow([f.id, 'Thủ tục đề xuất', p])
    for (const e of f.explanation) ws7.addRow([f.id, e.label, e.value])
    if (f.evidence.accounts?.length) ws7.addRow([f.id, 'TK liên quan', f.evidence.accounts.join(', ')])
    if (f.evidence.journalEntryIds?.length) ws7.addRow([f.id, `Số bút toán evidence`, String(f.evidence.journalEntryIds.length)])
  }

  // 08_Selected_Journals — gộp evidence của mọi finding (kèm nguồn file/sheet/row)
  const ws8 = wb.addWorksheet('08_Selected_Journals')
  ws8.columns = [
    { header: 'Journal ID (file::sheet::row)', width: 44 }, { header: 'Ngày', width: 12 },
    { header: 'Số CT', width: 16 }, { header: 'Diễn giải', width: 50 },
    { header: 'TK Nợ', width: 10 }, { header: 'TK Có', width: 10 }, { header: 'Số tiền', width: 16 },
  ]
  const seen = new Set<string>()
  const journalById = new Map(res.journals.map((j) => [j.id, j]))
  for (const f of res.findings) {
    for (const jid of f.evidence.journalEntryIds ?? []) {
      if (seen.has(jid)) continue
      seen.add(jid)
      // journal có thể bị cap — chỉ in những dòng đang có mặt
      const j = journalById.get(jid)
      if (!j) continue
      const row = ws8.addRow([j.id, j.date ?? '', j.doc ?? '', j.desc, j.debit, j.credit, j.amount])
      row.getCell(7).numFmt = MONEY_FMT
    }
  }

  // 09_ChiPhi_BienDong — phân tích biến động chi phí nay vs trước
  if (res.kqkd) {
    const v = analyzeExpenseVariance(res.kqkd.lines)
    const ws9 = wb.addWorksheet('09_ChiPhi_BienDong')
    ws9.columns = [
      { header: 'Mã số', width: 8 }, { header: 'Chỉ tiêu', width: 34 },
      { header: 'Năm nay', width: 18 }, { header: 'Năm trước', width: 18 },
      { header: '± Chênh lệch', width: 16 }, { header: '% thay đổi', width: 11 },
      { header: '% tổng mức tăng CP', width: 18 }, { header: 'Đánh giá', width: 26 },
    ]
    for (const r of v.rows) {
      const row = ws9.addRow([
        r.maSo, r.chiTieu, num(r.current), num(r.prior), num(r.change),
        pctOrNull(r.pctChange), pctOrNull(r.shareOfIncrease),
        r.pctChange == null ? '' : r.fasterThanRevenue ? 'Tăng nhanh hơn doanh thu' : r.change != null && r.change > 0 ? 'Tăng chậm hơn doanh thu' : 'Giảm/không đổi',
      ])
      for (const c of [3, 4, 5]) row.getCell(c).numFmt = MONEY_FMT
      for (const c of [6, 7]) row.getCell(c).numFmt = PCT_FMT
    }
    const total = ws9.addRow(['', 'Tổng chi phí', num(v.totalCurrent), num(v.totalPrior), num(v.totalChange), null, v.totalChange != null && v.totalChange > 0 ? 1 : null, ''])
    for (const c of [3, 4, 5]) total.getCell(c).numFmt = MONEY_FMT
    total.font = { bold: true }
    styleHeader(ws9)
    ws9.views = [{ state: 'frozen', ySplit: 1 }]
  }

  return wb
}

function pctOrNull(x: number | null): number | null {
  return x == null || !Number.isFinite(x) ? null : x
}
