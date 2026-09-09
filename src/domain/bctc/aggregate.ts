import type { DiffRow } from '../types'
import { CHI_TIEU_CDKT_CHUAN, CHI_TIEU_KQKD_CHUAN } from './catalog'
import { computeRow, extractTk3, suggestWorkingPaper, type RowImpacts } from './classify'
import { generateWorkingPaperLines, type WorkingPaperLine } from './workingPaper'

export interface GomNhomCdktRow {
  chiTieu: string
  tsTang: number
  tsGiam: number
  nvTang: number
  nvGiam: number
}

export interface GomNhomKqkdRow {
  chiTieu: string
  tang: number
  giam: number
}

export interface BctcRow {
  maSo: string
  chiTieu: string
  tsTang?: number
  tsGiam?: number
  nvTang?: number
  nvGiam?: number
  tang?: number
  giam?: number
}

export interface BctcAnalysis {
  row: DiffRow
  soPS: number
  impacts: RowImpacts
  glv: string
  glvOverridden: boolean
  chiTieuNo: string
  chiTieuCo: string
  nhomNo: string
  nhomCo: string
}

export interface TongKiemTra {
  tongTaiSanTang: number
  tongTaiSanGiam: number
  tongNguonVonTang: number
  tongNguonVonGiam: number
  chenhLechCanDoi: number // (TS tăng − TS giảm) − (NV tăng − NV giảm), phải ≈ 0
  anhHuongLoiNhuanThuan: number
  canDoiToanBang: boolean
  soDongChuaMap: number
}

export interface BctcResult {
  cdktRows: GomNhomCdktRow[]
  kqkdRows: GomNhomKqkdRow[]
  financialCdkt: BctcRow[]
  financialKqkd: BctcRow[]
  totals: TongKiemTra
  analyses: readonly BctcAnalysis[]
  workingPaperLines: readonly WorkingPaperLine[]
  detailedWorkingPaperLines: readonly WorkingPaperLine[]
}

const LNST_ITEM = 'Lợi nhuận sau thuế chưa phân phối'
const FX_ITEM = 'Chênh lệch tỷ giá hối đoái'
const NET_PROFIT_LABEL = 'Ảnh hưởng lợi nhuận thuần'

/** Chuẩn hóa DiffRow thành bút toán có số dương: CL âm = đảo chiều Nợ/Có. */
function diffToButToan(row: DiffRow): { tkNo: string; tkCo: string; soPS: number } {
  const raw = Number(row.difference.slice(row.difference.indexOf('|') + 1))
  if (raw < 0) return { tkNo: row.credit, tkCo: row.debit, soPS: -raw }
  return { tkNo: row.debit, tkCo: row.credit, soPS: raw }
}

/** Phân loại + tính X/Y/Z/AA/AB cho từng bút toán điều chỉnh. */
export function analyzeDiffRows(rows: readonly DiffRow[]): BctcAnalysis[] {
  return rows.map((row) => {
    const bt = diffToButToan(row)
    const impacts = computeRow(bt)
    const noMapped = impacts.noMapped
    const coMapped = impacts.coMapped
    return {
      row,
      soPS: bt.soPS,
      impacts,
      glv: suggestGlv(row),
      glvOverridden: false,
      chiTieuNo: noMapped?.chiTieu ?? '',
      chiTieuCo: coMapped?.chiTieu ?? '',
      nhomNo: noMapped ? `${noMapped.baoCao}/${noMapped.nhom}` : '',
      nhomCo: coMapped ? `${coMapped.baoCao}/${coMapped.nhom}` : '',
    }
  })
}

function suggestGlv(row: DiffRow): string {
  return suggestWorkingPaper({ noiDung: row.description, tkNo: row.debit, tkCo: row.credit })
}

interface ItemAccumulator {
  y: number
  z: number
  dt: number // Có tăng − Nợ giảm (quy về lợi nhuận)
  cp: number // Nợ tăng − Có giảm
}

function emptyAcc(): ItemAccumulator {
  return { y: 0, z: 0, dt: 0, cp: 0 }
}

/** aggregateCDKT + aggregateKQKD — mỗi chỉ tiêu tối đa một dòng; 413 riêng; LNST cuối. */
export function buildBctc(analyses: readonly BctcAnalysis[]): BctcResult {
  const acc = new Map<string, ItemAccumulator>()
  const touch = (name: string): ItemAccumulator => {
    let a = acc.get(name)
    if (!a) {
      a = emptyAcc()
      acc.set(name, a)
    }
    return a
  }

  for (const an of analyses) {
    const { noMapped, coMapped } = an.impacts
    const amount = an.soPS

    // TS thuần theo chỉ tiêu TK Nợ/Có
    if (noMapped && noMapped.baoCao === 'CDKT' && noMapped.nhom === 'TS') touch(noMapped.chiTieu).y += amount
    if (coMapped && coMapped.baoCao === 'CDKT' && coMapped.nhom === 'TS') touch(coMapped.chiTieu).y -= amount

    // NV thuần (chưa gồm lợi nhuận)
    if (noMapped && noMapped.baoCao === 'CDKT' && noMapped.nhom === 'NV') touch(noMapped.chiTieu).z -= amount
    if (coMapped && coMapped.baoCao === 'CDKT' && coMapped.nhom === 'NV') touch(coMapped.chiTieu).z += amount

    // KQKD quy về lợi nhuận
    if (noMapped && noMapped.baoCao === 'KQKD' && noMapped.nhom === 'DT') touch(noMapped.chiTieu).dt -= amount
    if (coMapped && coMapped.baoCao === 'KQKD' && coMapped.nhom === 'DT') touch(coMapped.chiTieu).dt += amount
    if (noMapped && noMapped.baoCao === 'KQKD' && noMapped.nhom === 'CP') touch(noMapped.chiTieu).cp += amount
    if (coMapped && coMapped.baoCao === 'KQKD' && coMapped.nhom === 'CP') touch(coMapped.chiTieu).cp -= amount
  }

  // Tổng ảnh hưởng lợi nhuận thuần → NV của LNST (trừ bút toán chạm trực tiếp 421)
  let netProfit = 0
  for (const an of analyses) {
    if (!an.impacts.involves421) netProfit += an.impacts.x
  }
  touch(LNST_ITEM).z += netProfit

  // ── Sắp xếp theo danh mục chuẩn ──
  const orderCdkt = new Map(CHI_TIEU_CDKT_CHUAN.map((c, i) => [normalizeName(c.chiTieu), i]))
  const orderKqkd = new Map(CHI_TIEU_KQKD_CHUAN.map((c, i) => [normalizeName(c.chiTieu), i]))

  function sortIndex(name: string, order: Map<string, number>): number {
    const idx = order.get(normalizeName(name))
    return idx ?? Number.MAX_SAFE_INTEGER - 1
  }

  // CĐKT: bỏ chỉ tiêu 0 đồng; tách đặc biệt (FX, LNST) xuống cuối
  const normalItems = [...acc.entries()].filter(
    ([name, a]) =>
      name !== FX_ITEM && name !== LNST_ITEM && !(a.y === 0 && a.z === 0),
  )
  normalItems.sort((a, b) => sortIndex(a[0], orderCdkt) - sortIndex(b[0], orderCdkt))

  const cdktRows: GomNhomCdktRow[] = normalItems.map(([name, a]) => ({
    chiTieu: name,
    tsTang: Math.max(0, a.y),
    tsGiam: Math.max(0, -a.y),
    nvTang: Math.max(0, a.z),
    nvGiam: Math.max(0, -a.z),
  }))
  if (acc.has(FX_ITEM)) {
    const a = acc.get(FX_ITEM)!
    if (a.y !== 0 || a.z !== 0) {
      cdktRows.push({ chiTieu: FX_ITEM, tsTang: Math.max(0, a.y), tsGiam: Math.max(0, -a.y), nvTang: Math.max(0, a.z), nvGiam: Math.max(0, -a.z) })
    }
  }
  if (acc.has(LNST_ITEM)) {
    const a = acc.get(LNST_ITEM)!
    if (a.y !== 0 || a.z !== 0) {
      cdktRows.push({ chiTieu: LNST_ITEM, tsTang: Math.max(0, a.y), tsGiam: Math.max(0, -a.y), nvTang: Math.max(0, a.z), nvGiam: Math.max(0, -a.z) })
    }
  }

  // KQKD: DT & CP, thêm dòng lợi nhuận thuần cuối
  const kqkdItems = [...acc.entries()].filter(([, a]) => a.dt !== 0 || a.cp !== 0)
  kqkdItems.sort((a, b) => sortIndex(a[0], orderKqkd) - sortIndex(b[0], orderKqkd))
  const kqkdRows: GomNhomKqkdRow[] = kqkdItems.map(([name, a]) => {
    const profitDelta = a.dt - a.cp
    return { chiTieu: name, tang: Math.max(0, profitDelta), giam: Math.max(0, -profitDelta) }
  })
  kqkdRows.push({ chiTieu: NET_PROFIT_LABEL, tang: Math.max(0, netProfit), giam: Math.max(0, -netProfit) })

  // ── buildFinancialImpact: khớp theo "chứa tên chỉ tiêu" như SUMIFS "*&tên&*" ──
  const financialCdkt: BctcRow[] = CHI_TIEU_CDKT_CHUAN.map((std) => {
    const matched = cdktRows.filter((r) => matchName(std.chiTieu, r.chiTieu))
    const sum = (pick: (r: GomNhomCdktRow) => number): number => matched.reduce((s, r) => s + pick(r), 0)
    return {
      maSo: std.maSo,
      chiTieu: std.chiTieu,
      tsTang: sum((r) => r.tsTang),
      tsGiam: sum((r) => r.tsGiam),
      nvTang: sum((r) => r.nvTang),
      nvGiam: sum((r) => r.nvGiam),
    }
  })

  const financialKqkd: BctcRow[] = CHI_TIEU_KQKD_CHUAN.map((std) => {
    const matched = kqkdRows.filter((r) => r.chiTieu !== NET_PROFIT_LABEL && matchName(std.chiTieu, r.chiTieu))
    const sum = (pick: (r: GomNhomKqkdRow) => number): number => matched.reduce((s, r) => s + pick(r), 0)
    return { maSo: std.maSo, chiTieu: std.chiTieu, tang: sum((r) => r.tang), giam: sum((r) => r.giam) }
  })

  // ── Tổng kiểm tra cân đối toàn bảng ──
  const tongTaiSanTang = analyses.reduce((s, a) => s + Math.max(0, a.impacts.y), 0)
  const tongTaiSanGiam = analyses.reduce((s, a) => s + Math.max(0, -a.impacts.y), 0)
  const tongNguonVonTang = analyses.reduce((s, a) => s + Math.max(0, a.impacts.z), 0)
  const tongNguonVonGiam = analyses.reduce((s, a) => s + Math.max(0, -a.impacts.z), 0)
  const chenhLech = tongTaiSanTang - tongTaiSanGiam - (tongNguonVonTang - tongNguonVonGiam)

  return {
    cdktRows,
    kqkdRows,
    financialCdkt,
    financialKqkd,
    totals: {
      tongTaiSanTang,
      tongTaiSanGiam,
      tongNguonVonTang,
      tongNguonVonGiam,
      chenhLechCanDoi: chenhLech,
      anhHuongLoiNhuanThuan: netProfit,
      canDoiToanBang: isBalanced(chenhLech),
      soDongChuaMap: analyses.filter((a) => a.impacts.ab === 'CHƯA KIỂM TRA CÂN').length,
    },
    analyses,
    workingPaperLines: generateWorkingPaperLines(analyses, cdktRows, kqkdRows),
    detailedWorkingPaperLines: generateWorkingPaperLines(analyses, cdktRows, kqkdRows),
  }
}

function isBalanced(v: number): boolean {
  return Math.abs(v) < 1
}

function normalizeName(s: string): string {
  return s.trim().toUpperCase().replace(/\s+/g, ' ')
}

function matchName(standard: string, actual: string): boolean {
  // Đúng语义 SUMIFS "*&tênChuẩn&*": DỮ LIỆU phải CHỨA tên chuẩn (một chiều!)
  const nStd = normalizeName(standard)
  const nAct = normalizeName(actual)
  if (nAct.includes(nStd)) return true
  return stripVi(nAct).includes(stripVi(nStd))
}

function stripVi(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('đ', 'd')
}

export function extractPrefixOf(tk: string): string {
  return extractTk3(tk)
}

export { computeRow as computeRowForTest }
