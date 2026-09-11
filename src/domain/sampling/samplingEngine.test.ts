import { describe, expect, it } from 'vitest'
import { calculateBenchmarkTotals, computeMateriality } from './materialityCalculator'
import { filterBySection } from './sectionFilter'
import { getRiskFactor, hasSpecificRisk, runSamplingEngine } from './samplingEngine'
import type { SampleableItem, SamplingConfig } from './types'

function makeItem(partial: Partial<SampleableItem>): SampleableItem {
  return {
    id: partial.id ?? '1',
    rowIndex: partial.rowIndex ?? 1,
    displayDate: partial.displayDate ?? '15/05/2025',
    voucher: partial.voucher ?? 'PT001',
    description: partial.description ?? 'Mua hang',
    debit: partial.debit ?? '152',
    credit: partial.credit ?? '112',
    amount: partial.amount ?? 10_000_000,
  }
}

describe('VSA 530 & VSA 320 Sampling Engine — Comprehensive Tests', () => {
  it('hệ số rủi ro R theo mức độ tin cậy chuẩn VSA 530', () => {
    expect(getRiskFactor(95)).toBe(3.0)
    expect(getRiskFactor(90)).toBe(2.3)
    expect(getRiskFactor(85)).toBe(1.9)
  })

  it('nhận diện dấu hiệu rủi ro đặc thù (tháng 12, tròn số lớn, từ khóa nhạy cảm)', () => {
    const ctt = 50_000_000
    // Tròn số 100tr
    expect(hasSpecificRisk(makeItem({ amount: 100_000_000, description: 'Mua hang' }), ctt)).toBe(true)
    // Tròn 50tr cũng bắt
    expect(hasSpecificRisk(makeItem({ amount: 150_000_000, description: 'Mua hang' }), ctt)).toBe(true)
    // Lệch 1 đồng thì thoát
    expect(hasSpecificRisk(makeItem({ amount: 100_000_001, description: 'Mua hang' }), ctt)).toBe(false)
    // Ngày 31/12
    expect(hasSpecificRisk(makeItem({ amount: 60_000_000, displayDate: '31/12/2025' }), ctt)).toBe(true)
    // Ngày 15/12 giữa tháng cũng bắt (cutoff tháng 12)
    expect(hasSpecificRisk(makeItem({ amount: 60_000_000, displayDate: '15/12/2025' }), ctt)).toBe(true)
    // Format ISO tháng 12
    expect(hasSpecificRisk(makeItem({ amount: 60_000_000, displayDate: '2025-12-05' }), ctt)).toBe(true)
    // Từ khóa điều chỉnh
    expect(hasSpecificRisk(makeItem({ amount: 70_000_000, description: 'Bút toán ĐIỀU CHỈNH chi phí' }), ctt)).toBe(true)
    // Dưới CTT -> false
    expect(hasSpecificRisk(makeItem({ amount: 10_000_000, description: 'ĐIỀU CHỈNH' }), ctt)).toBe(false)
  })

  it('tính toán Benchmark Materiality (VSA 320) theo Doanh thu, Tài sản, Vốn CSH (411/412), Lợi nhuận', () => {
    const items: SampleableItem[] = [
      makeItem({ debit: '131', credit: '5111', amount: 100_000_000_000 }), // Doanh thu 100 tỷ
      makeItem({ debit: '112', credit: '711', amount: 5_000_000_000 }), // Thu nhập 5 tỷ
      makeItem({ debit: '642', credit: '331', amount: 80_000_000_000 }), // Chi phí 80 tỷ
      makeItem({ debit: '112', credit: '4111', amount: 50_000_000_000 }), // Tăng vốn góp CSH 50 tỷ
      makeItem({ debit: '4211', credit: '4212', amount: 1_000_000_000 }), // Kết chuyển lỗ 421 (BỊ LOẠI TRỪ)
      makeItem({ debit: '911', credit: '511', amount: 100_000_000_000 }), // Kết chuyển 911 (phải bị bỏ qua)
    ]

    const totals = calculateBenchmarkTotals(items)
    expect(totals.totalRevenue).toBe(100_000_000_000) // 100 tỷ (Có 511)
    expect(totals.totalEquity).toBe(50_000_000_000) // 50 tỷ (Có 411, loại trừ 421)
    expect(totals.totalExpenses).toBe(80_000_000_000)
    expect(totals.profitBeforeTax).toBe(25_000_000_000) // 105 tỷ - 80 tỷ = 25 tỷ

    // 1% Doanh thu: OM = 1.000.000.000, PM (75%) = 750.000.000, CTT (4%) = 40.000.000
    const matRev = computeMateriality({ base: 'REVENUE', percentage: 1.0, pmRatio: 0.75, cttRatio: 0.04 }, totals)
    expect(matRev.overallMateriality).toBe(1_000_000_000)
    expect(matRev.performanceMateriality).toBe(750_000_000)
    expect(matRev.clearlyTrivial).toBe(40_000_000)

    // 2% Vốn CSH (411): OM = 1.000.000.000
    const matEquity = computeMateriality({ base: 'EQUITY', percentage: 2.0, pmRatio: 0.75, cttRatio: 0.04 }, totals)
    expect(matEquity.overallMateriality).toBe(1_000_000_000)
    expect(matEquity.baseAmount).toBe(50_000_000_000)

    // 5% Lợi nhuận trước thuế: OM = 1.250.000.000
    const matProfit = computeMateriality({ base: 'PROFIT_BEFORE_TAX', percentage: 5.0, pmRatio: 0.75, cttRatio: 0.04 }, totals)
    expect(matProfit.overallMateriality).toBe(1_250_000_000)
  })

  it('tính đúng PM 65% và CTT 3.5% khi người dùng thiết lập tỷ lệ lẻ (khớp số liệu ảnh thực tế)', () => {
    const totals = {
      totalRevenue: 54_366_422_054, // Doanh thu thực tế trong ảnh
      totalAssets: 50_000_000_000,
      totalEquity: 30_000_000_000,
      totalExpenses: 40_000_000_000,
      profitBeforeTax: 14_000_000_000,
    }
    // OM = 54.366.422.054 * 1.5% = 815.496.331 đ
    // PM (65%) = 815.496.331 * 65% = 530.072.615 đ
    // CTT (3.5%) = 815.496.331 * 3.5% = 28.542.372 đ
    const mat = computeMateriality(
      { base: 'REVENUE', percentage: 1.5, pmRatio: 0.65, cttRatio: 0.035 },
      totals
    )
    expect(mat.overallMateriality).toBe(815_496_331)
    expect(mat.performanceMateriality).toBe(530_072_615)
    expect(mat.clearlyTrivial).toBe(28_542_372)
  })

  it('cho phép nhập thủ công OM (MANUAL) và tự động tính lại PM, CTT chính xác', () => {
    const totals = {
      totalRevenue: 100_000_000_000,
      totalAssets: 50_000_000_000,
      totalEquity: 30_000_000_000,
      totalExpenses: 80_000_000_000,
      profitBeforeTax: 20_000_000_000,
    }
    const manualMat = computeMateriality(
      { base: 'MANUAL', percentage: 1.0, pmRatio: 0.75, cttRatio: 0.04 },
      totals,
      500_000_000, // Nhập tay OM = 500tr
    )
    expect(manualMat.overallMateriality).toBe(500_000_000)
    expect(manualMat.performanceMateriality).toBe(375_000_000) // 75% của 500tr
    expect(manualMat.clearlyTrivial).toBe(20_000_000) // 4% của 500tr
  })

  it('loại trừ triệt để các bút toán phân bổ khấu hao (214/242) và kết chuyển khỏi phần hành Hàng tồn kho & Doanh thu', () => {
    const items: SampleableItem[] = [
      makeItem({ id: '1', debit: '152', credit: '331', amount: 500_000_000, description: 'Mua nguyên vật liệu nhập kho từ nhà cung cấp' }), // Hợp lệ (Nợ 152 / Có 331)
      makeItem({ id: '2', debit: '154', credit: '2141', amount: 120_000_000, description: 'Trích khấu hao máy móc sản xuất' }), // Bị loại (Khấu hao Có 214)
      makeItem({ id: '3', debit: '154', credit: '242', amount: 45_000_000, description: 'Phân bổ chi phí trả trước CCDC' }), // Bị loại (Phân bổ Có 242)
      makeItem({ id: '4', debit: '152', credit: '911', amount: 80_000_000, description: 'Kết chuyển cuối kỳ' }), // Bị loại (Kết chuyển 911)
      makeItem({ id: '5', debit: '1561', credit: '1121', amount: 350_000_000, description: 'Nhập kho hàng hóa thanh toán chuyển khoản' }), // Hợp lệ (Nợ 156 / Có 112)
      makeItem({ id: '6', debit: '131', credit: '5111', amount: 800_000_000, description: 'Bán hàng ghi nhận doanh thu' }), // Doanh thu hợp lệ
      makeItem({ id: '7', debit: '911', credit: '5111', amount: 800_000_000, description: 'Kết chuyển doanh thu cuối kỳ' }), // Bị loại khỏi Doanh thu
    ]

    // 1. Lọc phần hành Hàng tồn kho: chỉ lấy ID 1 và 5
    const inv = filterBySection(items, 'INVENTORY', '', true)
    expect(inv.map((x) => x.id)).toEqual(['1', '5'])

    // 2. Lọc phần hành Doanh thu: chỉ lấy ID 6, loại trừ ID 7 (kết chuyển)
    const rev = filterBySection(items, 'REVENUE_511', '', true)
    expect(rev.map((x) => x.id)).toEqual(['6'])
  })

  it('chạy Sampling Engine toàn diện kết hợp Benchmark và lọc Phần hành', () => {
    const config: SamplingConfig = {
      overallMateriality: 1_000_000_000,
      performanceMateriality: 750_000_000,
      clearlyTrivial: 50_000_000,
      confidenceLevel: 95,
      method: 'MUS',
      benchmark: {
        base: 'MANUAL',
        percentage: 1.0,
        pmRatio: 0.75,
        cttRatio: 0.05,
      },
      section: 'REVENUE_511', // Chỉ chọn mẫu phần hành Doanh thu Có 511
      includeRiskItems: true,
      excludeKetChuyen: true,
      randomStart: 100_000_000,
    }

    const items: SampleableItem[] = [
      makeItem({ id: '1', voucher: 'HD001', debit: '131', credit: '511', amount: 900_000_000, description: 'Doanh thu lớn >= PM' }), // Tầng 1 (Doanh thu)
      makeItem({ id: '2', voucher: 'HD002', debit: '131', credit: '511', amount: 100_000_000, description: 'Doanh thu ĐIỀU CHỈNH' }), // Tầng 2 (Doanh thu - rủi ro)
      makeItem({ id: '3', voucher: 'HD003', debit: '131', credit: '511', amount: 325_450_000, description: 'Doanh thu thường A' }), // Tầng 3 (Doanh thu - MUS)
      makeItem({ id: '4', voucher: 'HD004', debit: '152', credit: '331', amount: 800_000_000, description: 'Mua hàng tồn kho (Không thuộc doanh thu)' }), // Bị lọc ra
    ]
    const res = runSamplingEngine(items, config)

    // Tổng thể ban đầu 4 dòng, nhưng sau lọc phần hành Phải thu chỉ còn 3 dòng
    expect(res.summary.populationCount).toBe(4)
    expect(res.summary.sectionFilteredCount).toBe(3)

    // Kiểm tra danh sách mẫu chọn: chỉ chứa các khoản mục của Phải thu
    expect(res.selectedSamples.length).toBeGreaterThanOrEqual(2)
    const selectedIds = res.selectedSamples.map((s) => s.id)
    expect(selectedIds).toContain('1')
    expect(selectedIds).toContain('2')
    expect(selectedIds).not.toContain('4') // ID 4 không thuộc Phải thu
  })

  it('loại trừ triệt để bút toán kết chuyển NVK có TK Nợ là Kết chuyển (khớp trường hợp thực tế NVK0137)', () => {
    const items: SampleableItem[] = [
      makeItem({ id: '1', voucher: 'HD001', debit: '131', credit: '5111', amount: 50_000_000, description: 'Doanh thu bán hàng' }),
      makeItem({ id: '2', voucher: 'NVK0137', debit: 'Kết chuyển DT', credit: '5112', amount: 911, description: '"' }),
      makeItem({ id: '3', voucher: 'NVK0138', debit: '5111', credit: '911', amount: 500_000_000, description: 'Kết chuyển doanh thu xác định KQKD' }),
    ]

    const filtered = filterBySection(items, 'REVENUE_511', undefined, true)
    expect(filtered.length).toBe(1)
    expect(filtered[0]?.voucher).toBe('HD001')
    expect(filtered.find((x) => x.voucher === 'NVK0137')).toBeUndefined()
    expect(filtered.find((x) => x.voucher === 'NVK0138')).toBeUndefined()
  })
})
