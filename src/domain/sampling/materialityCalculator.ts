import type { BenchmarkBase, BenchmarkConfig, SampleableItem } from './types'

export interface BenchmarkTotals {
  totalRevenue: number // Doanh thu bán hàng thuần (Có 511 - Nợ 511/521 / Mã 01 KQKD)
  totalAssets: number // Tổng tài sản (Dư Nợ CK TK loại 1 & 2 / Mã 270 CĐKT)
  totalEquity: number // Vốn đầu tư của CSH (Có 411/412 / Mã 411 CĐKT)
  profitBeforeTax: number // Lợi nhuận trước thuế (Mã 50 KQKD / 5xx-6xx)
  actualProfitRaw?: number // Lợi nhuận thực tế (có thể âm nếu lỗ)
  totalExpenses?: number // Tổng chi phí phát sinh (6xx & 8xx)
  sourceType?: 'WORKBOOK_4_SHEETS' | 'CDFS' | 'NKC_ESTIMATE'
  detectedSheets?: {
    nkc?: string
    cdfs?: string
    kqkd?: string
    cdkt?: string
  }
}

export interface CdfsRowInput {
  matk: string
  tentk?: string
  sdndk?: number
  sdcdk?: number
  psno?: number
  psco?: number
  nock?: number
  cock?: number
}

export interface ComputedMateriality {
  baseName: string
  baseAmount: number
  abnormalAdjustment: number
  adjustedBaseAmount: number
  percentage: number
  overallMateriality: number
  pmRatio: number
  performanceMateriality: number
  cttRatio: number
  clearlyTrivial: number
  lossWarning?: string
}

export interface BenchmarkRecommendation {
  recommendedBase: BenchmarkBase
  recommendedPercentage: number
  reason: string
  isEstablishedFirm: boolean
}

export function extractCellNumber(v: unknown): number {
  if (v == null) return 0
  if (typeof v === 'number') return isNaN(v) ? 0 : v
  if (typeof v === 'object') {
    if ('result' in (v as Record<string, unknown>)) {
      const res = (v as Record<string, unknown>).result
      if (typeof res === 'number') return isNaN(res) ? 0 : res
      if (typeof res === 'string') {
        const clean = res.replace(/[,\s]/g, '').trim()
        const n = parseFloat(clean)
        return isNaN(n) ? 0 : n
      }
    }
    if ('text' in (v as Record<string, unknown>)) {
      const clean = String((v as Record<string, unknown>).text).replace(/[,\s]/g, '').trim()
      const n = parseFloat(clean)
      return isNaN(n) ? 0 : n
    }
  }
  if (typeof v === 'string') {
    const clean = v.replace(/[,\s]/g, '').trim()
    const n = parseFloat(clean)
    return isNaN(n) ? 0 : n
  }
  return 0
}

export function extractCellString(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'number') return String(v)
  if (typeof v === 'object') {
    if ('result' in (v as Record<string, unknown>) && (v as Record<string, unknown>).result != null) {
      return String((v as Record<string, unknown>).result).trim()
    }
    if ('text' in (v as Record<string, unknown>) && (v as Record<string, unknown>).text != null) {
      return String((v as Record<string, unknown>).text).trim()
    }
  }
  return String(v).trim()
}

/**
 * Tự động đề xuất Benchmark theo VSA 320:
 * - Doanh nghiệp đã hoạt động ổn định: đề xuất Doanh thu (TK 511) [0.5% - 3%, mặc định 1.0%]
 * - Doanh nghiệp mới thành lập / giai đoạn đầu tư: đề xuất Vốn CSH (TK 411) [1% - 5%, mặc định 2.0%] hoặc Tổng tài sản [1% - 2%]
 */
export function recommendBenchmark(totals: BenchmarkTotals): BenchmarkRecommendation {
  const rev = totals.totalRevenue
  const assets = totals.totalAssets
  const equity = totals.totalEquity

  // 1. DN có doanh thu đáng kể (> 500 triệu hoặc > 10% tổng tài sản) -> Hoạt động ổn định
  if (rev > 0 && (rev >= 500_000_000 || (assets > 0 && rev >= assets * 0.1))) {
    return {
      recommendedBase: 'REVENUE',
      recommendedPercentage: 1.0,
      reason: 'Doanh nghiệp đã hoạt động sản xuất kinh doanh ổn định (VSA 320 khuyên dùng Doanh thu)',
      isEstablishedFirm: true,
    }
  }

  // 2. DN mới thành lập, giai đoạn đầu tư, hoặc không có doanh thu -> Dùng Vốn chủ sở hữu
  if (equity > 0 && (assets === 0 || equity >= assets * 0.3)) {
    return {
      recommendedBase: 'EQUITY',
      recommendedPercentage: 2.0,
      reason: 'Doanh nghiệp mới thành lập / giai đoạn đầu tư (VSA 320 khuyên dùng Vốn CSH)',
      isEstablishedFirm: false,
    }
  }

  // 3. DN thâm dụng tài sản
  if (assets > 0) {
    return {
      recommendedBase: 'TOTAL_ASSETS',
      recommendedPercentage: 1.0,
      reason: 'Doanh nghiệp thâm dụng vốn / quy mô tài sản lớn (VSA 320 khuyên dùng Tổng tài sản)',
      isEstablishedFirm: false,
    }
  }

  return {
    recommendedBase: 'REVENUE',
    recommendedPercentage: 1.0,
    reason: 'Tiêu chí mặc định theo Doanh thu bán hàng',
    isEstablishedFirm: true,
  }
}

/**
 * Bốc tách chỉ tiêu từ 4 Sheet chủ chốt: CDFS, KQKD, CDKT, NKC
 */
export function extractBenchmarkFromMultiSheets(params: {
  cdfsRows?: CdfsRowInput[]
  cdktMatrix?: unknown[][]
  kqkdMatrix?: unknown[][]
  nkcItems?: readonly SampleableItem[]
  sheetSources?: {
    nkc?: string
    cdfs?: string
    kqkd?: string
    cdkt?: string
  }
}): BenchmarkTotals {
  let totalRevenue = 0
  let totalAssets = 0
  let totalEquity = 0
  let profitBeforeTax = 0
  let actualProfitRaw: number | undefined = undefined

  // 1. Trích xuất từ Sheet KQKD nếu có
  if (params.kqkdMatrix && params.kqkdMatrix.length > 0) {
    for (let r = 0; r < params.kqkdMatrix.length; r++) {
      const row = params.kqkdMatrix[r] ?? []
      const code = extractCellString(row[1] ?? row[0])
      const name = extractCellString(row[2] ?? row[1])
      // Năm nay: Col E (index 4/5) hoặc Col C (index 2/3)
      const val = extractCellNumber(row[4]) || extractCellNumber(row[5]) || extractCellNumber(row[2]) || extractCellNumber(row[3])

      if (
        (code === '01' || code === '10' || name.includes('Doanh thu thuần') || name.includes('Doanh thu bán hàng')) &&
        val > 0
      ) {
        if (!totalRevenue) totalRevenue = val
      }

      if (code === '50' || name.includes('Tổng lợi nhuận kế toán trước thuế') || name.includes('Lợi nhuận trước thuế')) {
        actualProfitRaw = val
        profitBeforeTax = Math.abs(val) // VSA 320: Lấy giá trị tuyệt đối nếu lỗ
      }
    }
  }

  // 2. Trích xuất từ Sheet CDKT nếu có
  if (params.cdktMatrix && params.cdktMatrix.length > 0) {
    for (let r = 0; r < params.cdktMatrix.length; r++) {
      const row = params.cdktMatrix[r] ?? []
      const code = extractCellString(row[1] ?? row[0])
      const name = extractCellString(row[2] ?? row[1])
      const val = extractCellNumber(row[4]) || extractCellNumber(row[5]) || extractCellNumber(row[2]) || extractCellNumber(row[3])

      if ((code === '270' || name.includes('TỔNG CỘNG TÀI SẢN') || name.includes('Tổng tài sản')) && val > 0) {
        totalAssets = val
      }

      if (
        (code === '411' || code === '400' || name.includes('Vốn đầu tư của chủ sở hữu') || name.includes('VỐN CHỦ SỞ HỮU')) &&
        val > 0
      ) {
        if (!totalEquity) totalEquity = val
      }
    }
  }

  // 3. Trích xuất từ Sheet CDFS nếu có
  if (params.cdfsRows && params.cdfsRows.length > 0) {
    const cdfs = calculateBenchmarkFromCdfs(params.cdfsRows)
    if (!totalRevenue && cdfs.totalRevenue > 0) totalRevenue = cdfs.totalRevenue
    if (!totalAssets && cdfs.totalAssets > 0) totalAssets = cdfs.totalAssets
    if (!totalEquity && cdfs.totalEquity > 0) totalEquity = cdfs.totalEquity
    if (!profitBeforeTax && cdfs.profitBeforeTax > 0) {
      profitBeforeTax = cdfs.profitBeforeTax
      actualProfitRaw = cdfs.profitBeforeTax
    }
  }

  // 4. Fallback từ NKC
  if (params.nkcItems && params.nkcItems.length > 0) {
    const nkc = calculateBenchmarkTotals(params.nkcItems)
    if (!totalRevenue && nkc.totalRevenue > 0) totalRevenue = nkc.totalRevenue
    if (!totalEquity && nkc.totalEquity > 0) totalEquity = nkc.totalEquity
    if (!totalAssets && nkc.totalAssets > 0) totalAssets = nkc.totalAssets
    if (!profitBeforeTax && nkc.profitBeforeTax > 0) profitBeforeTax = nkc.profitBeforeTax
  }

  return {
    totalRevenue,
    totalAssets,
    totalEquity,
    profitBeforeTax,
    actualProfitRaw,
    sourceType: params.sheetSources?.cdfs ? 'WORKBOOK_4_SHEETS' : 'NKC_ESTIMATE',
    detectedSheets: params.sheetSources,
  }
}

/**
 * Trích xuất chỉ tiêu Benchmark từ Bảng Cân đối phát sinh (CDFS)
 */
export function calculateBenchmarkFromCdfs(accounts: readonly CdfsRowInput[]): BenchmarkTotals {
  let rev511 = 0
  let red521 = 0
  let assetsSum = 0
  let contraAssets = 0
  let equity411 = 0
  let rev5xx7xx = 0
  let exp6xx8xx = 0

  for (const a of accounts) {
    const code = a.matk.trim()
    const psNo = a.psno ?? 0
    const psCo = a.psco ?? 0
    const noCK = a.nock ?? 0
    const coCK = a.cock ?? 0

    // 1. Doanh thu TK 511
    if (code.startsWith('511')) {
      rev511 += Math.max(psCo, psNo) // Bao gồm cả trường hợp đã kết chuyển sang 911
    }
    if (code.startsWith('521')) {
      red521 += psNo
    }

    // 2. Tổng tài sản
    if (/^[12]/.test(code)) {
      if (code.startsWith('214') || code.startsWith('229')) {
        contraAssets += coCK || psCo
      } else {
        assetsSum += noCK || (a.sdndk ?? 0)
      }
    }

    // 3. Vốn CSH TK 411, 412
    if (code.startsWith('411') || code.startsWith('412')) {
      equity411 += coCK || (a.sdcdk ?? 0)
    }

    // 4. LNTT
    if (code.startsWith('5') || code.startsWith('7')) {
      rev5xx7xx += Math.max(psCo, psNo)
    }
    if (code.startsWith('6') || code.startsWith('8')) {
      exp6xx8xx += Math.max(psNo, psCo)
    }
  }

  const netRev = Math.max(0, rev511 - red521)
  const netAssets = Math.max(0, assetsSum - contraAssets)
  const netProfit = rev5xx7xx - exp6xx8xx

  return {
    totalRevenue: netRev,
    totalAssets: netAssets,
    totalEquity: equity411,
    profitBeforeTax: Math.abs(netProfit),
    actualProfitRaw: netProfit,
    totalExpenses: exp6xx8xx,
    sourceType: 'CDFS',
  }
}

/**
 * Tính toán 4 chỉ tiêu Benchmark cơ sở từ Sổ Nhật ký chung (NKC)
 */
export function calculateBenchmarkTotals(items: readonly SampleableItem[]): BenchmarkTotals {
  let totalRevenue = 0
  let totalIncome = 0
  let totalExpenses = 0
  let totalAssets = 0
  let totalEquity = 0

  for (const item of items) {
    const amt = Math.abs(item.amount)
    const debit = item.debit.trim()
    const credit = item.credit.trim()

    // Bỏ qua bút toán kết chuyển 911
    if (debit.startsWith('911') || credit.startsWith('911')) continue

    // 1. Doanh thu bán hàng & thu nhập khác
    if (credit.startsWith('511')) {
      totalRevenue += amt
      totalIncome += amt
    } else if (debit.startsWith('511') || debit.startsWith('521')) {
      totalRevenue -= amt
      totalIncome -= amt
    } else if (credit.startsWith('515') || credit.startsWith('711')) {
      totalIncome += amt
    }

    // 2. Chi phí phát sinh
    if (debit.startsWith('6') || debit.startsWith('8')) {
      if (credit.startsWith('154')) {
        // Chi phí SXKD
      } else {
        totalExpenses += amt
      }
    }

    // 3. Vốn đầu tư CSH (TK 411/412 - chỉ ghi nhận nguồn vốn mới, không lấy 421)
    if (credit.startsWith('411') || credit.startsWith('412')) {
      if (!debit.startsWith('421') && !debit.startsWith('411')) {
        totalEquity += amt
      }
    }

    // 4. Tài sản phát sinh (TK loại 1, loại 2)
    if (debit.startsWith('1') || debit.startsWith('2')) {
      if (!credit.startsWith('1') && !credit.startsWith('2') && !debit.startsWith('214')) {
        totalAssets += amt
      }
    }
  }

  const pbt = Math.max(0, totalIncome - totalExpenses)

  return {
    totalRevenue: Math.max(0, totalRevenue),
    totalAssets: Math.max(0, totalAssets),
    totalEquity: Math.max(0, totalEquity),
    profitBeforeTax: pbt,
    actualProfitRaw: totalIncome - totalExpenses,
    totalExpenses,
    sourceType: 'NKC_ESTIMATE',
  }
}

/**
 * Tính toán Biểu mẫu A710 theo Benchmark đã chọn
 */
export function computeMateriality(
  benchmark: BenchmarkConfig,
  totals: BenchmarkTotals,
  manualOm?: number,
): ComputedMateriality {
  let baseName = ''
  let baseAmount = 0
  let lossWarning: string | undefined = undefined

  if (benchmark.base === 'REVENUE') {
    baseName = 'Doanh thu bán hàng và CCDV (TK 511 / Mã 01 KQKD)'
    baseAmount = totals.totalRevenue
  } else if (benchmark.base === 'TOTAL_ASSETS') {
    baseName = 'Tổng cộng Tài sản (Mã 270 CĐKT / Dư Nợ CĐSPS)'
    baseAmount = totals.totalAssets
  } else if (benchmark.base === 'PROFIT_BEFORE_TAX') {
    baseName = 'Lợi nhuận trước thuế (Mã 50 KQKD / CĐSPS)'
    baseAmount = totals.profitBeforeTax
    if (totals.actualProfitRaw != null && totals.actualProfitRaw < 0) {
      lossWarning = `Doanh nghiệp bị Lỗ thực tế (${totals.actualProfitRaw.toLocaleString('vi-VN')} đ). VSA 320 quy định lấy giá trị tuyệt đối hoặc chuyển sang tiêu chí Doanh thu / Vốn CSH.`
    }
  } else if (benchmark.base === 'EQUITY') {
    baseName = 'Vốn đầu tư của chủ sở hữu (TK 411/412 / Mã 411 CĐKT)'
    baseAmount = totals.totalEquity
  } else {
    baseName = 'Mức trọng yếu tùy chỉnh do KTV nhập'
    baseAmount = manualOm ?? 1_000_000_000
  }

  const adj = 0
  const adjustedBase = Math.max(0, baseAmount - adj)

  let om = manualOm && benchmark.base === 'MANUAL' ? manualOm : Math.round((adjustedBase * benchmark.percentage) / 100)
  if (om <= 0) om = 1_000_000

  const pm = Math.round(om * benchmark.pmRatio)
  const ctt = Math.round(om * benchmark.cttRatio)

  return {
    baseName,
    baseAmount,
    abnormalAdjustment: adj,
    adjustedBaseAmount: adjustedBase,
    percentage: benchmark.percentage,
    overallMateriality: om,
    pmRatio: benchmark.pmRatio,
    performanceMateriality: pm,
    cttRatio: benchmark.cttRatio,
    clearlyTrivial: ctt,
    lossWarning,
  }
}
