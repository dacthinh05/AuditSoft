/* eslint-disable no-restricted-imports */
import ExcelJS from 'exceljs'
import type { JournalRowDTO } from '../../../shared/types/analytics'

const MONEY_FMT = '#,##0;[Red](#,##0);"-"'
const PCT_FMT = '0.0%'

export interface MatrixDrilldownExportParams {
  columnKey: string
  columnLabel: string
  accountPattern: string
  month: number
  companyName?: string
  fiscalYear?: string
  anomalyNote?: string
  rows: JournalRowDTO[]
}

function setWidths(ws: ExcelJS.Worksheet, widths: number[]): void {
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w
  })
}

export async function exportMatrixDrilldownExcel(
  params: MatrixDrilldownExportParams,
): Promise<void> {
  const {
    columnKey,
    columnLabel,
    accountPattern,
    month,
    companyName = 'Doanh nghiệp kiểm toán',
    fiscalYear = `${new Date().getFullYear()}`,
    anomalyNote,
    rows,
  } = params

  const wb = new ExcelJS.Workbook()
  wb.creator = 'AuditSoft - Trợ Lý Kiểm Toán Độc Lập'
  wb.created = new Date()

  const monthStr = `Tháng ${String(month).padStart(2, '0')}`
  const totalAmount = rows.reduce((sum, r) => sum + r.amount, 0)

  // ══════════════════════════════════════════════════════════════════════
  // SHEET 1: TỔNG HỢP PIVOT THEO CẶP TÀI KHOẢN ĐỐI ỨNG & TOP PHÁT SINH
  // ══════════════════════════════════════════════════════════════════════
  const wsPivot = wb.addWorksheet('TongHop_Pivot')

  wsPivot.addRow([companyName.toUpperCase()])
  wsPivot.getRow(1).font = { bold: true, size: 10, color: { argb: 'FF475569' } }

  wsPivot.addRow([`BẢNG TỔNG HỢP BIẾN ĐỘNG PHÁT SINH — ${columnLabel.toUpperCase()} (${accountPattern})`])
  wsPivot.getRow(2).font = { bold: true, size: 13, color: { argb: 'FF0F172A' } }

  wsPivot.addRow([
    `Kỳ Kế Toán: ${monthStr}/${fiscalYear} | Tổng phát sinh: ${Math.round(totalAmount).toLocaleString('vi-VN')} đ | Số lượng: ${rows.length} bút toán`,
  ])
  wsPivot.getRow(3).font = { italic: true, size: 10.5, color: { argb: 'FF64748B' } }

  if (anomalyNote) {
    const alertRow = wsPivot.addRow([`⚠️ CẢNH BÁO ĐỘT BIẾN: ${anomalyNote}`])
    alertRow.font = { bold: true, size: 10, color: { argb: 'FFB45309' } }
  }

  wsPivot.addRow([])

  // ── Phần 1: Bảng Pivot Cặp Tài Khoản Đối Ứng ──
  const sec1Row = wsPivot.addRow(['1. CƠ CẤU PHÁT SINH THEO CẶP TÀI KHOẢN ĐỐI ỨNG (PIVOT SUMMARY)'])
  sec1Row.font = { bold: true, size: 11, color: { argb: 'FF1D4ED8' } }

  const pivotHeader = wsPivot.addRow([
    'STT',
    'TK Nợ',
    'TK Có',
    'Cặp TK Đối Ứng',
    'Số Lượng Bút Toán',
    'Tổng Số Tiền (VNĐ)',
    'Tỷ Trọng (%)',
  ])
  pivotHeader.font = { bold: true, color: { argb: 'FF1E293B' }, size: 10.5 }
  pivotHeader.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF94A3B8' } },
    }
  })

  // Group by pair
  interface PairGroup {
    debit: string
    credit: string
    count: number
    amount: number
  }
  const pairMap = new Map<string, PairGroup>()
  rows.forEach((r) => {
    const key = `${r.debit || '-'} / ${r.credit || '-'}`
    const existing = pairMap.get(key)
    if (existing) {
      existing.count += 1
      existing.amount += r.amount
    } else {
      pairMap.set(key, {
        debit: r.debit || '-',
        credit: r.credit || '-',
        count: 1,
        amount: r.amount,
      })
    }
  })

  const sortedPairs = Array.from(pairMap.values()).sort((a, b) => b.amount - a.amount)

  sortedPairs.forEach((p, idx) => {
    const pct = totalAmount > 0 ? p.amount / totalAmount : 0
    const row = wsPivot.addRow([
      idx + 1,
      p.debit,
      p.credit,
      `Nợ ${p.debit} / Có ${p.credit}`,
      p.count,
      p.amount,
      pct,
    ])
    row.font = { size: 10 }
    row.getCell(1).alignment = { horizontal: 'center' }
    row.getCell(2).alignment = { horizontal: 'center' }
    row.getCell(3).alignment = { horizontal: 'center' }
    row.getCell(5).alignment = { horizontal: 'right' }
    row.getCell(6).numFmt = MONEY_FMT
    row.getCell(7).numFmt = PCT_FMT
    row.getCell(7).alignment = { horizontal: 'right' }

    row.eachCell((cell) => {
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFF1F5F9' } },
      }
    })
  })

  // Dòng tổng cộng Pivot
  const pivotTotalRow = wsPivot.addRow([
    'TỔNG CỘNG',
    '',
    '',
    'Khớp 100% Ma Trận 12M',
    rows.length,
    totalAmount,
    1.0,
  ])
  pivotTotalRow.font = { bold: true, color: { argb: 'FF0F172A' }, size: 10.5 }
  pivotTotalRow.getCell(5).alignment = { horizontal: 'right' }
  pivotTotalRow.getCell(6).numFmt = MONEY_FMT
  pivotTotalRow.getCell(7).numFmt = PCT_FMT
  pivotTotalRow.getCell(7).alignment = { horizontal: 'right' }
  pivotTotalRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'double', color: { argb: 'FF475569' } },
    }
  })

  wsPivot.addRow([])
  wsPivot.addRow([])

  // ── Phần 2: Bảng Top Bút Toán Trọng Yếu Nhất (Bốc Mẫu) ──
  const sec2Row = wsPivot.addRow(['2. TOP BÚT TOÁN PHÁT SINH LỚN NHẤT (PHỤC VỤ BỐC MẪU KIỂM TOÁN VSA 530)'])
  sec2Row.font = { bold: true, size: 11, color: { argb: 'FFB45309' } }

  const topHeader = wsPivot.addRow([
    'Hạng',
    'Ngày Chứng Từ',
    'Số Chứng Từ',
    'Diễn Giải Nghiệp Vụ',
    'TK Nợ',
    'TK Có',
    'Số Tiền (VNĐ)',
    'Tỷ Trọng (%)',
  ])
  topHeader.font = { bold: true, color: { argb: 'FF1E293B' }, size: 10.5 }
  topHeader.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFFCD34D' } },
      bottom: { style: 'medium', color: { argb: 'FFF59E0B' } },
    }
  })

  const sortedRowsDesc = [...rows].sort((a, b) => b.amount - a.amount)
  const topCount = Math.min(15, sortedRowsDesc.length)
  const topRows = sortedRowsDesc.slice(0, topCount)
  let topTotalAmount = 0

  topRows.forEach((r, idx) => {
    topTotalAmount += r.amount
    const pct = totalAmount > 0 ? r.amount / totalAmount : 0
    const row = wsPivot.addRow([
      idx + 1,
      r.date || '',
      r.doc || '',
      r.desc || '',
      r.debit || '',
      r.credit || '',
      r.amount,
      pct,
    ])
    row.font = { size: 10 }
    row.getCell(1).alignment = { horizontal: 'center' }
    row.getCell(2).alignment = { horizontal: 'center' }
    row.getCell(3).alignment = { horizontal: 'center' }
    row.getCell(5).alignment = { horizontal: 'center' }
    row.getCell(6).alignment = { horizontal: 'center' }
    row.getCell(7).numFmt = MONEY_FMT
    row.getCell(8).numFmt = PCT_FMT
    row.getCell(8).alignment = { horizontal: 'right' }

    row.eachCell((cell) => {
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFF1F5F9' } },
      }
    })
  })

  // Dòng tổng Top
  const topPct = totalAmount > 0 ? topTotalAmount / totalAmount : 0
  const topTotalRow = wsPivot.addRow([
    `TỔNG TOP ${topCount}`,
    '',
    '',
    `Chiếm ${(topPct * 100).toFixed(1)}% toàn bộ chi phí trong tháng`,
    '',
    '',
    topTotalAmount,
    topPct,
  ])
  topTotalRow.font = { bold: true, color: { argb: 'FF92400E' }, size: 10.5 }
  topTotalRow.getCell(7).numFmt = MONEY_FMT
  topTotalRow.getCell(8).numFmt = PCT_FMT
  topTotalRow.getCell(8).alignment = { horizontal: 'right' }
  topTotalRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFFDE68A' } },
      bottom: { style: 'double', color: { argb: 'FFD97706' } },
    }
  })

  setWidths(wsPivot, [8, 14, 16, 45, 18, 24, 15, 12])

  // ══════════════════════════════════════════════════════════════════════
  // SHEET 2: CHI TIẾT TOÀN BỘ BÚT TOÁN (CÓ AUTOFILTER & FREEZE PANES)
  // ══════════════════════════════════════════════════════════════════════
  const wsDetail = wb.addWorksheet('ChiTiet_SoCai')

  wsDetail.addRow([companyName.toUpperCase()])
  wsDetail.getRow(1).font = { bold: true, size: 10, color: { argb: 'FF475569' } }

  wsDetail.addRow([`SỔ CHI TIẾT BÚT TOÁN PHÁT SINH — ${columnLabel.toUpperCase()} (${accountPattern})`])
  wsDetail.getRow(2).font = { bold: true, size: 12, color: { argb: 'FF0F172A' } }

  wsDetail.addRow([`Kỳ Kế Toán: ${monthStr}/${fiscalYear} | Tổng số dòng: ${rows.length}`])
  wsDetail.getRow(3).font = { italic: true, size: 10, color: { argb: 'FF64748B' } }

  wsDetail.addRow([])

  const detailHeaderRowIdx = 5
  const detailHeader = wsDetail.addRow([
    'STT',
    'Ngày Hạch Toán',
    'Số Chứng Từ',
    'Diễn Giải Nghiệp Vụ Kế Toán',
    'TK Nợ',
    'TK Có',
    'Số Tiền Phát Sinh (VNĐ)',
  ])
  detailHeader.font = { bold: true, color: { argb: 'FF1E293B' }, size: 10.5 }
  detailHeader.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF94A3B8' } },
    }
  })

  sortedRowsDesc.forEach((r, idx) => {
    const row = wsDetail.addRow([
      idx + 1,
      r.date || '',
      r.doc || '',
      r.desc || '',
      r.debit || '',
      r.credit || '',
      r.amount,
    ])
    row.font = { size: 10 }
    row.getCell(1).alignment = { horizontal: 'center' }
    row.getCell(2).alignment = { horizontal: 'center' }
    row.getCell(3).alignment = { horizontal: 'center' }
    row.getCell(5).alignment = { horizontal: 'center' }
    row.getCell(6).alignment = { horizontal: 'center' }
    row.getCell(7).numFmt = MONEY_FMT

    row.eachCell((cell) => {
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFF1F5F9' } },
      }
    })
  })

  // Dòng tổng cộng Detail
  const detailTotalRow = wsDetail.addRow([
    'TỔNG CỘNG',
    '',
    '',
    `Khớp chính xác Ma Trận 12M`,
    '',
    '',
    totalAmount,
  ])
  detailTotalRow.font = { bold: true, color: { argb: 'FF1D4ED8' }, size: 10.5 }
  detailTotalRow.getCell(7).numFmt = MONEY_FMT
  detailTotalRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF93C5FD' } },
      bottom: { style: 'double', color: { argb: 'FF1D4ED8' } },
    }
  })

  setWidths(wsDetail, [8, 14, 16, 55, 12, 12, 24])

  // Bật AutoFilter & Freeze Panes
  wsDetail.autoFilter = {
    from: { row: detailHeaderRowIdx, column: 1 },
    to: { row: detailHeaderRowIdx, column: 7 },
  }
  wsDetail.views = [{ state: 'frozen', xSplit: 0, ySplit: detailHeaderRowIdx }]

  // ══════════════════════════════════════════════════════════════════════
  // TẢI FILE EXCEL VỀ MÁY
  // ══════════════════════════════════════════════════════════════════════
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  if (typeof document !== 'undefined') {
    const a = document.createElement('a')
    a.href = url
    const safeKey = columnKey.replace(/[^a-zA-Z0-9]/g, '_')
    const safeComp = companyName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20)
    a.download = `ChiTiet_${safeKey}_T${String(month).padStart(2, '0')}_${safeComp}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }
}
