import type { VatDeclarationSnapshot } from '../../shared/types/taxAnalytics'

export interface EngagementInfo {
  clientName: string
  fiscalYearEnd: string // e.g. '31/12/2026' or '2026-12-31'
  auditPeriod1?: string // e.g. '01/01 - 30/06/2026'
  auditPeriod2?: string // e.g. '01/07 - 31/12/2026'
  auditorName: string // e.g. 'Đắc Thịnh'
  auditDate?: string // e.g. '15/01/2026'
  reviewerName1?: string
  reviewerName2?: string
  auditFirmName?: string // e.g. 'Công ty TNHH Kiểm toán BẮC ĐẨU'
}

export interface CdfsAccountRow {
  matk: string
  tentk: string
  sdndk: number
  sdcdk: number
  psno: number
  psco: number
  nock: number
  cock: number
}

export interface NkcTransaction {
  rowNum: number
  dateStr: string
  dateVal: string | number | Date | null
  docNo: string
  desc: string
  debit: string
  credit: string
  amount: number
  exchangeRate?: number
  usdAmount?: number
  custId?: string
  month: number
}

export interface AdjustingEntry {
  stt: number
  glvRef: string
  noiDung: string
  tkNo: string
  tkCo: string
  soTien: number
  chiTieuCdkt?: string
  chiTieuKqkd?: string
}

export interface WorkingPaperFillContext {
  engagement: EngagementInfo
  cdfsAccounts: Map<string, CdfsAccountRow>
  nkcTransactions: NkcTransaction[]
  vatDeclarations?: VatDeclarationSnapshot[]
  adjustingEntries?: AdjustingEntry[]
  interimBalances?: unknown
  materiality?: {
    om: number
    pm: number
    ctt: number
  }
}

export interface SectionFillResult {
  fileName: string
  success: boolean
  sheetsUpdated: string[]
  itemsFilledCount: number
  error?: string
}
