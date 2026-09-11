import { calculateBenchmarkTotals, computeMateriality } from './materialityCalculator'
import { filterBySection } from './sectionFilter'
import { groupItemsByVoucher } from './groupVouchers'
import type {
  SampleableItem,
  SamplingConfig,
  SamplingResult,
  SamplingSummary,
  SelectedSampleItem,
  StratumSummary,
} from './types'

/** Hệ số rủi ro kiểm toán R theo VSA 530 (Phụ lục 2 & bảng Poisson không sai sót dự tính) */
export function getRiskFactor(confidenceLevel: 85 | 90 | 95): number {
  switch (confidenceLevel) {
    case 95:
      return 3.0 // Rủi ro phát hiện 5%
    case 90:
      return 2.3 // Rủi ro phát hiện 10%
    case 85:
      return 1.9 // Rủi ro phát hiện 15%
    default:
      return 3.0
  }
}

const SENSITIVE_KEYWORDS = [
  'ĐIỀU CHỈNH',
  'DIEU CHINH',
  'PHÂN BỔ',
  'PHAN BO',
  'TRÍCH TRƯỚC',
  'TRICH TRUOC',
  'TẤT TOÁN',
  'TAT TOAN',
  'DỰ PHÒNG',
  'DU PHONG',
  'ĐÁNH GIÁ LẠI',
  'DANH GIA LAI',
  'NGOẠI BẢNG',
  'NGOAI BANG',
]

export interface RiskCheckResult {
  isRisk: boolean
  note: string
}

/** Kiểm tra dấu hiệu rủi ro đặc thù của chứng từ */
export function checkSpecificRisk(item: SampleableItem, ctt: number): RiskCheckResult {
  const absAmt = Math.abs(item.amount)
  if (absAmt < ctt) return { isRisk: false, note: '' }

  // 1. Dấu hiệu hạch toán ngược / giảm trừ Doanh thu (Nợ 511, Nợ 521, ghi âm 511)
  if (item.debit.startsWith('511') || item.debit.startsWith('521') || (item.credit.startsWith('511') && item.amount < 0)) {
    return { isRisk: true, note: 'Hạch toán ngược / Giảm trừ Doanh thu (Nợ 511/521/Ghi âm)' }
  }

  // 2. Dấu hiệu xuất trả hàng người bán / giảm giá hàng mua (Có 15x / Nợ 331, 111, 112)
  if (item.credit.startsWith('15') && (item.debit.startsWith('331') || item.debit.startsWith('111') || item.debit.startsWith('112'))) {
    return { isRisk: true, note: 'Xuất trả hàng người bán / Giảm tồn kho (Có 15x / Nợ 331)' }
  }

  // 3. Bút toán số tiền âm (Bút toán đảo / điều chỉnh giảm)
  if (item.amount < 0) {
    return { isRisk: true, note: 'Bút toán ghi âm (Điều chỉnh giảm / Đảo số)' }
  }

  const desc = item.description.toUpperCase()
  for (const kw of SENSITIVE_KEYWORDS) {
    if (desc.includes(kw)) {
      return { isRisk: true, note: `Từ khóa nhạy cảm (${kw})` }
    }
  }

  // 4. Giao dịch trong tháng khóa sổ (mọi ngày tháng 12, mọi format dd/MM, ISO)
  if (item.displayDate.includes('/12/') || item.displayDate.includes('-12-')) {
    return { isRisk: true, note: 'Giao dịch tháng khóa sổ (Cutoff tháng 12)' }
  }

  // 5. Tròn số lớn (từ 50 triệu trở lên và chia hết cho 50 triệu)
  if (absAmt >= 50_000_000 && absAmt % 50_000_000 === 0) {
    return { isRisk: true, note: 'Giá trị tròn số lớn (chia hết 50tr)' }
  }

  return { isRisk: false, note: '' }
}

export function hasSpecificRisk(item: SampleableItem, ctt: number): boolean {
  return checkSpecificRisk(item, ctt).isRisk
}

function makeStratumSummary(name: string, all: SampleableItem[], selected: SelectedSampleItem[]): StratumSummary {
  const totalAmount = all.reduce((s, x) => s + Math.abs(x.amount), 0)
  const selectedAmount = selected.reduce((s, x) => s + Math.abs(x.amount), 0)
  const coverageRatio = totalAmount > 0 ? (selectedAmount / totalAmount) * 100 : 0

  return {
    name,
    itemCount: all.length,
    totalAmount,
    selectedCount: selected.length,
    selectedAmount,
    coverageRatio,
  }
}

/**
 * THUẬT TOÁN CHỌN MẪU KIỂM TOÁN VSA 530 & VSA 320
 * Hỗ trợ:
 * 1. Tính mức trọng yếu tự động theo Benchmark A710 (Doanh thu 511, Tài sản, Vốn CSH, Lợi nhuận)
 * 2. Lọc tổng thể theo từng Phần hành kiểm toán (Doanh thu 511, Kho 15x, Tiền, Phải thu, Phải trả...)
 * 3. Gom nhóm theo Số chứng từ / Hóa đơn (tránh xé nhỏ hóa đơn lớn)
 * 4. Phân tầng 4 nhóm (Trọng yếu PM, Rủi ro đặc thù, Mẫu bước nhảy MUS, Bỏ qua CTT)
 */
export function runSamplingEngine(
  allItems: readonly SampleableItem[],
  config: SamplingConfig,
): SamplingResult {
  // 1. Tính toán Benchmark Materiality
  const benchmarkTotals = calculateBenchmarkTotals(allItems)
  const computedMat = computeMateriality(config.benchmark, benchmarkTotals, config.overallMateriality)

  const om = config.benchmark.base === 'MANUAL' ? config.overallMateriality : computedMat.overallMateriality
  const pm = config.benchmark.base === 'MANUAL' ? config.performanceMateriality : computedMat.performanceMateriality
  const ctt = config.benchmark.base === 'MANUAL' ? config.clearlyTrivial : computedMat.clearlyTrivial

  // 2. Lọc tổng thể theo phần hành kiểm toán
  const sectionFiltered = filterBySection(
    allItems,
    config.section,
    config.customAccountPrefix,
    config.excludeKetChuyen,
  )

  // 3. Gom nhóm theo Số chứng từ / Hóa đơn nếu được bật (mặc định true)
  const filteredItems = config.groupByVoucher !== false ? groupItemsByVoucher(sectionFiltered) : sectionFiltered

  const r = getRiskFactor(config.confidenceLevel)
  const targetTotal = config.targetSampleSize && config.targetSampleSize > 0 ? config.targetSampleSize : 25

  // 4. Phân tầng tổng thể trên tập dữ liệu đã lọc & gom nhóm
  const keyItemsAll: SampleableItem[] = []
  const riskItemsAll: SampleableItem[] = []
  const repPopulationAll: SampleableItem[] = []
  const trivialAll: SampleableItem[] = []

  const selectedSamples: SelectedSampleItem[] = []
  let sampleNoCounter = 1

  // Ngưỡng phát hiện khoản mục lớn (tối thiểu PM hoặc 10% tổng thể)
  const effectivePm = Math.min(pm, Math.max(ctt * 2, Math.round(filteredItems.reduce((s, x) => s + Math.abs(x.amount), 0) / Math.max(1, targetTotal * 2))))

  for (const it of filteredItems) {
    const absAmt = Math.abs(it.amount)
    if (absAmt >= effectivePm) {
      keyItemsAll.push(it)
      selectedSamples.push({
        ...it,
        sampleNo: sampleNoCounter++,
        reason: 'HIGH_VALUE',
        stratum: 'KEY_ITEMS',
        riskNote: `Khoản mục lớn >= PM (${formatAmount(effectivePm)}) [Kiểm tra 100%]`,
      })
    } else {
      const riskCheck = config.includeRiskItems ? checkSpecificRisk(it, ctt) : { isRisk: false, note: '' }
      if (riskCheck.isRisk) {
        riskItemsAll.push(it)
        selectedSamples.push({
          ...it,
          sampleNo: sampleNoCounter++,
          reason: 'SPECIFIC_RISK',
          stratum: 'RISK_ITEMS',
          riskNote: riskCheck.note,
        })
      } else if (absAmt >= ctt) {
        repPopulationAll.push(it)
      } else {
        trivialAll.push(it)
      }
    }
  }

  // 5. Lấy mẫu bước nhảy MUS trên Tầng 3
  const selectedRep: SelectedSampleItem[] = []
  const neededRepCount = Math.max(1, targetTotal - selectedSamples.length)
  const repTotalAmount = repPopulationAll.reduce((s, x) => s + Math.abs(x.amount), 0)
  const samplingInterval = repTotalAmount > 0 ? Math.max(1, Math.round(repTotalAmount / neededRepCount)) : Math.max(1, Math.round(effectivePm / r))

  if (repPopulationAll.length <= neededRepCount) {
    for (const it of repPopulationAll) {
      const item: SelectedSampleItem = {
        ...it,
        sampleNo: sampleNoCounter++,
        reason: 'MUS_SAMPLE',
        stratum: 'REPRESENTATIVE_SAMPLE',
        samplingInterval,
        riskNote: 'Mẫu kiểm tra đại diện',
      }
      selectedRep.push(item)
      selectedSamples.push(item)
    }
  } else if (config.method === 'MUS' && repPopulationAll.length > 0) {
    const randomStart = config.randomStart ?? Math.max(1, Math.floor(samplingInterval / 2))
    let cumulative = 0
    let nextThreshold = randomStart

    for (const it of repPopulationAll) {
      const amt = Math.abs(it.amount)
      cumulative += amt
      if (cumulative >= nextThreshold && selectedRep.length < neededRepCount) {
        const item: SelectedSampleItem = {
          ...it,
          sampleNo: sampleNoCounter++,
          reason: 'MUS_SAMPLE',
          stratum: 'REPRESENTATIVE_SAMPLE',
          samplingInterval,
          cumulativeAmount: cumulative,
          riskNote: `Bước nhảy MUS (${formatAmount(samplingInterval)})`,
        }
        selectedRep.push(item)
        selectedSamples.push(item)
        while (nextThreshold <= cumulative) {
          nextThreshold += samplingInterval
        }
      }
    }

    if (selectedRep.length < neededRepCount) {
      for (const it of repPopulationAll) {
        if (!selectedRep.some((x) => x.id === it.id)) {
          const item: SelectedSampleItem = {
            ...it,
            sampleNo: sampleNoCounter++,
            reason: 'MUS_SAMPLE',
            stratum: 'REPRESENTATIVE_SAMPLE',
            samplingInterval,
            riskNote: 'Mẫu phân bổ bổ sung',
          }
          selectedRep.push(item)
          selectedSamples.push(item)
          if (selectedRep.length >= neededRepCount) break
        }
      }
    }
  } else if (repPopulationAll.length > 0) {
    const step = Math.max(1, Math.floor(repPopulationAll.length / neededRepCount))
    for (let i = 0; i < repPopulationAll.length && selectedRep.length < neededRepCount; i += step) {
      const it = repPopulationAll[i]!
      const item: SelectedSampleItem = {
        ...it,
        sampleNo: sampleNoCounter++,
        reason: 'RANDOM_SAMPLE',
        stratum: 'REPRESENTATIVE_SAMPLE',
        riskNote: 'Mẫu ngẫu nhiên đại diện',
      }
      selectedRep.push(item)
      selectedSamples.push(item)
    }
  }

  // 6. Tổng kết & Đánh giá % bao phủ
  const keyItemsSelected = selectedSamples.filter((s) => s.stratum === 'KEY_ITEMS')
  const riskItemsSelected = selectedSamples.filter((s) => s.stratum === 'RISK_ITEMS')

  const strata = {
    keyItems: makeStratumSummary('Tầng 1: Khoản mục trọng yếu (>= PM - Kiểm tra 100%)', keyItemsAll, keyItemsSelected),
    riskItems: makeStratumSummary('Tầng 2: Khoản mục có rủi ro đặc thù', riskItemsAll, riskItemsSelected),
    representative: makeStratumSummary('Tầng 3: Mẫu đại diện (MUS / Phân bổ đều)', repPopulationAll, selectedRep),
    trivial: makeStratumSummary('Tầng 4: Khoản mục dưới ngưỡng bỏ qua (< CTT)', trivialAll, []),
  }

  const populationTotalAmount = allItems.reduce((s, x) => s + Math.abs(x.amount), 0)
  const sectionFilteredAmount = filteredItems.reduce((s, x) => s + Math.abs(x.amount), 0)
  const totalSelectedAmount = selectedSamples.reduce((s, x) => s + Math.abs(x.amount), 0)
  const totalCoveragePercent = sectionFilteredAmount > 0 ? (totalSelectedAmount / sectionFilteredAmount) * 100 : 0

  const summary: SamplingSummary = {
    populationCount: allItems.length,
    populationTotalAmount,
    sectionFilteredCount: filteredItems.length,
    sectionFilteredAmount,
    totalSelectedCount: selectedSamples.length,
    totalSelectedAmount,
    totalCoveragePercent,
    samplingInterval,
    riskFactor: r,
    isVoucherGrouped: config.groupByVoucher !== false,
    benchmarkUsed: {
      baseName: computedMat.baseName,
      baseAmount: computedMat.baseAmount,
      adjustedBaseAmount: computedMat.adjustedBaseAmount,
      percentage: computedMat.percentage,
      computedOM: om,
      computedPM: pm,
      computedCTT: ctt,
    },
    strata,
  }

  return {
    config: {
      ...config,
      overallMateriality: om,
      performanceMateriality: effectivePm,
      clearlyTrivial: ctt,
    },
    summary,
    selectedSamples,
    allPopulationItems: [...allItems],
    filteredPopulationItems: [...filteredItems],
  }
}

function formatAmount(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)} tỷ`
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)} tr`
  return `${v.toLocaleString('vi-VN')} đ`
}
