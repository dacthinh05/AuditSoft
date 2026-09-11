/**
 * Dịch vụ Tích hợp Trợ Lý Kiểm Toán AI Google Gemini 2.5 (BYOK)
 * AuditSoft — Phân Tích Chuyên Sâu BCTC Chuẩn Mực VSA 520
 */

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'

export interface GeminiConfig {
  apiKey: string
  model?: string
}

export interface KqkdYoYMetric {
  chiTieu: string
  current: number
  prior: number | null
  diff?: number | null
  pct: number | null
}

export interface MonthlyBreakdownRow {
  month: number
  revenue: number
  cogs632: number
  grossMarginPct: number
  productionCost?: number
  prodCostToRevPct?: number
  isLumpSumYearEnd?: boolean
  isAnomaly?: boolean
  auditNote?: string
}

export interface CashTaxRiskPayload {
  totalCashOverThreshold: number
  countCashOverThreshold: number
  thresholdUsed: number
  penalty811Amount: number
  noInvoiceAmount?: number
  estimatedB4Amount: number
  estimatedTaxIncrease: number
  auditWarnings: string[]
}

export interface RelatedPartyPayloadItem {
  name: string
  relationship?: string
  amount: number
  accounts?: string[]
  riskType?: string
  auditWarning?: string
}

export interface ParetoSummaryPayload {
  topCustomerName?: string
  topCustomerPct?: number
  top5CustomersPct?: number
  customerRiskWarning?: string | null
  topSupplierName?: string
  topSupplierPct?: number
  top5SuppliersPct?: number
  supplierRiskWarning?: string | null
}

export interface FinancialMetricsPayload {
  clientName?: string
  fiscalYear?: string
  businessType?: 'MANUFACTURING' | 'TRADING' | 'HYBRID' | 'SERVICES'
  auditorContextNote?: string
  ebitda?: {
    revenue: number
    cogs: number
    grossProfit: number
    ebitda: number
    operatingProfit: number
    ebitdaMarginPct: number
    netInterest?: number
    depreciation?: number
    interestToEbitdaRatio?: number | null
    isOverCap?: boolean
  }
  trend12m?: {
    totalRevenue: number
    totalCogs: number
    revenueByMonth: number[]
    cogsByMonth: number[]
    grossMarginByMonth: number[]
    anomalousMonths: number[]
  }
  monthlyBreakdown?: MonthlyBreakdownRow[]
  kqkdYoY?: KqkdYoYMetric[]
  opex?: {
    sellingExpense: number
    adminExpense: number
    opexRatioPct: number
    anomalousMonths: number[]
    topSubaccounts?: Array<{ code: string; name: string; amount: number }>
  }
  cogsMatrix?: {
    isLumpSumYearEnd: boolean
    totalProductionCost: number
    totalCogs632: number
    monthlyProductionCost: number[]
    monthlyCogs632: number[]
    prodCostToRevenuePctByMonth: number[]
    summaryWarnings: string[]
  }
  cashTaxRisk?: CashTaxRiskPayload
  relatedParties?: RelatedPartyPayloadItem[]
  pareto?: ParetoSummaryPayload
  topRisks?: string[]
}

/**
 * Khử định danh thông tin doanh nghiệp trước khi gửi lên Gemini API
 * Đảm bảo 100% tuân thủ bảo mật thông tin khách hàng kiểm toán.
 */
export function anonymizePayload(payload: FinancialMetricsPayload): FinancialMetricsPayload {
  const safeRelatedParties = payload.relatedParties?.map((rp, idx) => ({
    ...rp,
    name: `BEN_LIEN_QUAN_${String(idx + 1).padStart(2, '0')}`,
  }))

  const safePareto = payload.pareto
    ? {
        ...payload.pareto,
        topCustomerName: payload.pareto.topCustomerName ? 'KHACH_HANG_LON_NHAT' : undefined,
        topSupplierName: payload.pareto.topSupplierName ? 'NHA_CUNG_CAP_LON_NHAT' : undefined,
      }
    : undefined

  return {
    ...payload,
    clientName: 'DOANH_NGHIEP_KIEM_TOAN_A',
    fiscalYear: payload.fiscalYear || `${new Date().getFullYear()}`,
    relatedParties: safeRelatedParties,
    pareto: safePareto,
  }
}

/**
 * Xây dựng Prompt phân tích tài chính chuyên sâu chuẩn VSA 520 dạng Tabular Grounding
 */
export function buildVsa520Prompt(payload: FinancialMetricsPayload): string {
  const safeData = anonymizePayload(payload)
  const ebitda = safeData.ebitda
  const trend = safeData.trend12m
  const opex = safeData.opex
  const cogsMatrix = safeData.cogsMatrix
  const monthly = safeData.monthlyBreakdown
  const yoy = safeData.kqkdYoY
  const tax = safeData.cashTaxRisk
  const relParties = safeData.relatedParties
  const pareto = safeData.pareto

  const formatVnd = (num: number | undefined | null) => {
    if (num == null || !Number.isFinite(num)) return '0 đ'
    return Math.round(num).toLocaleString('vi-VN') + ' đ'
  }

  const formatPct = (pct: number | undefined | null) => {
    if (pct == null || !Number.isFinite(pct)) return '0%'
    return `${Number(pct.toFixed(1))}%`
  }

  let dataSummary = `=== BỘ CHỈ SỐ TÀI CHÍNH KIỂM TOÁN NIÊN ĐỘ ${safeData.fiscalYear} ===\n`
  dataSummary += `- Đơn vị kiểm toán: ${safeData.clientName}\n`
  if (safeData.businessType) {
    const typeLabel =
      safeData.businessType === 'MANUFACTURING'
        ? 'Sản xuất / Chế tạo'
        : safeData.businessType === 'TRADING'
          ? 'Thương mại / Bán buôn bán lẻ'
          : safeData.businessType === 'SERVICES'
            ? 'Dịch vụ'
            : 'Hỗn hợp (Sản xuất & Thương mại)'
    dataSummary += `- Loại hình kinh doanh: ${typeLabel}\n`
  }
  if (safeData.auditorContextNote) {
    dataSummary += `- Ghi chú bối cảnh thực tế từ KTV: ${safeData.auditorContextNote}\n`
  }

  // 1. TỔNG QUAN CHỈ SỐ EBITDA & KINH DOANH
  if (ebitda) {
    dataSummary += `\n1. CHỈ SỐ LỢI NHUẬN & EBITDA:\n`
    dataSummary += `  + Doanh thu thuần (TK 511): ${formatVnd(ebitda.revenue)}\n`
    dataSummary += `  + Giá vốn hàng bán (TK 632): ${formatVnd(ebitda.cogs)}\n`
    dataSummary += `  + Lợi nhuận gộp: ${formatVnd(ebitda.grossProfit)}\n`
    dataSummary += `  + Lợi nhuận thuần từ HĐKD: ${formatVnd(ebitda.operatingProfit)}\n`
    dataSummary += `  + Chi phí lãi vay thuần: ${formatVnd(ebitda.netInterest)}\n`
    dataSummary += `  + Khấu hao TSCĐ (TK 214): ${formatVnd(ebitda.depreciation)}\n`
    dataSummary += `  + EBITDA: ${formatVnd(ebitda.ebitda)}\n`
    dataSummary += `  + Tỷ suất biên EBITDA: ${ebitda.ebitdaMarginPct ?? 0}%\n`
    if (ebitda.interestToEbitdaRatio != null) {
      dataSummary += `  + Tỷ lệ Lãi vay / EBITDA: ${ebitda.interestToEbitdaRatio}%\n`
    }
    if (ebitda.isOverCap) {
      dataSummary += `  + ⚠️ CẢNH BÁO NGHỊ ĐỊNH 132/2020: Chi phí lãi vay vượt mức khống chế 30% EBITDA!\n`
    }
  }

  // 2. BẢNG 1: KQKD SO SÁNH NIÊN ĐỘ (YOY B02)
  if (yoy && yoy.length > 0) {
    dataSummary += `\n2. BẢNG 1: KẾT QUẢ KINH DOANH SO SÁNH NIÊN ĐỘ (YOY B02):\n`
    dataSummary += `| Chỉ Tiêu BCTC | Năm Trước (N-1) | Năm Nay (N) | Chênh Lệch | Tăng/Giảm (%) |\n`
    dataSummary += `| :--- | :---: | :---: | :---: | :---: |\n`
    yoy.forEach((row) => {
      const priorStr = row.prior != null ? formatVnd(row.prior) : 'N/A'
      const currStr = formatVnd(row.current)
      const diffVal = row.diff != null ? row.diff : (row.prior != null ? row.current - row.prior : null)
      const diffStr = diffVal != null ? formatVnd(diffVal) : 'N/A'
      const pctStr = row.pct != null ? `${row.pct > 0 ? '+' : ''}${row.pct.toFixed(1)}%` : 'N/A'
      dataSummary += `| ${row.chiTieu} | ${priorStr} | ${currStr} | ${diffStr} | ${pctStr} |\n`
    })
  }

  // 3. BẢNG 2: MA TRẬN DOANH THU, GIÁ VỐN & CPSX 12 THÁNG
  dataSummary += `\n3. BẢNG 2: MA TRẬN 12 THÁNG — DOANH THU (511), GIÁ VỐN (632) & CPSX THỰC TẾ:\n`
  if (monthly && monthly.length > 0) {
    dataSummary += `| Tháng | Doanh Thu (511) | Giá Vốn (632) | Biên Gộp (%) | CPSX Thực Tế | CPSX/DT (%) | Đánh Giá Sơ Bộ |\n`
    dataSummary += `| :---: | :---: | :---: | :---: | :---: | :---: | :--- |\n`
    monthly.forEach((m) => {
      const monthLabel = `Tháng ${String(m.month).padStart(2, '0')}`
      const note = m.isLumpSumYearEnd
        ? '⚠️ Dồn giá vốn cuối năm'
        : m.isAnomaly
          ? '⚠️ Đột biến biên gộp'
          : m.auditNote || 'Bình thường'
      const prodCostStr = m.productionCost != null ? formatVnd(m.productionCost) : '-'
      const prodCostPctStr = m.prodCostToRevPct != null ? formatPct(m.prodCostToRevPct) : '-'
      dataSummary += `| ${monthLabel} | ${formatVnd(m.revenue)} | ${formatVnd(m.cogs632)} | ${formatPct(m.grossMarginPct)} | ${prodCostStr} | ${prodCostPctStr} | ${note} |\n`
    })
  } else if (trend && trend.revenueByMonth && trend.revenueByMonth.length > 0) {
    dataSummary += `| Tháng | Doanh Thu (511) | Giá Vốn (632) | Biên Gộp (%) | CPSX Thực Tế | Ghi Chú |\n`
    dataSummary += `| :---: | :---: | :---: | :---: | :---: | :--- |\n`
    const monthsCount = Math.max(trend.revenueByMonth.length, trend.cogsByMonth?.length || 0)
    for (let i = 0; i < monthsCount; i++) {
      const mNum = i + 1
      const rev = trend.revenueByMonth[i] || 0
      const cogs = trend.cogsByMonth?.[i] || 0
      const margin = trend.grossMarginByMonth?.[i] ?? (rev > 0 ? ((rev - cogs) / rev) * 100 : 0)
      const prodCost = cogsMatrix?.monthlyProductionCost?.[i]
      const isAnomaly = trend.anomalousMonths?.includes(mNum)
      const note = isAnomaly ? '⚠️ Đột biến' : 'Bình thường'
      dataSummary += `| Tháng ${String(mNum).padStart(2, '0')} | ${formatVnd(rev)} | ${formatVnd(cogs)} | ${formatPct(margin)} | ${prodCost != null ? formatVnd(prodCost) : '-'} | ${note} |\n`
    }
  }

  if (trend) {
    dataSummary += `  + Tổng Doanh thu cả năm: ${formatVnd(trend.totalRevenue)}\n`
    dataSummary += `  + Tổng Giá vốn cả năm: ${formatVnd(trend.totalCogs)}\n`
    if (trend.anomalousMonths && trend.anomalousMonths.length > 0) {
      dataSummary += `  + CẢNH BÁO ĐỘT BIẾN: Các tháng có biên lãi gộp lệch chuẩn: Tháng ${trend.anomalousMonths.join(', ')}\n`
    }
  }

  if (cogsMatrix) {
    dataSummary += `  + MA TRẬN CHI PHÍ GIÁ VỐN 12M & BÓC TÁCH CHI PHÍ THỰC TẾ:\n`
    dataSummary += `  + Tổng Chi Phí Sản Xuất thực tế phát sinh cả năm: ${formatVnd(cogsMatrix.totalProductionCost)}\n`
    dataSummary += `  + Tổng Giá Vốn 632 doanh nghiệp đã hạch toán cả năm: ${formatVnd(cogsMatrix.totalCogs632)}\n`
    if (cogsMatrix.isLumpSumYearEnd) {
      dataSummary += `  + ⚠️ CẢNH BÁO TRỌNG YẾU VSA 520: DOANH NGHIỆP CÓ HIỆN TƯỢNG DỒN GIÁ VỐN VÀO THÁNG 12! Trong 11 tháng đầu năm, chi phí sản xuất thực tế vẫn phát sinh đều đặn nhưng kế toán không kết chuyển sang TK 632 mà dồn toàn bộ vào cuối năm. Nghi ngờ vi phạm nghiêm trọng nguyên tắc phù hợp (Matching concept) và rủi ro ghi nhận sai kỳ (Cutoff).\n`
    }
    if (cogsMatrix.summaryWarnings && cogsMatrix.summaryWarnings.length > 0) {
      cogsMatrix.summaryWarnings.forEach((w) => {
        dataSummary += `  + Điểm lưu ý ma trận: ${w}\n`
      })
    }
  }

  // 4. BẢNG 3: CHI PHÍ HOẠT ĐỘNG (OPEX 641/642)
  if (opex) {
    dataSummary += `\n4. BẢNG 3: CHI PHÍ HOẠT ĐỘNG (OPEX):\n`
    dataSummary += `  + Chi phí bán hàng (TK 641): ${formatVnd(opex.sellingExpense)}\n`
    dataSummary += `  + Chi phí quản lý doanh nghiệp (TK 642): ${formatVnd(opex.adminExpense)}\n`
    dataSummary += `  + Tỷ lệ Tổng OPEX / Doanh thu: ${formatPct(opex.opexRatioPct)}\n`
    if (opex.anomalousMonths && opex.anomalousMonths.length > 0) {
      dataSummary += `  + CẢNH BÁO OPEX BẤT THƯỜNG: Các tháng chi phí tăng vọt: Tháng ${opex.anomalousMonths.join(', ')}\n`
    }
    if (opex.topSubaccounts && opex.topSubaccounts.length > 0) {
      dataSummary += `| Mã TK | Tên Khoản Mục Chi Phí | Giá Trị Cả Năm |\n`
      dataSummary += `| :---: | :--- | :---: |\n`
      opex.topSubaccounts.forEach((sub) => {
        dataSummary += `| ${sub.code} | ${sub.name} | ${formatVnd(sub.amount)} |\n`
      })
    }
  }

  // 5. BẢNG 4: RỦI RO TUÂN THỦ THUẾ TNDN & CHỈ TIÊU B4
  if (tax) {
    dataSummary += `\n5. BẢNG 4: CẢNH BÁO RỦI RO THUẾ TNDN & CHI PHÍ LOẠI TRỪ CHỈ TIÊU B4:\n`
    dataSummary += `| Chuyên Đề Rủi Ro Thuế | Số Lượng / Vụ | Tổng Giá Trị (VNĐ) | Cơ Sở Pháp Lý & Rủi Ro |\n`
    dataSummary += `| :--- | :---: | :---: | :--- |\n`
    dataSummary += `| Chi tiền mặt quá ngưỡng (${tax.thresholdUsed >= 20_000_000 ? '>= 20Tr' : '>= 5Tr NĐ 181'}) | ${tax.countCashOverThreshold} vụ | ${formatVnd(tax.totalCashOverThreshold)} | Vi phạm quy định thanh toán không dùng tiền mặt (NĐ 181/TT 78) |\n`
    dataSummary += `| Tiền phạt VPHC, vi phạm thuế (TK 811) | - | ${formatVnd(tax.penalty811Amount)} | Chi phí không được trừ theo Luật Thuế TNDN |\n`
    if (tax.noInvoiceAmount) {
      dataSummary += `| Chi phí không hóa đơn hợp pháp | - | ${formatVnd(tax.noInvoiceAmount)} | Rủi ro loại trừ chi phí khi thanh tra thuế |\n`
    }
    dataSummary += `| Dự kiến điều chỉnh tăng TNCT (Chỉ tiêu B4) | - | ${formatVnd(tax.estimatedB4Amount)} | Tổng chi phí dự kiến loại trừ khi Quyết toán Thuế TNDN |\n`
    dataSummary += `| Thuế TNDN phát sinh tăng ước tính (20%) | - | ${formatVnd(tax.estimatedTaxIncrease)} | Rủi ro truy thu thuế & phạt chậm nộp |\n`
    if (tax.auditWarnings && tax.auditWarnings.length > 0) {
      tax.auditWarnings.forEach((w) => {
        dataSummary += `  - Lưu ý thuế: ${w}\n`
      })
    }
  }

  // 6. BẢNG 5: BÊN LIÊN QUAN & TẬP TRUNG PARETO
  if ((relParties && relParties.length > 0) || pareto) {
    dataSummary += `\n6. BẢNG 5: GIAO DỊCH BÊN LIÊN QUAN & RỦI RO TẬP TRUNG (PARETO):\n`
    if (relParties && relParties.length > 0) {
      dataSummary += `| Bên Liên Quan | Mối Quan Hệ | Số Tiền Phát Sinh | Rủi Ro & Tài Khoản Đối Ứng |\n`
      dataSummary += `| :--- | :--- | :---: | :--- |\n`
      relParties.forEach((rp) => {
        const accStr = rp.accounts && rp.accounts.length > 0 ? `(TK ${rp.accounts.join(', ')})` : ''
        dataSummary += `| ${rp.name} | ${rp.relationship || 'Bên liên quan'} | ${formatVnd(rp.amount)} | ${rp.riskType || 'Giao dịch trọng yếu'} ${accStr} |\n`
      })
    }
    if (pareto) {
      dataSummary += `  + Tỷ trọng khách hàng: Top 1 chiếm ${formatPct(pareto.topCustomerPct)}, Top 5 chiếm ${formatPct(pareto.top5CustomersPct)} tổng doanh thu.\n`
      if (pareto.customerRiskWarning) {
        dataSummary += `    ⚠️ ${pareto.customerRiskWarning}\n`
      }
      dataSummary += `  + Tỷ trọng nhà cung cấp: Top 1 chiếm ${formatPct(pareto.topSupplierPct)}, Top 5 chiếm ${formatPct(pareto.top5SuppliersPct)} tổng giá trị mua hàng.\n`
      if (pareto.supplierRiskWarning) {
        dataSummary += `    ⚠️ ${pareto.supplierRiskWarning}\n`
      }
    }
  }

  if (safeData.topRisks && safeData.topRisks.length > 0) {
    dataSummary += `\n7. TỔNG HỢP CẢNH BÁO RỦI RO ĐÃ PHÁT HIỆN TỪ ENGINE NỘI BỘ:\n`
    safeData.topRisks.forEach((r, idx) => {
      dataSummary += `  - [Rủi ro ${idx + 1}]: ${r}\n`
    })
  }

  return `Bạn là một Chủ nhiệm kiểm toán độc lập cấp cao (Senior Audit Partner) có hơn 15 năm kinh nghiệm thực chiến theo Hệ thống Chuẩn mực Kiểm toán Việt Nam (VSA), đặc biệt là Chuẩn mực VSA 520 (Thủ tục phân tích), VSA 240 (Gian lận), VSA 550 (Bên liên quan) và Chuẩn mực Kế toán Việt Nam (VAS / Thông tư 200).

Hãy phân tích toàn diện bộ số liệu tài chính bảng biểu dưới đây và lập BẢN THUYẾT MINH PHÂN TÍCH KIỂM TOÁN VSA 520 chuyên nghiệp, ngắn gọn, khúc chiết, mang tính thực chiến cao để KTV đưa trực tiếp vào Giấy làm việc kiểm toán:

${dataSummary}

CHỈ THỊ RÀNG BUỘC KIỂM TOÁN (AUDIT GROUNDING DIRECTIVES):
1. TUYỆT ĐỐI CHỈ nhận định dựa trên số liệu trong các bảng trên. CẤM tự bịa đặt hoặc giả định các con số không tồn tại trong bảng.
2. BẮT BUỘC TRÍCH DẪN số liệu cụ thể kèm thời điểm (tháng/kỳ) và tỷ lệ % chênh lệch khi đưa ra nhận định (Ví dụ: "Doanh thu Tháng 12 đạt X tỷ, tăng Y% so với Tháng 11...", "Chi phí thuế loại trừ B4 dự kiến là Z đ...").
3. Bắt đầu trực tiếp từ tiêu đề "### I. ĐÁNH GIÁ TỔNG QUAN...". TUYỆT ĐỐI KHÔNG mở đầu bằng các placeholder như [Tên KTV], [Ngày lập], [Người soát xét].
4. Văn phong đanh thép, chuẩn mực, trung thực, mang tính phản biện kiểm toán cao theo chuẩn mực kiểm toán độc lập.

YÊU CẦU CẤU TRÚC BÀI NHẬN XÉT PHẢI CÓ ĐỦ 4 PHẦN CHUẨN MỰC SAU (TƯƠNG ỨNG CÁC GIẤY LÀM VIỆC):

### I. ĐÁNH GIÁ TỔNG QUAN HIỆU QUẢ HOẠT ĐỘNG & KHẢ NĂNG SINH LỜI (GIẤY LÀM VIỆC A710)
- Đánh giá chất lượng doanh thu và lợi nhuận qua biến động YoY (Bảng 1) và tỷ suất biên EBITDA.
- Đánh giá tính liên tục trong hoạt động kinh doanh và khả năng tạo tiền.

### II. PHÂN TÍCH BIẾN ĐỘNG BẤT THƯỜNG TRỌNG YẾU & MA TRẬN GIÁ VỐN (GIẤY LÀM VIỆC G353)
- Mổ xẻ chi tiết ma trận 12 tháng: so sánh giữa Doanh thu 511, Giá vốn 632 và Chi phí sản xuất thực tế phát sinh.
- Chỉ rõ hiện tượng dồn chi phí cuối năm (nếu có), rủi ro Cut-off và vi phạm nguyên tắc phù hợp (Matching concept).

### III. ĐÁNH GIÁ RỦI RO TUÂN THỦ THUẾ & GIAO DỊCH TRỌNG YẾU (GIẤY LÀM VIỆC E300)
- Đánh giá chi tiết các khoản chi phí có rủi ro bị loại trừ khi quyết toán thuế TNDN (chi tiền mặt quá ngưỡng, phạt 811, ước tính chỉ tiêu B4 và thuế truy thu).
- Đánh giá rủi ro giao dịch bên liên quan (cho vay mượn 0%, tạm ứng tồn đọng) và rủi ro phụ thuộc khách hàng/nhà cung cấp (Pareto).

### IV. THỦ TỤC KIỂM TOÁN CƠ BẢN CẦN BỔ SUNG (SUBSTANTIVE PROCEDURES)
- Đề xuất cụ thể 3 đến 5 thủ tục kiểm toán chi tiết tiếp theo theo VSA 500 / VSA 520 (bốc mẫu chứng từ tháng nào, đối chiếu tài khoản đối ứng nào, gửi thư xác nhận đối tượng nào...).`
}
/**
 * Kiểm tra tính hợp lệ của Gemini API Key
 */
export async function testGeminiConnection(
  apiKey: string,
  model = DEFAULT_GEMINI_MODEL,
): Promise<{ success: boolean; message: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'Vui lòng nhập API Key của Google Gemini.' }
  }

  const cleanKey = apiKey.trim()
  const cleanModel = (model || DEFAULT_GEMINI_MODEL).trim()
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent`

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': cleanKey,
      },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: 'Trả lời đúng 1 từ "OK" để xác nhận kết nối thành công.' }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 10,
        },
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      if (res.status === 400 || res.status === 403) {
        return { success: false, message: 'API Key không hợp lệ hoặc chưa được kích hoạt quyền Generative AI.' }
      }
      if (res.status === 404) {
        return { success: false, message: `Không tìm thấy model ${cleanModel}. Hãy thử chọn model gemini-2.5-flash.` }
      }
      if (res.status === 429) {
        return { success: false, message: 'API Key đã tạm thời hết lượt yêu cầu (Quota limit). Vui lòng thử lại sau 1 phút.' }
      }
      return { success: false, message: `Lỗi máy chủ Google (${res.status}): ${errBody.slice(0, 120)}` }
    }

    return {
      success: true,
      message: `✓ Kết nối thành công tới Google Gemini (${cleanModel})!`,
    }
  } catch (err) {
    const isTimeout = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')
    return {
      success: false,
      message: isTimeout
        ? 'Hết thời gian chờ phản hồi (Timeout 15s). Vui lòng kiểm tra lại kết nối mạng.'
        : `Không thể kết nối tới Google API: ${err instanceof Error ? err.message : String(err)}. Vui lòng kiểm tra kết nối mạng.`,
    }
  }
}

/**
 * Gửi yêu cầu phân tích BCTC lên Gemini API và nhận bản nhận xét VSA 520
 */
export async function generateGeminiAuditReview(
  apiKey: string,
  payload: FinancialMetricsPayload,
  model = DEFAULT_GEMINI_MODEL,
): Promise<{ success: boolean; reviewText?: string; error?: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, error: 'Chưa cấu hình Gemini API Key. Vui lòng mở Cài đặt để thêm key.' }
  }

  const prompt = buildVsa520Prompt(payload)
  const cleanKey = apiKey.trim()
  const cleanModel = (model || DEFAULT_GEMINI_MODEL).trim()
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent`

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': cleanKey,
      },
      signal: AbortSignal.timeout(60000),
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2, // Nhiệt độ thấp để đảm bảo tính chuẩn xác và nhất quán tài chính
          maxOutputTokens: 2500,
        },
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      if (res.status === 429) {
        return { success: false, error: 'Tài khoản Google AI đã chạm giới hạn tần suất (Quota Limit). Vui lòng đợi khoảng 1 phút rồi thử lại.' }
      }
      return { success: false, error: `Lỗi Gemini API (${res.status}): ${errText.slice(0, 150)}` }
    }

    const json = (await res.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>
        }
      }>
    }

    const text = json.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text || !text.trim()) {
      return { success: false, error: 'Không nhận được nội dung phản hồi từ Gemini API.' }
    }

    return { success: true, reviewText: text.trim() }
  } catch (err) {
    const isTimeout = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')
    return {
      success: false,
      error: isTimeout
        ? 'Hết thời gian chờ phân tích (Timeout 60s). Máy chủ Google có thể đang quá tải hoặc mạng chập chờn, vui lòng thử lại.'
        : `Lỗi mạng khi gọi Gemini: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}
