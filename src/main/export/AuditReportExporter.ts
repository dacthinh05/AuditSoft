import ExcelJS from 'exceljs'
import type { AnalysisResult, ChartImageItem } from '../../shared/types/analytics'
import type { GlAnalyticsResult } from '../../domain/analytics/types'
import { moneyToNumber } from '../../domain/money'

const MONEY_FMT = '#,##0;[Red](#,##0);"-"'
const PCT_FMT = '0.0%;[Red]-0.0%;"-"'
const HEADER_FILL = 'FF0F766E' // Màu xanh Teal kiểm toán (#0f766e)
const SECTION_FILL = 'FF1E293B' // Màu navy đậm cho tiêu đề section lớn
const SUB_FILL = 'FFE2E8F0' // Màu ghi xám nhạt

const num = (v: number | null | undefined): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

function styleSectionBanner(ws: ExcelJS.Worksheet, rowNumber: number, title: string, colSpan = 10): void {
  const row = ws.getRow(rowNumber)
  row.getCell(2).value = title
  row.getCell(2).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12, name: 'Calibri' }
  row.height = 28

  for (let c = 2; c <= colSpan; c++) {
    const cell = row.getCell(c)
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SECTION_FILL } }
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
    }
  }
}

function styleTableHeader(ws: ExcelJS.Worksheet, rowNumber: number, startCol = 2, endCol = 10): void {
  const row = ws.getRow(rowNumber)
  row.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' }
  row.height = 26
  for (let c = startCol; c <= endCol; c++) {
    const cell = row.getCell(c)
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF0D9488' } },
      bottom: { style: 'medium', color: { argb: 'FF042F2E' } },
      left: { style: 'thin', color: { argb: 'FF0D9488' } },
      right: { style: 'thin', color: { argb: 'FF0D9488' } },
    }
  }
}

function applyBorders(row: ExcelJS.Row, startCol = 2, endCol = 10): void {
  for (let c = startCol; c <= endCol; c++) {
    const cell = row.getCell(c)
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFF1F5F9' } },
      right: { style: 'thin', color: { argb: 'FFF1F5F9' } },
    }
  }
}

/**
 * Dựng workbook báo cáo phân tích kiểm toán VSA 520 GOM GỌN TRỌN BỘ TRONG 1 SHEET DUY NHẤT:
 * Sheet 'BaoCao_PhanTich_VSA520':
 *  - Header báo cáo & Hồ sơ khách hàng
 *  - Khối Biểu đồ trực quan hóa (nhúng các đồ thị nếu có)
 *  - Khối 1: Bảng cảnh báo rủi ro kiểm toán trọng yếu (Cờ đỏ VSA 520 / VSA 240)
 *  - Khối 2: Báo cáo KQKD (B02) So sánh 2 năm & Phát hiện Lỗ gộp
 *  - Khối 3: Bóc tách Lãi vay & Trần 30% EBITDA (Nghị định 132/2020)
 *  - Khối 4: Rà soát giao dịch Bên liên quan (VSA 550: Vay mượn 0%, tạm ứng đọng lâu)
 *  - Khối 5: Tỷ trọng Pareto Top Khách hàng (Doanh thu) & Top Nhà cung cấp (Chi phí)
 *  - Khối 6: Ma trận phát sinh chi phí & giá vốn 12 tháng (Trend 12M)
 *  - Khối 7: Chi tiết chi phí Bán hàng (641) & QLDN (642) cấp 4 qua 12 tháng
 */
export function buildAuditWorkbook(
  res: AnalysisResult,
  chartImages?: ChartImageItem[],
  glAnalyticsDataRaw?: unknown,
): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'AuditSoft — Hệ Thống Trợ Lý Kiểm Toán Toàn Diện'
  wb.created = new Date()

  const glData = (glAnalyticsDataRaw as GlAnalyticsResult) || null

  const ws = wb.addWorksheet('BaoCao_PhanTich_VSA520', {
    views: [{ showGridLines: true }],
  })

  // Đặt độ rộng cột tiêu chuẩn cho báo cáo 1 sheet
  ws.getColumn(1).width = 4   // Cột đệm lề trái
  ws.getColumn(2).width = 12  // Cột 1: Mã / STT / Nhãn ngắn
  ws.getColumn(3).width = 46  // Cột 2: Tên chỉ tiêu / Khoản mục / Nội dung
  ws.getColumn(4).width = 22  // Cột 3: Căn cứ / Số tiền 1 / Năm nay
  ws.getColumn(5).width = 22  // Cột 4: Số tiền 2 / Năm trước / Có
  ws.getColumn(6).width = 18  // Cột 5: Chênh lệch / Tỷ trọng
  ws.getColumn(7).width = 18  // Cột 6: % / Tích lũy
  ws.getColumn(8).width = 20  // Cột 7
  ws.getColumn(9).width = 20  // Cột 8
  ws.getColumn(10).width = 45 // Cột 9: Ghi chú / Đánh giá kiểm toán
  for (let c = 11; c <= 16; c++) ws.getColumn(c).width = 18

  // ══════════════════════════════════════════════════════════════════════
  // HEADER BÁO CÁO CHÍNH
  // ══════════════════════════════════════════════════════════════════════
  ws.getCell('B2').value = 'BÁO CÁO TỔNG HỢP PHÂN TÍCH TÀI CHÍNH & RỦI RO KIỂM TOÁN (VSA 520)'
  ws.getCell('B2').font = { size: 16, bold: true, color: { argb: 'FF0F766E' }, name: 'Calibri' }

  ws.getCell('B3').value = `Nguồn dữ liệu: Sổ Nhật Ký Chung (${res.fileName || 'Kỳ này'}) · Ngày lập báo cáo: ${new Date().toLocaleDateString('vi-VN')}`
  ws.getCell('B3').font = { size: 10.5, italic: true, color: { argb: 'FF64748B' }, name: 'Calibri' }

  let curRow = 5

  // ══════════════════════════════════════════════════════════════════════
  // PHẦN A: CÁC BIỂU ĐỒ TRỰC QUAN HÓA (NẾU CÓ ẢNH TỪ GIAO DIỆN)
  // ══════════════════════════════════════════════════════════════════════
  if (chartImages && chartImages.length > 0) {
    styleSectionBanner(ws, curRow, 'A. HỆ THỐNG BIỂU ĐỒ TRỰC QUAN HÓA TÀI CHÍNH & DÒNG TIỀN (CHARTS)', 14)
    curRow += 2

    for (const chart of chartImages) {
      if (!chart.pngBase64) continue
      const rawBase64 = chart.pngBase64.replace(/^data:image\/[a-z]+;base64,/, '')
      if (!rawBase64) continue

      try {
        const imgId = wb.addImage({
          base64: rawBase64,
          extension: 'png',
        })

        const titleCell = ws.getCell(`B${curRow}`)
        titleCell.value = `📊 ${chart.title.toUpperCase()}`
        titleCell.font = { size: 11, bold: true, color: { argb: 'FF0F766E' }, name: 'Calibri' }

        ws.addImage(imgId, {
          tl: { col: 1.2, row: curRow + 0.8 },
          ext: { width: 850, height: 260 },
        })

        curRow += 16 // Dành khoảng trống cho ảnh
      } catch (err) {
        console.warn('Lỗi chèn ảnh biểu đồ:', err)
      }
    }
    curRow += 2
  }

  // ══════════════════════════════════════════════════════════════════════
  // PHẦN 1: BẢNG CẢNH BÁO RỦI RO KIỂM TOÁN TRỌNG YẾU (CỜ ĐỎ VSA)
  // ══════════════════════════════════════════════════════════════════════
  styleSectionBanner(ws, curRow, 'PHẦN 1: BẢNG CẢNH BÁO RỦI RO KIỂM TOÁN TRỌNG YẾU (VSA 520 / VSA 240)', 10)
  curRow++

  const r1Header = ws.getRow(curRow)
  r1Header.getCell(2).value = 'Mức Rủi Ro'
  r1Header.getCell(3).value = 'Tên Rủi Ro Trọng Yếu'
  r1Header.getCell(4).value = 'Căn Cứ Kiểm Toán'
  r1Header.getCell(5).value = 'Phân Hệ Nghiệp Vụ'
  r1Header.getCell(10).value = 'Quan Sát & Khuyến Nghị Xử Lý Cho KTV'
  styleTableHeader(ws, curRow, 2, 10)
  curRow++

  res.findings.forEach((f, idx) => {
    const row = ws.getRow(curRow)
    row.getCell(2).value = f.riskLevel === 'HIGH' ? 'RỦI RO CAO' : f.riskLevel === 'MEDIUM' ? 'CẢNH BÁO' : 'THẤP'
    row.getCell(3).value = f.title
    row.getCell(4).value = f.ruleId
    row.getCell(5).value = f.category
    row.getCell(10).value = `${f.observation} — Hệ quả: ${f.auditImplication || 'Cần kiểm tra sâu'}`
    row.height = 24
    applyBorders(row, 2, 10)

    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
    if (f.riskLevel === 'HIGH') {
      row.getCell(2).font = { bold: true, color: { argb: 'FFDC2626' } }
      row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } }
    } else {
      row.getCell(2).font = { bold: true, color: { argb: 'FFD97706' } }
      row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } }
    }
    if (idx % 2 === 1) {
      for (let c = 3; c <= 10; c++) row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
    }
    curRow++
  })

  curRow += 2

  // ══════════════════════════════════════════════════════════════════════
  // PHẦN 2: BÁO CÁO KẾT QUẢ KINH DOANH (B02) SO SÁNH 2 NĂM
  // ══════════════════════════════════════════════════════════════════════
  const kqkdSource = glData?.kqkdYoY?.rows || (res.kqkd?.lines.map(l => ({
    maSo: l.maSo,
    chiTieu: l.chiTieu,
    current: num(l.current),
    prior: l.prior != null ? num(l.prior) : null,
    diff: num(l.change),
    pct: l.pctChange != null ? l.pctChange * 100 : null,
  })))

  if (kqkdSource && kqkdSource.length > 0) {
    styleSectionBanner(ws, curRow, 'PHẦN 2: SO SÁNH BÁO CÁO KẾT QUẢ KINH DOANH (B02) — NĂM NAY VS NĂM TRƯỚC', 10)
    curRow++

    const r2Header = ws.getRow(curRow)
    r2Header.getCell(2).value = 'Mã Số'
    r2Header.getCell(3).value = 'Chỉ Tiêu Báo Cáo KQKD'
    r2Header.getCell(4).value = 'Năm Nay (VNĐ)'
    r2Header.getCell(5).value = 'Năm Trước (VNĐ)'
    r2Header.getCell(6).value = 'Chênh Lệch (VNĐ)'
    r2Header.getCell(7).value = '% Biến Động'
    r2Header.getCell(10).value = 'Đánh Giá Kiểm Toán'
    styleTableHeader(ws, curRow, 2, 10)
    curRow++

    kqkdSource.forEach((r, idx) => {
      const isLoss = (r.maSo === '60' || r.maSo === '70') && (r.current ?? 0) < 0
      const isAnomaly = Math.abs(r.pct ?? 0) >= 50 && (r.current ?? 0) !== 0
      const alertText = isLoss ? 'LỖ GỘP / LỖ THUẦN' : isAnomaly ? 'BIẾN ĐỘNG TRỌNG YẾU' : 'Bình thường'

      const row = ws.getRow(curRow)
      row.getCell(2).value = r.maSo
      row.getCell(3).value = r.chiTieu
      row.getCell(4).value = r.current
      row.getCell(5).value = r.prior ?? null
      row.getCell(6).value = r.diff ?? null
      row.getCell(7).value = r.pct != null ? r.pct / 100 : null
      row.getCell(10).value = alertText

      row.height = 22
      applyBorders(row, 2, 10)

      row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
      row.getCell(3).font = { bold: r.maSo === '10' || r.maSo === '20' || r.maSo === '50' || r.maSo === '60' }
      row.getCell(4).numFmt = MONEY_FMT
      row.getCell(5).numFmt = MONEY_FMT
      row.getCell(6).numFmt = MONEY_FMT
      row.getCell(7).numFmt = PCT_FMT

      if (isLoss) {
        row.getCell(4).font = { bold: true, color: { argb: 'FFDC2626' } }
        row.getCell(10).font = { bold: true, color: { argb: 'FFDC2626' } }
        row.getCell(10).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF1F2' } }
      } else if (isAnomaly) {
        row.getCell(10).font = { bold: true, color: { argb: 'FFD97706' } }
      }

      if (idx % 2 === 1 && !isLoss) {
        for (let c = 2; c <= 10; c++) row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
      }
      curRow++
    })

    curRow += 2
  }

  // ══════════════════════════════════════════════════════════════════════
  // PHẦN 3: BÓC TÁCH LÃI VAY & TRẦN 30% EBITDA (NGHỊ ĐỊNH 132/2020)
  // ══════════════════════════════════════════════════════════════════════
  if (glData?.ebitda) {
    styleSectionBanner(ws, curRow, 'PHẦN 3: BÓC TÁCH CHI PHÍ LÃI VAY & KHỐNG CHẾ TRẦN 30% EBITDA (NĐ 132/2020/NĐ-CP)', 10)
    curRow++

    const r3Header = ws.getRow(curRow)
    r3Header.getCell(2).value = 'STT'
    r3Header.getCell(3).value = 'Khoản Mục / Bước Tính Toán EBITDA'
    r3Header.getCell(4).value = 'Căn Cứ Hạch Toán / Pháp Lý'
    r3Header.getCell(5).value = 'Số Tiền (VNĐ)'
    r3Header.getCell(10).value = 'Ghi Chú Rà Soát Quyết Toán Thuế TNDN (Chỉ tiêu B4)'
    styleTableHeader(ws, curRow, 2, 10)
    curRow++

    const eb = glData.ebitda
    const opProfit = moneyToNumber(eb.operatingProfit)
    const depr = moneyToNumber(eb.depreciation)
    const fExp = moneyToNumber(eb.interestExpense)
    const fInc = moneyToNumber(eb.interestIncome)
    const ebitdaVal = moneyToNumber(eb.ebitda)
    const cap30 = moneyToNumber(eb.cap30)
    const disallowed = moneyToNumber(eb.disallowedInterest)

    const ebitdaRows = [
      { stt: '1', name: 'Lợi nhuận thuần từ hoạt động kinh doanh', base: 'Mã số 30 (KQKD)', val: opProfit, note: 'Lợi nhuận kinh doanh trước thuế & chi phí lãi vay' },
      { stt: '2', name: 'Cộng: Khấu hao tài sản cố định trong kỳ', base: 'Phát sinh Có TK 214', val: depr, note: 'Khấu hao TSCĐ hữu hình & vô hình' },
      { stt: '3', name: 'Cộng: Chi phí lãi vay phát sinh', base: 'Phát sinh Nợ TK 635 (Chi tiết lãi)', val: fExp, note: 'Chi phí đi vay phục vụ SXKD' },
      { stt: '4', name: 'Trừ: Doanh thu lãi tiền gửi, cho vay', base: 'Phát sinh Có TK 515 (Chi tiết lãi)', val: -fInc, note: 'Doanh thu tài chính từ tiền gửi và cho vay' },
      { stt: '==>', name: 'EBITDA KỲ NÀY', base: 'Nghị định 132/2020/NĐ-CP', val: ebitdaVal, note: eb.isOverCap ? 'EBITDA âm/nhỏ dẫn đến toàn bộ lãi vay bị khống chế' : 'Đạt chuẩn' },
      { stt: '5', name: 'Mức trần chi phí lãi vay được trừ (30% EBITDA)', base: '30% × EBITDA', val: cap30, note: 'Trần chi phí lãi vay tối đa được trừ khi tính thuế TNDN' },
      { stt: '6', name: 'CHI PHÍ LÃI VAY VƯỢT TRẦN (ĐIỀU CHỈNH TĂNG CHỈ TIÊU B4)', base: 'Chi phí không được trừ', val: disallowed, note: eb.isOverCap ? 'Bắt buộc điều chỉnh tăng Chỉ tiêu B4 trên Tờ khai 03/TNDN' : 'Không bị loại trừ' },
    ]

    ebitdaRows.forEach((r, idx) => {
      const isTotal = r.stt === '==>' || r.stt === '6'
      const row = ws.getRow(curRow)
      row.getCell(2).value = r.stt
      row.getCell(3).value = r.name
      row.getCell(4).value = r.base
      row.getCell(5).value = r.val
      row.getCell(10).value = r.note

      row.height = 24
      applyBorders(row, 2, 10)
      row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
      row.getCell(5).numFmt = MONEY_FMT

      if (isTotal) {
        row.font = { bold: true }
        if (r.stt === '6' && eb.isOverCap) {
          row.getCell(5).font = { bold: true, color: { argb: 'FFDC2626' } }
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } }
        } else {
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } }
        }
      } else if (idx % 2 === 1) {
        for (let c = 2; c <= 10; c++) row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
      }
      curRow++
    })

    curRow += 2
  }

  // ══════════════════════════════════════════════════════════════════════
  // PHẦN 4: RÀ SOÁT GIAO DỊCH BÊN LIÊN QUAN (VSA 550)
  // ══════════════════════════════════════════════════════════════════════
  if (glData?.relatedParties) {
    styleSectionBanner(ws, curRow, 'PHẦN 4: RÀ SOÁT GIAO DỊCH BÊN LIÊN QUAN & VAY MƯỢN 0% (VSA 550)', 10)
    curRow++

    const r4Header = ws.getRow(curRow)
    r4Header.getCell(2).value = 'STT'
    r4Header.getCell(3).value = 'Đối Tượng / Bên Liên Quan Nghi Ngờ'
    r4Header.getCell(4).value = 'Tài Khoản Kế Toán'
    r4Header.getCell(5).value = 'Dấu Hiệu Nghiệp Vụ (VSA 550 / NĐ 132)'
    r4Header.getCell(6).value = 'Giá Trị Phát Sinh'
    r4Header.getCell(10).value = 'Thủ Tục Kiểm Toán Khuyến Nghị'
    styleTableHeader(ws, curRow, 2, 10)
    curRow++

    const rpList = glData.relatedParties
    if (rpList.length === 0) {
      const row = ws.getRow(curRow)
      row.getCell(2).value = 1
      row.getCell(3).value = 'Toàn bộ tổng thể Sổ NKC'
      row.getCell(4).value = '1388, 3388, 128'
      row.getCell(5).value = 'Không phát hiện nghiệp vụ vay mượn 0% hoặc tạm ứng tồn đọng bất thường'
      row.getCell(6).value = 0
      row.getCell(10).value = 'Lưu hồ sơ kiểm toán — Không có rủi ro trọng yếu'
      row.height = 24
      applyBorders(row, 2, 10)
      row.getCell(6).numFmt = MONEY_FMT
      curRow++
    } else {
      rpList.forEach((rp, idx) => {
        const amt = rp.totalAmount ? moneyToNumber(rp.totalAmount) : 0
        const row = ws.getRow(curRow)
        row.getCell(2).value = idx + 1
        row.getCell(3).value = rp.partyName || rp.name || 'Bên liên quan'
        row.getCell(4).value = (rp.accounts && rp.accounts.length > 0 ? rp.accounts.join(', ') : '1388 / 3388')
        row.getCell(5).value = rp.description || rp.auditWarning || 'Nghiệp vụ vay mượn / tạm ứng'
        row.getCell(6).value = amt
        row.getCell(10).value = 'Gửi thư xác nhận bên liên quan; rà soát nghĩa vụ kê khai Phụ lục giao dịch liên kết'

        row.height = 24
        applyBorders(row, 2, 10)
        row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
        row.getCell(6).numFmt = MONEY_FMT
        row.getCell(6).font = { bold: true, color: { argb: 'FFB45309' } }

        if (idx % 2 === 1) {
          for (let c = 2; c <= 10; c++) row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
        }
        curRow++
      })
    }

    curRow += 2
  }

  // ══════════════════════════════════════════════════════════════════════
  // PHẦN 5: TỶ TRỌNG PARETO TOP KHÁCH HÀNG & NHÀ CUNG CẤP
  // ══════════════════════════════════════════════════════════════════════
  if (glData?.pareto) {
    styleSectionBanner(ws, curRow, 'PHẦN 5: PHÂN TÍCH TỶ TRỌNG PARETO — TOP KHÁCH HÀNG & TOP NHÀ CUNG CẤP', 10)
    curRow++

    const r5Header = ws.getRow(curRow)
    r5Header.getCell(2).value = 'Hạng'
    r5Header.getCell(3).value = 'Top Khách Hàng (Doanh Thu)'
    r5Header.getCell(4).value = 'Doanh Số Bán (VNĐ)'
    r5Header.getCell(5).value = 'Tỷ Trọng %'
    r5Header.getCell(6).value = 'Top Nhà Cung Cấp (Chi Phí)'
    r5Header.getCell(7).value = 'Giá Trị Mua (VNĐ)'
    r5Header.getCell(10).value = 'Tỷ Trọng % Mua Hàng'
    styleTableHeader(ws, curRow, 2, 10)
    curRow++

    const maxRows = Math.max(glData.pareto.topCustomers.length, glData.pareto.topSuppliers.length)
    for (let i = 0; i < maxRows; i++) {
      const cust = glData.pareto.topCustomers[i]
      const supp = glData.pareto.topSuppliers[i]

      const row = ws.getRow(curRow)
      row.getCell(2).value = i + 1
      row.getCell(3).value = cust ? cust.name : ''
      row.getCell(4).value = cust ? moneyToNumber(cust.amount) : null
      row.getCell(5).value = cust ? cust.percentage / 100 : null
      row.getCell(6).value = supp ? supp.name : ''
      row.getCell(7).value = supp ? moneyToNumber(supp.amount) : null
      row.getCell(10).value = supp ? supp.percentage / 100 : null

      row.height = 22
      applyBorders(row, 2, 10)
      row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }

      if (cust) {
        row.getCell(4).numFmt = MONEY_FMT
        row.getCell(5).numFmt = PCT_FMT
      }
      if (supp) {
        row.getCell(7).numFmt = MONEY_FMT
        row.getCell(10).numFmt = PCT_FMT
      }

      if (i % 2 === 1) {
        for (let c = 2; c <= 10; c++) row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
      }
      curRow++
    }

    curRow += 2
  }

  // ══════════════════════════════════════════════════════════════════════
  // PHẦN 6: MA TRẬN PHÁT SINH 12 THÁNG (TREND 12M)
  // ══════════════════════════════════════════════════════════════════════
  if (glData?.trend12m) {
    styleSectionBanner(ws, curRow, 'PHẦN 6: MA TRẬN BIẾN ĐỘNG CHI PHÍ & GIÁ VỐN 12 THÁNG (TREND 12M)', 15)
    curRow++

    const tHeadRow = ws.getRow(curRow)
    tHeadRow.getCell(2).value = 'Khoản Mục'
    tHeadRow.getCell(3).value = 'Tên Khoản Mục'
    for (let m = 1; m <= 12; m++) {
      tHeadRow.getCell(3 + m).value = `Tháng ${String(m).padStart(2, '0')}`
    }
    tHeadRow.getCell(16).value = 'Tổng Cả Năm'
    styleTableHeader(ws, curRow, 2, 16)
    curRow++

    glData.trend12m.rows.forEach((r, idx) => {
      const row = ws.getRow(curRow)
      row.getCell(2).value = r.key
      row.getCell(3).value = r.label
      for (let m = 0; m < 12; m++) {
        const mVal = r.months[m]
        const val = mVal ? moneyToNumber(mVal) : 0
        const cCell = row.getCell(4 + m)
        cCell.value = val
        cCell.numFmt = MONEY_FMT
      }
      const totalCell = row.getCell(16)
      totalCell.value = moneyToNumber(r.total)
      totalCell.numFmt = MONEY_FMT
      totalCell.font = { bold: true, color: { argb: 'FF0F766E' } }
      totalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDFA' } }

      row.height = 22
      applyBorders(row, 2, 16)
      row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
      row.getCell(3).font = { bold: true }

      if (idx % 2 === 1) {
        for (let c = 2; c <= 15; c++) row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
      }
      curRow++
    })

    curRow += 2
  }

  // ══════════════════════════════════════════════════════════════════════
  // PHẦN 7: CHI TIẾT CHI PHÍ 641 & 642 CẤP 4 QUA 12 THÁNG
  // ══════════════════════════════════════════════════════════════════════
  if (glData?.expenseDetail?.sell || glData?.expenseDetail?.admin) {
    styleSectionBanner(ws, curRow, 'PHẦN 7: CHI TIẾT CHI PHÍ BÁN HÀNG (641) & CHI PHÍ QLDN (642) QUA 12 THÁNG', 14)
    curRow++

    const reports = [
      { name: '1. CHI PHÍ BÁN HÀNG (TK 641)', rep: glData.expenseDetail.sell },
      { name: '2. CHI PHÍ QUẢN LÝ DOANH NGHIỆP (TK 642)', rep: glData.expenseDetail.admin },
    ]

    for (const item of reports) {
      if (!item.rep || item.rep.accounts.length === 0) continue

      const secRow = ws.getRow(curRow)
      secRow.getCell(2).value = item.name
      secRow.getCell(2).font = { bold: true, size: 11.5, color: { argb: 'FF0F766E' } }
      curRow++

      const subHeadRow = ws.getRow(curRow)
      subHeadRow.getCell(2).value = 'Tháng'
      item.rep.accounts.forEach((acc, aIdx) => {
        subHeadRow.getCell(3 + aIdx).value = `TK ${acc}`
      })
      const colTotal = 3 + item.rep.accounts.length
      subHeadRow.getCell(colTotal).value = 'Tổng Chi Phí'
      subHeadRow.getCell(colTotal + 1).value = 'Doanh Thu'
      subHeadRow.getCell(colTotal + 2).value = 'Tỷ Lệ %'
      styleTableHeader(ws, curRow, 2, colTotal + 2)
      curRow++

      const months = ['Tháng 01', 'Tháng 02', 'Tháng 03', 'Tháng 04', 'Tháng 05', 'Tháng 06', 'Tháng 07', 'Tháng 08', 'Tháng 09', 'Tháng 10', 'Tháng 11', 'Tháng 12']
      months.forEach((mLabel, mIdx) => {
        const row = ws.getRow(curRow)
        row.getCell(2).value = mLabel
        row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
        row.getCell(2).font = { bold: true, color: { argb: 'FF0284C7' } }

        let mTotal = 0
        item.rep.months.forEach((col, cIdx) => {
          const val = col[mIdx] ?? 0
          const cell = row.getCell(3 + cIdx)
          cell.value = val
          cell.numFmt = MONEY_FMT
          mTotal += val
        })

        const rev = item.rep.revenue[mIdx] ?? 0
        const ratio = item.rep.ratios[mIdx]

        row.getCell(colTotal).value = mTotal
        row.getCell(colTotal).numFmt = MONEY_FMT
        row.getCell(colTotal).font = { bold: true }

        row.getCell(colTotal + 1).value = rev
        row.getCell(colTotal + 1).numFmt = MONEY_FMT

        row.getCell(colTotal + 2).value = ratio != null ? ratio / 100 : null
        row.getCell(colTotal + 2).numFmt = PCT_FMT

        row.height = 20
        applyBorders(row, 2, colTotal + 2)
        curRow++
      })

      curRow += 2
    }
  }

  return wb
}
