/* eslint-disable no-restricted-imports */
import ExcelJS from 'exceljs'
import type { CashTaxRiskResult } from '../../../domain/analytics/types'

const MONEY_FMT = '#,##0;[Red](#,##0);-'

function setWidths(ws: ExcelJS.Worksheet, widths: number[]): void {
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w
  })
}

export async function exportTaxRiskExcel(
  result: CashTaxRiskResult,
  companyName = 'Doanh nghiệp kiểm toán',
  fiscalYear = '2026',
): Promise<void> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'AuditSoft - Trợ lý Kiểm toán Toàn diện'
  wb.created = new Date()

  const thresholdLabel = result.thresholdUsed.toLocaleString('vi-VN') + ' đ'

  // ══════════════════════════════════════════════════════════════════════
  // SHEET 1: TỔNG HỢP CHI PHÍ LOẠI TRỪ CHỈ TIÊU B4 THEO CHUYÊN ĐỀ
  // ══════════════════════════════════════════════════════════════════════
  const wsSummary = wb.addWorksheet('TongHop_ChiPhi_B4')

  wsSummary.addRow([companyName.toUpperCase()])
  wsSummary.getRow(1).font = { bold: true, size: 11, color: { argb: 'FF475569' } }

  wsSummary.addRow([`BẢNG TỔNG HỢP CÁC KHOẢN CHI PHÍ KHÔNG ĐƯỢC TRỪ (CHỈ TIÊU B4 QTT 03/TNDN)`])
  wsSummary.getRow(2).font = { bold: true, size: 13, color: { argb: 'FF0F172A' } }

  wsSummary.addRow([`Niên độ tài chính: ${fiscalYear} | Căn cứ: Luật Thuế TNDN, Thông tư 96/2015/TT-BTC, NĐ 181/2025/NĐ-CP`])
  wsSummary.getRow(3).font = { italic: true, size: 10, color: { argb: 'FF64748B' } }

  wsSummary.addRow([])

  const summaryHeader = wsSummary.addRow([
    'STT',
    'Chuyên đề rủi ro thuế & Nhóm chi phí loại trừ',
    'Căn cứ pháp lý áp dụng',
    'Số lượng chứng từ',
    'Số tiền loại trừ B4 (VNĐ)',
    'Thuế TNDN tăng thêm (20%)',
    'Ghi chú hồ sơ kiểm toán',
  ])

  summaryHeader.font = { bold: true, color: { argb: 'FF1E293B' }, size: 11 }
  summaryHeader.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    }
  })
  summaryHeader.height = 26

  const singleList = result.singleItems || []
  const clusterList = result.splitClusters || []
  const penaltyList = result.penaltyItems || []
  const noInvoiceList = result.noInvoiceItems || []

  const categoriesData = [
    {
      stt: 1,
      name: `Chi tiền mặt >= ${thresholdLabel} không thanh toán qua ngân hàng`,
      legal: 'Nghị định 181/2025/NĐ-CP & Luật Thuế GTGT 2024 (hoặc NĐ 209)',
      count: singleList.length,
      amount: singleList.reduce((s, it) => s + it.amountNumber, 0),
      tax: Math.round(singleList.reduce((s, it) => s + it.amountNumber, 0) * result.taxRate),
      note: 'Rủi ro loại trừ thuế GTGT đầu vào và chi phí được trừ khi tính thuế TNDN.',
    },
    {
      stt: 2,
      name: 'Nghi ngờ chia nhỏ / xé phiếu chi tiền mặt cùng ngày cùng nhà cung cấp',
      legal: 'Nghị định 181/2025/NĐ-CP & Khoản 2 Điều 6 Thông tư 78/2014/TT-BTC',
      count: clusterList.reduce((s, c) => s + c.itemsCount, 0),
      amount: clusterList.reduce((s, c) => s + c.totalAmountNumber, 0),
      tax: Math.round(clusterList.reduce((s, c) => s + c.totalAmountNumber, 0) * result.taxRate),
      note: 'Các khoản chi cho cùng 1 khách hàng/NCC trong ngày có tổng >= ngưỡng quy định.',
    },
    {
      stt: 3,
      name: 'Tiền phạt vi phạm hành chính, phạt thuế, chậm nộp (TK 811)',
      legal: 'Điều 4 Thông tư 96/2015/TT-BTC (sửa đổi Điều 6 TT 78/2014)',
      count: penaltyList.length,
      amount: result.penaltyRiskNumber || penaltyList.reduce((s, it) => s + it.amountNumber, 0),
      tax: Math.round((result.penaltyRiskNumber || penaltyList.reduce((s, it) => s + it.amountNumber, 0)) * result.taxRate),
      note: '100% các khoản tiền phạt VPHC không được trừ khi tính thuế TNDN (chuyển sang B4).',
    },
    {
      stt: 4,
      name: 'Chi phí không có hóa đơn hợp pháp / Bảng kê mua lẻ không hợp lệ',
      legal: 'Điều 4 Thông tư 96/2015/TT-BTC & Thông tư 78/2014/TT-BTC',
      count: noInvoiceList.length,
      amount: result.noInvoiceRiskNumber || noInvoiceList.reduce((s, it) => s + it.amountNumber, 0),
      tax: Math.round((result.noInvoiceRiskNumber || noInvoiceList.reduce((s, it) => s + it.amountNumber, 0)) * result.taxRate),
      note: 'Chi phí tiếp khách, mua hàng không lấy hóa đơn GTGT hoặc thiếu bảng kê thu mua 01/TNDN.',
    },
  ]
  categoriesData.forEach((row) => {
    const r = wsSummary.addRow([
      row.stt,
      row.name,
      row.legal,
      row.count,
      row.amount,
      row.tax,
      row.note,
    ])
    r.getCell(1).alignment = { horizontal: 'center' }
    r.getCell(4).alignment = { horizontal: 'center' }
    r.getCell(5).alignment = { horizontal: 'right' }
    r.getCell(5).numFmt = MONEY_FMT
    r.getCell(6).alignment = { horizontal: 'right' }
    r.getCell(6).numFmt = MONEY_FMT

    r.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      }
    })
  })

  // Dòng tổng cộng B4
  const sumRow = wsSummary.addRow([
    'TỔNG',
    'TỔNG CỘNG ĐIỀU CHỈNH TĂNG THU NHẬP CHỊU THUẾ (CHỈ TIÊU B4 QTT TNDN)',
    '',
    result.allItems.length,
    result.estimatedB4Number,
    result.estimatedTaxPayableNumber,
    'Số liệu ước tính đưa trực tiếp vào Chỉ tiêu B4 trên Tờ khai 03/TNDN.',
  ])

  sumRow.font = { bold: true, color: { argb: 'FF9F1239' } }
  sumRow.getCell(1).alignment = { horizontal: 'center' }
  sumRow.getCell(4).alignment = { horizontal: 'center' }
  sumRow.getCell(5).numFmt = MONEY_FMT
  sumRow.getCell(6).numFmt = MONEY_FMT
  sumRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF1F2' } }
    cell.border = {
      top: { style: 'medium', color: { argb: 'FFFDA4AF' } },
      bottom: { style: 'double', color: { argb: 'FFE11D48' } },
    }
  })

  setWidths(wsSummary, [6, 42, 35, 18, 26, 26, 45])

  // ══════════════════════════════════════════════════════════════════════
  // SHEET 2: BẢNG KÊ CHI TIẾT TOÀN BỘ CHỨNG TỪ VI PHẠM
  // ══════════════════════════════════════════════════════════════════════
  const wsDetail = wb.addWorksheet('ChiTiet_ChungTu_ViPham')

  wsDetail.addRow([companyName.toUpperCase()])
  wsDetail.getRow(1).font = { bold: true, size: 11, color: { argb: 'FF475569' } }

  wsDetail.addRow([`DANH SÁCH CHI TIẾT CÁC BÚT TOÁN RỦI RO THUẾ LOẠI TRỪ CHỈ TIÊU B4 — NIÊN ĐỘ ${fiscalYear}`])
  wsDetail.getRow(2).font = { bold: true, size: 13, color: { argb: 'FF0F172A' } }

  wsDetail.addRow([`Tổng cộng: ${result.allItems.length} chứng từ | Tổng tiền vi phạm: ${result.totalRiskNumber.toLocaleString('vi-VN')} đ`])
  wsDetail.getRow(3).font = { bold: true, size: 10, color: { argb: 'FFB91C1C' } }

  wsDetail.addRow([])

  const detailHeader = wsDetail.addRow([
    'STT',
    'Ngày CT',
    'Số CT',
    'Nhà cung cấp / Đối tượng',
    'Mã đối tượng',
    'Diễn giải nghiệp vụ',
    'TK Nợ',
    'TK Có',
    'Số tiền (VNĐ)',
    'Chuyên đề rủi ro',
    'Căn cứ pháp lý & Khuyến nghị B4',
  ])

  detailHeader.font = { bold: true, color: { argb: 'FF1E293B' }, size: 11 }
  detailHeader.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    }
  })
  detailHeader.height = 28

  result.allItems.forEach((it, idx) => {
    const isPenalty = it.riskType === 'PENALTY_811'
    const isNoInvoice = it.riskType === 'NO_INVOICE'
    const isSingle = it.riskType === 'SINGLE_OVER_THRESHOLD'

    const row = wsDetail.addRow([
      idx + 1,
      it.date || '',
      it.voucher || '',
      it.partnerName || 'Chưa rõ đối tượng',
      it.partnerCode || '',
      it.description || '',
      it.debit,
      it.credit,
      it.amountNumber,
      it.riskLabel,
      it.auditNote,
    ])

    row.getCell(1).alignment = { horizontal: 'center' }
    row.getCell(2).alignment = { horizontal: 'center' }
    row.getCell(3).alignment = { horizontal: 'center' }
    row.getCell(7).alignment = { horizontal: 'center' }
    row.getCell(8).alignment = { horizontal: 'center' }
    row.getCell(9).alignment = { horizontal: 'right' }
    row.getCell(9).numFmt = MONEY_FMT

    const textColor = isPenalty ? 'FF7C3AED' : isNoInvoice ? 'FFE11D48' : isSingle ? 'FFB91C1C' : 'FFB45309'
    row.getCell(9).font = { bold: true, color: { argb: textColor } }

    const isEven = idx % 2 === 0
    row.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' },
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      }
    })
  })

  // Dòng tổng cộng Sheet 2
  const totalRow = wsDetail.addRow([
    'TỔNG',
    '',
    '',
    '',
    '',
    `TỔNG CỘNG ${result.allItems.length} CHỨNG TỪ VI PHẠM LOẠI TRỪ B4`,
    '',
    '',
    result.totalRiskNumber,
    '',
    `Thuế TNDN tăng thêm (20%): ${result.estimatedTaxPayableNumber.toLocaleString('vi-VN')} đ`,
  ])

  totalRow.font = { bold: true, color: { argb: 'FF9F1239' } }
  totalRow.getCell(1).alignment = { horizontal: 'center' }
  totalRow.getCell(9).numFmt = MONEY_FMT
  totalRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF1F2' } }
    cell.border = {
      top: { style: 'medium', color: { argb: 'FFFDA4AF' } },
      bottom: { style: 'double', color: { argb: 'FFE11D48' } },
    }
  })

  setWidths(wsDetail, [6, 12, 14, 30, 14, 45, 10, 10, 22, 28, 55])

  // ══════════════════════════════════════════════════════════════════════
  // TẢI FILE VỀ MÁY TÍNH
  // ══════════════════════════════════════════════════════════════════════
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  if (typeof document !== 'undefined') {
    const a = document.createElement('a')
    a.href = url
    a.download = `BaoCao-RuiRo-Thue-ChiPhi-B4-${fiscalYear}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }
}
