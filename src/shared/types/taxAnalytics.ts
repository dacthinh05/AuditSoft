export type TaxPeriodType = 'MONTH' | 'QUARTER' | 'YEAR' | 'UNKNOWN'
export type TaxDeclarationType = 'ORIGINAL' | 'SUPPLEMENTAL' | 'UNKNOWN'

export interface VatIndicatorItem {
  code: string // "22", "23", "24", "25", "26", "27", "28", "29", "34", "35", "40", "43"...
  name: string
  rawValue: string
  numericValue: bigint
}

export interface VatDeclarationSnapshot {
  taxpayerId: string
  taxpayerName: string
  formCode: string // "01/GTGT"
  period: {
    type: TaxPeriodType
    value: string // "01/2025", "Q1/2025", "2025"
    normalizedKey: string // "2025-M01", "2025-Q1", "2025-YEAR"
    year: number
    quarter?: number
    month?: number
  }
  declarationType: TaxDeclarationType
  supplementalNo?: number
  submittedAt?: string
  indicators: Record<string, VatIndicatorItem>
  sourceFile?: string
}

export interface PitDeclarationSnapshot {
  taxpayerId: string
  taxpayerName: string
  formCode: string // "05/KK-TNCN" | "05/QTT-TNCN"
  period: {
    type: TaxPeriodType
    value: string
    normalizedKey: string
    year: number
    quarter?: number
    month?: number
  }
  declarationType: TaxDeclarationType
  supplementalNo?: number
  isFinalization: boolean // true nếu là 05/QTT-TNCN
  submittedAt?: string
  sourceFile?: string

  ct16_tongSoNguoiLaoDong: bigint
  ct21_tongThuNhapChiuThue: bigint
  ct26_tongThuNhapChiuThueKhauTru: bigint
  ct29_tongThueTncnDaKhauTru: bigint
  ct28_thueKhauTruCuTru?: bigint
  ct29_thueKhauTruKhongCuTru?: bigint

  // Chỉ tiêu bổ sung tờ khai Quyết toán năm 05/QTT-TNCN
  ct31_qtt_tongThueDaKhauTruTrongNam?: bigint
  ct40_qtt_tongThuePhaiNopTrongNam?: bigint
  ct41_qtt_tongThueNopThua?: bigint
}

export interface IngestedTaxDeclarations {
  vatDeclarations: VatDeclarationSnapshot[]
  pitDeclarations: PitDeclarationSnapshot[]
  totalFilesProcessed: number
  failedFiles: { path: string; error: string }[]
}
