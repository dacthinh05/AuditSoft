import type { WorkingPaperFillContext, SectionFillResult } from '../types'
import { OpenXmlPackageEditor } from '../openxml/OpenXmlPackageEditor'
import { ExpenseByNatureEngine } from '../../analytics/ExpenseByNatureEngine'
import { makeMoney } from '../../money'
import type { JournalEntry } from '../../../shared/types/analytics'

/**
 * Filler cho tệp Master: A - B - H - Mau 2025 - Thinh.xlsx
 * Tự động đổ CDFS vào 'bcdsps-Truoc DC' để tự sinh toàn bộ BCTC
 * (B01-CDKT, B02-KQKD, LCTT) và tính toán Mức trọng yếu VSA 320 tại A710.
 */
export function fillAbhMasterWorkingPaper(
  editor: OpenXmlPackageEditor,
  ctx: WorkingPaperFillContext,
): SectionFillResult {
  const fileName = 'A - B - H - Mau 2025 - Thinh.xlsx'
  const updatedSheets: string[] = []
  let itemsCount = 0

  // 1. Điền Sheet ADD
  if (editor.hasSheet('ADD')) {
    editor.fillAddSheet(ctx.engagement)
    updatedSheets.push('ADD')
  }

  // 2. Điền Sheet bcdsps-Truoc DC
  const bcdspsSheet = editor.hasSheet('bcdsps-Truoc DC')
    ? 'bcdsps-Truoc DC'
    : editor.hasSheet('bcdsps-TruocDC')
    ? 'bcdsps-TruocDC'
    : null

  if (bcdspsSheet && ctx.cdfsAccounts.size > 0) {
    // Sắp xếp các tài khoản theo mã TK tăng dần
    const sortedAccounts = Array.from(ctx.cdfsAccounts.values()).sort((a, b) =>
      a.matk.localeCompare(b.matk),
    )

    let r = 6
    for (const acc of sortedAccounts) {
      const tk = acc.matk
      const tkCap1 = tk.slice(0, 3)
      const tkCap2 = tk.slice(0, 4)
      const isLongTerm =
        tk.endsWith('.DH') ||
        tk.startsWith('2') ||
        tk.startsWith('3412') ||
        tk.startsWith('3388.DH')
      const _phanLoai = isLongTerm ? `${tkCap1}.DH` : tkCap2

      const noDK = acc.sdndk ?? 0
      const coDK = acc.sdcdk ?? 0
      const noCK = acc.nock ?? 0
      const coCK = acc.cock ?? 0

      // Cột D: Mã TK (Cột A, B, C trong template đã có sẵn công thức =+LEFT(D6,3), =+LEFT(D6,4) tự động nhảy!)
      editor.updateCell(bcdspsSheet, `D${r}`, { text: tk })
      // Cột E: Tên TK
      editor.updateCell(bcdspsSheet, `E${r}`, { text: acc.tentk || `Tài khoản ${tk}` })
      // Cột F: Số dư đầu năm Nợ
      editor.updateCell(bcdspsSheet, `F${r}`, { number: noDK })
      // Cột G: Số dư đầu năm Có
      editor.updateCell(bcdspsSheet, `G${r}`, { number: coDK })
      // Cột H: Số dư cuối năm trước Đ/C Nợ
      editor.updateCell(bcdspsSheet, `H${r}`, { number: noCK })
      // Cột I: Số dư cuối năm trước Đ/C Có
      editor.updateCell(bcdspsSheet, `I${r}`, { number: coCK })

      itemsCount += 6
      r++
    }

    updatedSheets.push(bcdspsSheet)
  }

  // 3. Điền Sheet A710 (Xác định mức trọng yếu VSA 320)
  const a710Sheet = editor.hasSheet('A710') ? 'A710' : editor.hasSheet('A 710') ? 'A 710' : null
  if (a710Sheet) {
    // 3.1 Tính toán tiêu chí trọng yếu từ Doanh thu thuần (TK 511) hoặc Tổng tài sản (Đầu TK 1 & 2)
    let totalRevenue = 0
    let totalAssets = 0

    for (const [code, a] of ctx.cdfsAccounts.entries()) {
      if (code.startsWith('511')) {
        totalRevenue += a.psco ?? 0
      }
      if (code.startsWith('1') || code.startsWith('2')) {
        totalAssets += (a.nock || 0)
      }
    }

    // Chọn tiêu chí: Doanh thu nếu > 0, ngược lại chọn Tổng tài sản
    const benchmarkVal = totalRevenue > 0 ? totalRevenue : totalAssets > 0 ? totalAssets : 1_000_000_000
    const materialityRate = 0.01 // 1%
    const omVal = Math.round(benchmarkVal * materialityRate)
    const pmRate = 0.75 // 75%
    const pmVal = Math.round(omVal * pmRate)
    const cttRate = 0.04 // 4%
    const cttVal = Math.round(pmVal * cttRate)

    // C24 & D24: Giá trị tiêu chí được lựa chọn (Kế hoạch - Thực tế)
    editor.updateCell(a710Sheet, 'C24', { number: benchmarkVal })
    editor.updateCell(a710Sheet, 'D24', { number: benchmarkVal })

    // C26 & D26: Sau điều chỉnh
    editor.updateCell(a710Sheet, 'C26', { number: benchmarkVal })
    editor.updateCell(a710Sheet, 'D26', { number: benchmarkVal })

    // C32 & D32: Mức trọng yếu tổng thể (Overall Materiality - OM)
    editor.updateCell(a710Sheet, 'C32', { number: omVal })
    editor.updateCell(a710Sheet, 'D32', { number: omVal })

    // C34 & D34: Mức trọng yếu thực hiện (Performance Materiality - PM)
    editor.updateCell(a710Sheet, 'C34', { number: pmVal })
    editor.updateCell(a710Sheet, 'D34', { number: pmVal })

    // C36 & D36: Ngưỡng sai sót không đáng kể (Trivial Misstatement - CTT)
    editor.updateCell(a710Sheet, 'C36', { number: cttVal })
    editor.updateCell(a710Sheet, 'D36', { number: cttVal })

    // Thông tin người lập & ngày
    if (ctx.engagement.auditorName) {
      editor.updateCell(a710Sheet, 'C3', { text: `Thực hiện: ${ctx.engagement.auditorName}` })
    }

    itemsCount += 12
    updatedSheets.push(a710Sheet)
  }

  // 4. Điền Sheet thongtincty (Thông tin doanh nghiệp)
  const thongTinSheet = editor.hasSheet('thongtincty') ? 'thongtincty' : null
  if (thongTinSheet) {
    const yearMatch = ctx.engagement.fiscalYearEnd?.match(/\d{4}/)
    const yearStr = yearMatch ? yearMatch[0] : `${new Date().getFullYear()}`
    const clientName = ctx.engagement.clientName || 'DOANH NGHIỆP ĐƯỢC KIỂM TOÁN'

    editor.updateCell(thongTinSheet, 'B3', { text: clientName })
    editor.updateCell(thongTinSheet, 'B6', { text: `01/01/${yearStr}` })
    editor.updateCell(thongTinSheet, 'B7', { text: `31/12/${yearStr}` })
    editor.updateCell(thongTinSheet, 'B8', { text: `31/12/${yearStr}` })

    if (ctx.engagement.auditorName) {
      editor.updateCell(thongTinSheet, 'B10', { text: ctx.engagement.auditorName })
      editor.updateCell(thongTinSheet, 'B11', { text: ctx.engagement.auditorName })
    }

    itemsCount += 6
    updatedSheets.push(thongTinSheet)
  }

  // 5. Điền Sheet BenLienQuan (Giao dịch với các bên liên quan VSA 550)
  const benLienQuanSheet = editor.hasSheet('BenLienQuan') ? 'BenLienQuan' : null
  if (benLienQuanSheet) {
    const relatedTxs = ctx.nkcTransactions
      .filter((t) => t.debit.startsWith('1388') || t.credit.startsWith('1388') || t.debit.startsWith('3388') || t.credit.startsWith('3388'))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    let r = 4
    for (const t of relatedTxs) {
      editor.updateCell(benLienQuanSheet, `A${r}`, { text: t.desc.slice(0, 40) || 'Bên liên quan' })
      editor.updateCell(benLienQuanSheet, `B${r}`, { text: 'Bên liên quan' })
      editor.updateCell(benLienQuanSheet, `C${r}`, { text: t.debit.startsWith('1388') ? 'Cho mượn / Tạm ứng' : 'Vay mượn nhận nợ' })
      editor.updateCell(benLienQuanSheet, `D${r}`, { number: t.amount })
      r++
      itemsCount += 4
    }

    if (relatedTxs.length > 0) {
      updatedSheets.push(benLienQuanSheet)
    }
  }

  // 6. Điền Sheet THUYET-MINH (Mục Chi phí SXKD theo yếu tố chuẩn Thông tư 200 / VAS 01)
  const tmSheet = editor.hasSheet('THUYET-MINH') ? 'THUYET-MINH' : editor.hasSheet('THUYET_MINH') ? 'THUYET_MINH' : null
  if (tmSheet) {
    const journalEntries: JournalEntry[] = ctx.nkcTransactions.map((t) => ({
      id: `nkc-${t.rowNum}`,
      source: { fileName: 'NKC', sheetName: 'NKC', rowNumber: t.rowNum },
      postingDate: t.dateStr,
      documentNumber: t.docNo,
      description: t.desc,
      debitAccount: t.debit,
      creditAccount: t.credit,
      amount: makeMoney(BigInt(Math.round(t.amount)), 0),
      foreignAmount: null,
      exchangeRate: null,
      objectCode: t.custId || null,
      customerName: null,
      month: t.month || 1,
      issues: [],
    }))

    const natureReport = ExpenseByNatureEngine.analyze(journalEntries, ctx.cdfsAccounts)
    const recon = natureReport.bctcReconciliation

    // Điền vào sheet THUYET-MINH (Hàng 187-195 Cột D: Số Năm Nay)
    editor.updateCell(tmSheet, 'D187', { number: recon.rawMaterials })
    editor.updateCell(tmSheet, 'D188', { number: recon.labor })
    editor.updateCell(tmSheet, 'D189', { number: recon.depreciation })
    editor.updateCell(tmSheet, 'D190', { number: recon.outsideServices })
    editor.updateCell(tmSheet, 'D191', { number: recon.otherCash })
    editor.updateCell(tmSheet, 'D192', { number: recon.deltaWip154 })
    editor.updateCell(tmSheet, 'D193', { number: recon.deltaFinished155 })
    editor.updateCell(tmSheet, 'D194', { number: recon.totalTransferred911Cost })
    editor.updateCell(tmSheet, 'D195', { number: 0 })

    itemsCount += 9
    updatedSheets.push(tmSheet)
  }

  // 5. Điền Sheet CHITIETDC (Tổng hợp toàn bộ các bút toán điều chỉnh AJE)
  const chiTietDcSheet = editor.hasSheet('CHITIETDC') ? 'CHITIETDC' : null
  if (chiTietDcSheet) {
    const allAjes = ctx.adjustingEntries || []
    if (allAjes.length > 0) {
      let r = 4
      for (let i = 0; i < allAjes.length; i++) {
        const aje = allAjes[i]
        if (!aje) continue
        const isCdktNo =
          !aje.tkNo.startsWith('5') &&
          !aje.tkNo.startsWith('6') &&
          !aje.tkNo.startsWith('7') &&
          !aje.tkNo.startsWith('8') &&
          !aje.tkNo.startsWith('9')
        const isCdktCo =
          !aje.tkCo.startsWith('5') &&
          !aje.tkCo.startsWith('6') &&
          !aje.tkCo.startsWith('7') &&
          !aje.tkCo.startsWith('8') &&
          !aje.tkCo.startsWith('9')

        editor.updateCell(chiTietDcSheet, `A${r}`, { text: String(i + 1) })
        editor.updateCell(chiTietDcSheet, `B${r}`, { text: aje.glvRef || `AJE.${i + 1}` })
        editor.updateCell(chiTietDcSheet, `C${r}`, { text: aje.noiDung })
        editor.updateCell(chiTietDcSheet, `D${r}`, { text: isCdktNo ? aje.tkNo : '' })
        editor.updateCell(chiTietDcSheet, `E${r}`, { text: isCdktCo ? aje.tkCo : '' })
        editor.updateCell(chiTietDcSheet, `F${r}`, { number: aje.soTien })
        editor.updateCell(chiTietDcSheet, `G${r}`, { text: !isCdktNo ? aje.tkNo : '' })
        editor.updateCell(chiTietDcSheet, `H${r}`, { text: !isCdktCo ? aje.tkCo : '' })
        r++
        itemsCount += 8
      }
    } else {
      editor.updateCell(chiTietDcSheet, 'C4', { text: 'Không phát sinh bút toán điều chỉnh.' })
      itemsCount++
    }
    updatedSheets.push(chiTietDcSheet)
  }

  return {
    fileName,
    success: true,
    sheetsUpdated: updatedSheets,
    itemsFilledCount: itemsCount,
  }
}
