import type { SampleableItem } from './types'
import { checkSpecificRisk } from './samplingEngine'

export type AssuranceLevel = 'HIGH' | 'MEDIUM' | 'LOW'

export interface AuditSamplingWpInput {
  sectionName: string // e.g. 'Doanh thu', 'Phải thu khách hàng', 'Chi phí'
  accountCode: string // e.g. '511', '131', '642'
  periodStr: string // e.g. '01/01 - 31/12/2025'
  items: readonly SampleableItem[]
  performanceMateriality: number // PM cơ sở (A710)
  itemMaterialityRatio?: number // Tỷ lệ % PM khoản mục vs tổng thể (Mặc định 75% hoặc 50%)
  assuranceLevel?: AssuranceLevel // Mức độ đảm bảo mong muốn ('HIGH': 0.75, 'MEDIUM': 0.50, 'LOW': 0.25)
  riskFactorOverride?: number // Cho phép KTV nhập trực tiếp hệ số rủi ro
  clearlyTrivial?: number
}

export interface WpSamplingStepRow {
  stepIndex: string
  label: string
  valueDisplay: string
  numericValue: number
  formulaStr?: string
  note?: string
}

export interface SelectedWpSample extends SampleableItem {
  stt: number
  category: 'KCM_HIGH_VALUE' | 'SPECIFIC_RISK' | 'STEP_JUMP'
  categoryLabel: string
  riskNote: string
}

export interface AuditSamplingWpResult {
  sectionName: string
  accountCode: string
  periodStr: string
  purposeText: string
  populationUnitText: string
  methodType: string
  assuranceText: string
  riskFactor: number
  pmDetailed: number
  pmItemRatio: number
  pmItem: number
  kcm: number // Khoảng cách mẫu

  // 10 dòng bảng tính cỡ mẫu chuẩn VACPA / Big 4
  steps: {
    totalAmount: WpSamplingStepRow // Dòng 1: Giá trị tổng thể
    pmDetailed: WpSamplingStepRow // Dòng 2: Mức trọng yếu thực hiện chi tiết (A710)
    pmRatio: WpSamplingStepRow // Dòng 2.1: Tỷ lệ %
    pmItem: WpSamplingStepRow // Dòng 2.2: Mức trọng yếu khoản mục
    riskFactor: WpSamplingStepRow // Dòng 3: Mức độ đảm bảo
    kcm: WpSamplingStepRow // Dòng 4: Khoảng cách mẫu
    highValueItems: WpSamplingStepRow // Dòng 5: Giá trị > KCM
    highValueCount: WpSamplingStepRow // Dòng 5 count
    riskItems: WpSamplingStepRow // Dòng 6: Giá trị phần tử đặc biệt
    riskCount: WpSamplingStepRow // Dòng 6 count
    remainingSampleSize: WpSamplingStepRow // Dòng 7: Cỡ mẫu còn lại
    totalSampleSize: WpSamplingStepRow // Dòng 8: Tổng mẫu chọn
    remainingTxCount: WpSamplingStepRow // Dòng 9: Số nghiệp vụ còn lại
    stepJump: WpSamplingStepRow // Dòng 10: Bước nhảy
  }

  // Danh sách các mẫu được chọn thực tế
  samples: SelectedWpSample[]
  highValueSamples: SelectedWpSample[]
  riskSamples: SelectedWpSample[]
  stepJumpSamples: SelectedWpSample[]

  summary: {
    populationCount: number
    populationAmount: number
    selectedCount: number
    selectedAmount: number
    coveragePercent: number
  }
}

/**
 * THUẬT TOÁN QUY TRÌNH CHỌN MẪU KIỂM TOÁN CHUẨN MẪU BIỂU GLV (A810 / G191.chonmau)
 * Tái hiện chính xác 10 bước tính toán cỡ mẫu & bước nhảy của công ty kiểm toán.
 */
export function calculateAuditSamplingWp(input: AuditSamplingWpInput): AuditSamplingWpResult {
  const {
    sectionName,
    accountCode,
    periodStr,
    items,
    performanceMateriality,
    itemMaterialityRatio = 0.75,
    assuranceLevel = 'HIGH',
    riskFactorOverride,
    clearlyTrivial = 50_000_000,
  } = input

  // 1. Xác định hệ số rủi ro
  let riskFactor = 0.75
  let assuranceText = 'Cao'
  if (riskFactorOverride !== undefined && riskFactorOverride > 0) {
    riskFactor = riskFactorOverride
    assuranceText = riskFactor >= 0.75 ? 'Cao' : riskFactor >= 0.5 ? 'Trung bình' : 'Thấp'
  } else {
    switch (assuranceLevel) {
      case 'HIGH':
        riskFactor = 0.75
        assuranceText = 'Cao'
        break
      case 'MEDIUM':
        riskFactor = 0.5
        assuranceText = 'Trung bình'
        break
      case 'LOW':
        riskFactor = 0.25
        assuranceText = 'Thấp'
        break
    }
  }

  // 2. Tính mức trọng yếu & khoảng cách mẫu (KCM)
  const pmDetailed = performanceMateriality
  const pmItemRatio = itemMaterialityRatio
  const pmItem = Math.round(pmDetailed * pmItemRatio)
  const kcm = Math.max(1, Math.round(pmItem / riskFactor))

  // 3. Phân loại các phần tử
  const populationAmount = items.reduce((s, it) => s + Math.abs(it.amount), 0)
  const highValueItems: SampleableItem[] = []
  const riskItems: SampleableItem[] = []
  const remainingItems: SampleableItem[] = []

  for (const it of items) {
    const amt = Math.abs(it.amount)
    if (amt >= kcm) {
      highValueItems.push(it)
    } else {
      const riskCheck = checkSpecificRisk(it, clearlyTrivial)
      if (riskCheck.isRisk) {
        riskItems.push(it)
      } else {
        remainingItems.push(it)
      }
    }
  }

  const highValAmount = highValueItems.reduce((s, it) => s + Math.abs(it.amount), 0)
  const riskAmount = riskItems.reduce((s, it) => s + Math.abs(it.amount), 0)
  const remainingAmount = Math.max(0, populationAmount - highValAmount - riskAmount)

  // 4. Tính cỡ mẫu còn lại & bước nhảy
  // Dòng 7: Cỡ mẫu còn lại = (Tổng thể - 5 - 6) / KCM
  const remainingSampleSize = Math.max(0, Math.round(remainingAmount / kcm))
  const highValCount = highValueItems.length
  const riskCount = riskItems.length
  const totalSampleSize = highValCount + riskCount + remainingSampleSize
  const remainingTxCount = Math.max(0, items.length - highValCount - riskCount)

  // Dòng 10: Bước nhảy = Số nghiệp vụ còn lại / Cỡ mẫu còn lại
  const stepJump = remainingSampleSize > 0 ? Math.max(1, Math.round(remainingTxCount / remainingSampleSize)) : 0

  // 5. Chọn mẫu bước nhảy từ danh sách còn lại
  const stepJumpItems: SampleableItem[] = []
  if (stepJump > 0 && remainingItems.length > 0) {
    const startIdx = Math.max(0, Math.floor(stepJump / 2))
    for (let i = startIdx; i < remainingItems.length && stepJumpItems.length < remainingSampleSize; i += stepJump) {
      const it = remainingItems[i]
      if (it) stepJumpItems.push(it)
    }
    // Nếu chưa đủ do bước nhảy làm tròn, lấy thêm cho đủ cỡ mẫu
    if (stepJumpItems.length < remainingSampleSize) {
      for (const it of remainingItems) {
        if (!stepJumpItems.includes(it)) {
          stepJumpItems.push(it)
          if (stepJumpItems.length >= remainingSampleSize) break
        }
      }
    }
  }

  // 6. Đóng gói danh sách mẫu chọn kèm phân loại
  const samples: SelectedWpSample[] = []
  let sttCounter = 1

  const highValueSamples: SelectedWpSample[] = highValueItems.map((it) => ({
    ...it,
    stt: sttCounter++,
    category: 'KCM_HIGH_VALUE',
    categoryLabel: 'Lớn hơn KCM (Kiểm tra 100%)',
    riskNote: `Phát sinh (${it.amount.toLocaleString('vi-VN')} đ) >= KCM (${kcm.toLocaleString('vi-VN')} đ)`,
  }))
  samples.push(...highValueSamples)

  const riskSamples: SelectedWpSample[] = riskItems.map((it) => ({
    ...it,
    stt: sttCounter++,
    category: 'SPECIFIC_RISK',
    categoryLabel: 'Phần tử đặc biệt / Rủi ro',
    riskNote: checkSpecificRisk(it, clearlyTrivial).note || 'Phần tử có rủi ro đặc thù',
  }))
  samples.push(...riskSamples)

  const stepJumpSamples: SelectedWpSample[] = stepJumpItems.map((it) => ({
    ...it,
    stt: sttCounter++,
    category: 'STEP_JUMP',
    categoryLabel: 'Mẫu theo Bước nhảy',
    riskNote: `Bước nhảy ${stepJump} nghiệp vụ`,
  }))
  samples.push(...stepJumpSamples)
  const selectedAmount = samples.reduce((s, it) => s + Math.abs(it.amount), 0)
  const coveragePercent = populationAmount > 0 ? (selectedAmount / populationAmount) * 100 : 0

  // 7. Cấu trúc 10 dòng bảng tính chuẩn GLV
  const steps = {
    totalAmount: {
      stepIndex: '1',
      label: '1 - Giá trị tổng thể lấy mẫu:',
      valueDisplay: populationAmount.toLocaleString('vi-VN'),
      numericValue: populationAmount,
      note: '= Tổng giá trị phát sinh của phần hành.',
    },
    pmDetailed: {
      stepIndex: '2',
      label: '2 - Mức trọng yếu thực hiện chi tiết: (A710)',
      valueDisplay: pmDetailed.toLocaleString('vi-VN'),
      numericValue: pmDetailed,
      note: '= Mức trọng yếu thực hiện tổng thể.',
    },
    pmRatio: {
      stepIndex: '2.1',
      label: '2.1 - Tỷ lệ % mức trọng yếu khoản mục so với tổng thể',
      valueDisplay: `${(pmItemRatio * 100).toFixed(0)}%`,
      numericValue: pmItemRatio,
      note: 'Mặc định 75% hoặc 50% theo VSA 320.',
    },
    pmItem: {
      stepIndex: '2.2',
      label: '2.2 - Mức trọng yếu thực hiện khoản mục',
      valueDisplay: pmItem.toLocaleString('vi-VN'),
      numericValue: pmItem,
      formulaStr: '= 2 * 2.1',
      note: '= Dòng 2 * Dòng 2.1',
    },
    riskFactor: {
      stepIndex: '3',
      label: '3 - Mức độ đảm bảo yêu cầu',
      valueDisplay: riskFactor.toFixed(2).replace('.', ','),
      numericValue: riskFactor,
      note: 'Cao ~ 0.75, Trung bình ~ 0.50, Thấp ~ 0.25.',
    },
    kcm: {
      stepIndex: '4',
      label: '4 - Khoảng cách mẫu: (=2.2/3)',
      valueDisplay: kcm.toLocaleString('vi-VN'),
      numericValue: kcm,
      formulaStr: '= 2.2 / 3',
      note: '= Dòng 2.2 / Dòng 3',
    },
    highValueItems: {
      stepIndex: '5',
      label: '5 - Giá trị phần tử lớn hơn KCM (1)',
      valueDisplay: highValAmount.toLocaleString('vi-VN'),
      numericValue: highValAmount,
      note: '= Tổng giá trị các nghiệp vụ có số PS >= KCM.',
    },
    highValueCount: {
      stepIndex: '5.1',
      label: '    Số lượng mẫu',
      valueDisplay: `${highValCount} mẫu`,
      numericValue: highValCount,
      note: '= Số lượng nghiệp vụ >= KCM.',
    },
    riskItems: {
      stepIndex: '6',
      label: '6 - Giá trị phần tử đặc biệt (2)',
      valueDisplay: riskAmount.toLocaleString('vi-VN'),
      numericValue: riskAmount,
      note: '= Phần tử đặc biệt / Rủi ro chọn kiểm tra 100%.',
    },
    riskCount: {
      stepIndex: '6.1',
      label: '    Số lượng mẫu',
      valueDisplay: `${riskCount} mẫu`,
      numericValue: riskCount,
      note: '= Số lượng nghiệp vụ đặc biệt.',
    },
    remainingSampleSize: {
      stepIndex: '7',
      label: '7 - Cỡ mẫu còn lại',
      valueDisplay: `${remainingSampleSize} mẫu`,
      numericValue: remainingSampleSize,
      formulaStr: '= ROUND((1 - 5 - 6) / 4, 0)',
      note: '= (Tổng thể - 5 - 6) / KCM.',
    },
    totalSampleSize: {
      stepIndex: '8',
      label: '8 - Tổng mẫu chọn',
      valueDisplay: `${totalSampleSize} mẫu`,
      numericValue: totalSampleSize,
      formulaStr: '= 5.1 + 6.1 + 7',
      note: '= Số lượng (5) + Số lượng (6) + Cỡ mẫu (7).',
    },
    remainingTxCount: {
      stepIndex: '9',
      label: '9 - Số nghiệp vụ còn lại {sau khi trừ (1) và (2)}',
      valueDisplay: `${remainingTxCount} dòng`,
      numericValue: remainingTxCount,
      note: '= Tổng số dòng - Số dòng (5) - Số dòng (6).',
    },
    stepJump: {
      stepIndex: '10',
      label: '10 - Bước nhảy',
      valueDisplay: `${stepJump}`,
      numericValue: stepJump,
      formulaStr: '= ROUND(9 / 7, 0)',
      note: '= Số nghiệp vụ còn lại (9) / Cỡ mẫu còn lại (7).',
    },
  }

  return {
    sectionName,
    accountCode,
    periodStr,
    purposeText: `Đảm bảo tính có thật và chính xác của ${sectionName.toLowerCase()} ghi nhận trong kỳ`,
    populationUnitText: `${sectionName} trong kỳ`,
    methodType: 'Phi thống kê',
    assuranceText,
    riskFactor,
    pmDetailed,
    pmItemRatio,
    pmItem,
    kcm,
    steps,
    samples,
    highValueSamples,
    riskSamples,
    stepJumpSamples,
    summary: {
      populationCount: items.length,
      populationAmount,
      selectedCount: samples.length,
      selectedAmount,
      coveragePercent,
    },
  }
}
