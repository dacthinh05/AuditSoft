import { makeMoney } from '../money'
import type { JournalEntry } from '../../shared/types/analytics'
import type {
  ExpenseByNatureBctcRecon,
  ExpenseByNatureMonthRow,
  ExpenseByNatureReport,
  ExpenseNatureAccountBreakdown,
  ExpenseNatureCategory,
} from './types'
import { moneyToNumber } from '../money'
import type { CdfsAccountRow } from '../workingpaper/types'

const STANDARD_ACCOUNT_NAMES: Record<string, string> = {
  '621': 'Chi phí nguyên liệu, vật liệu trực tiếp',
  '622': 'Chi phí nhân công trực tiếp',
  '627': 'Chi phí sản xuất chung',
  '6271': 'Chi phí nhân viên phân xưởng',
  '6272': 'Chi phí vật liệu phân xưởng',
  '6273': 'Chi phí dụng cụ sản xuất',
  '6274': 'Chi phí khấu hao TSCĐ phân xưởng',
  '6277': 'Chi phí dịch vụ mua ngoài phân xưởng',
  '6278': 'Chi phí khác bằng tiền phân xưởng',
  '641': 'Chi phí bán hàng',
  '6411': 'Chi phí nhân viên bán hàng',
  '6412': 'Chi phí vật liệu, bao bì bán hàng',
  '6413': 'Chi phí dụng cụ, đồ dùng bán hàng',
  '6414': 'Chi phí khấu hao TSCĐ bán hàng',
  '6417': 'Chi phí dịch vụ mua ngoài bán hàng',
  '6418': 'Chi phí khác bằng tiền bán hàng',
  '642': 'Chi phí quản lý doanh nghiệp',
  '6421': 'Chi phí nhân viên quản lý',
  '6422': 'Chi phí vật liệu quản lý',
  '6423': 'Chi phí đồ dùng văn phòng',
  '6424': 'Chi phí khấu hao TSCĐ quản lý',
  '6427': 'Chi phí dịch vụ mua ngoài quản lý',
  '6428': 'Chi phí khác bằng tiền quản lý',
  '214': 'Hao mòn tài sản cố định',
  '152': 'Nguyên liệu, vật liệu xuất dùng',
  '334': 'Phải trả người lao động',
  '338': 'Bảo hiểm và các khoản trích theo lương',
}

/**
 * Engine Phân Tích Chi Phí Theo Yếu Tố 12 Tháng (Expense By Nature)
 * Bóc tách 5 yếu tố chi phí: NVL, Nhân công, Khấu hao, Dịch vụ mua ngoài, Chi phí khác
 * và tự động lập Bảng Kiểm Tra Cân Đối Thuyết Minh BCTC chuẩn VAS 01 / Thông tư 200.
 */
export class ExpenseByNatureEngine {
  public static analyze(
    entries: JournalEntry[],
    cdfsAccounts?: Map<string, CdfsAccountRow>,
  ): ExpenseByNatureReport {
    const rawMaterials12 = new Array(12).fill(0)
    const labor12 = new Array(12).fill(0)
    const depreciation12 = new Array(12).fill(0)
    const outsideServices12 = new Array(12).fill(0)
    const otherCash12 = new Array(12).fill(0)

    let totalCogs632Net = 0
    let totalSelling641Net = 0
    let totalAdmin642Net = 0
    let commercialCogs156 = 0

    // Thu thập các bút toán xuất dùng trực tiếp hoặc chuyển thẳng giá vốn
    let directCogsFrom154 = 0
    let internalCostFrom155 = 0
    let reverseCogsTo155 = 0
    let reverseCostTo152 = 0

    const accountMap = new Map<string, ExpenseNatureAccountBreakdown>()

    // ── VÒNG 1: THEO DÕI TỔNG PHÁT SINH THUẦN P&L (NỢ - CÓ 632, 641, 642) ──
    for (const e of entries) {
      const d = e.debitAccount.trim()
      const c = e.creditAccount.trim()
      const amt = moneyToNumber(e.amount)
      if (amt === 0) continue

      // Bỏ qua bút toán kết chuyển 911
      if (d.startsWith('911') || c.startsWith('911')) continue

      // 1. Giá vốn 632 thuần (Nợ 632 - Có 632 do trả lại hàng/giảm giá)
      if (d.startsWith('632')) {
        totalCogs632Net += amt
        if (c.startsWith('156')) {
          commercialCogs156 += amt
        } else if (c.startsWith('154')) {
          directCogsFrom154 += amt
        }
      } else if (c.startsWith('632')) {
        totalCogs632Net -= amt
        if (d.startsWith('155')) {
          reverseCogsTo155 += amt
        }
      }

      // 2. Chi phí bán hàng 641 thuần (Nợ 641 - Có 641)
      if (d.startsWith('641')) {
        totalSelling641Net += amt
        if (c.startsWith('155')) internalCostFrom155 += amt
      } else if (c.startsWith('641')) {
        totalSelling641Net -= amt
      }

      // 3. Chi phí QLDN 642 thuần (Nợ 642 - Có 642)
      if (d.startsWith('642')) {
        totalAdmin642Net += amt
        if (c.startsWith('155')) internalCostFrom155 += amt
      } else if (c.startsWith('642')) {
        totalAdmin642Net -= amt
      }

      // 4. Thu hồi phế liệu nhập kho 152 từ 154
      if (d.startsWith('152') && c.startsWith('154')) {
        reverseCostTo152 += amt
      }
    }

    // ── VÒNG 2: BÓC TÁCH 5 YẾU TỐ CHI PHÍ ĐẦU VÀO THUẦN (12 THÁNG) ──
    for (const e of entries) {
      if (!e.month || e.month < 1 || e.month > 12) continue
      const mIdx = e.month - 1
      const amt = moneyToNumber(e.amount)
      if (amt === 0) continue

      const d = e.debitAccount.trim()
      const c = e.creditAccount.trim()

      // Bỏ qua kết chuyển 911, kết chuyển giá thành nội bộ (154/62x, 155/154) và giá vốn 632
      if (d.startsWith('911') || c.startsWith('911')) continue
      if (d.startsWith('154') && c.startsWith('62')) continue
      if (d.startsWith('155') && c.startsWith('154')) continue
      if (d.startsWith('632') || c.startsWith('632')) continue

      // Xác định dấu: Bút toán ghi Nợ chi phí (+), Ghi Có chi phí giảm trừ (-)
      let sign = 0
      let acc = ''

      if (d.startsWith('621') || d.startsWith('622') || d.startsWith('627') || d.startsWith('641') || d.startsWith('642')) {
        sign = 1
        acc = d
      } else if (c.startsWith('621') || c.startsWith('622') || c.startsWith('627') || c.startsWith('641') || c.startsWith('642')) {
        sign = -1
        acc = c
      }

      if (sign === 0) continue

      const netAmt = sign * amt
      // Phân loại 5 yếu tố theo tính chất tài khoản và đối ứng chuẩn kiểm toán:
      let cat: ExpenseNatureCategory = 'OTHER_CASH'
      let catLabel = 'Khác Bằng Tiền'
      // A. ĐẶC THÙ GIA CÔNG NGOÀI & PHÂN BỔ 242 (TRÁNH GOM NHẦM VÀO NVL HOẶC KHẤU HAO):
      if (acc.startsWith('62722') || acc.startsWith('64122') || acc.startsWith('64222')) {
        // Chi phí gia công ngoài thuê ngoài -> Dịch vụ mua ngoài (298 tỷ)
        cat = 'OUTSIDE_SERVICES'
        catLabel = 'Dịch Vụ Ngoài'
        outsideServices12[mIdx] += netAmt
      } else if (acc.startsWith('62744') || acc.startsWith('64244') || acc.startsWith('64144')) {
        // Chi phí cho phân bổ CCDC (TK 242) -> Khác bằng tiền (81.3 tỷ), KHÔNG PHẢI KHẤU HAO!
        cat = 'OTHER_CASH'
        catLabel = 'Khác Bằng Tiền'
        otherCash12[mIdx] += netAmt
      } else if (acc.startsWith('62741') || acc.startsWith('64141') || acc.startsWith('64241') || c.startsWith('214') || d.startsWith('214')) {
        // Chỉ những tài khoản khấu hao TSCĐ hữu hình/vô hình thực tế (62741, 214) -> Khấu hao (19.9 tỷ)
        cat = 'DEPRECIATION'
        catLabel = 'Khấu Hao'
        depreciation12[mIdx] += netAmt
      } else if (
        acc.startsWith('622') ||
        acc.startsWith('6271') ||
        acc.startsWith('6411') ||
        acc.startsWith('6421') ||
        c.startsWith('334') ||
        c.startsWith('338') ||
        d.startsWith('334') ||
        d.startsWith('338')
      ) {
        // Nhân công (527.7 tỷ)
        cat = 'LABOR'
        catLabel = 'Nhân Công'
        labor12[mIdx] += netAmt
      } else if (
        acc.startsWith('621') ||
        acc.startsWith('62720') ||
        acc.startsWith('62721') ||
        acc.startsWith('64121') ||
        acc.startsWith('64221') ||
        c.startsWith('152') ||
        d.startsWith('152')
      ) {
        // Nguyên vật liệu (chỉ khi thực sự có 621 hoặc xuất kho 152 vật liệu)
        cat = 'RAW_MATERIALS'
        catLabel = 'Nguyên Vật Liệu'
        rawMaterials12[mIdx] += netAmt
      } else if (
        acc.startsWith('6277') ||
        acc.startsWith('6417') ||
        acc.startsWith('6427') ||
        (!acc.startsWith('6278') && !acc.startsWith('6418') && !acc.startsWith('6428') && !acc.startsWith('6273') && (c.startsWith('331') || c.startsWith('111') || c.startsWith('112')))
      ) {
        // Dịch vụ mua ngoài (điện, nước, viễn thông, thuê ngoài)
        cat = 'OUTSIDE_SERVICES'
        catLabel = 'Dịch Vụ Ngoài'
        outsideServices12[mIdx] += netAmt
      } else {
        // Khác bằng tiền (CCDC 6273x, 6278, 6418, 6428, thuế môn bài, chi phí khác)
        cat = 'OTHER_CASH'
        catLabel = 'Khác Bằng Tiền'
        otherCash12[mIdx] += netAmt
      }
      const mapKey = `${acc}__${cat}`
      let record = accountMap.get(mapKey)
      if (!record) {
        const name = cdfsAccounts?.get(acc)?.tentk || STANDARD_ACCOUNT_NAMES[acc] || `Chi phí TK ${acc}`
        record = {
          accountCode: acc,
          accountName: name,
          category: cat,
          categoryLabel: catLabel,
          monthlyAmounts: new Array(12).fill(0),
          annualTotal: 0,
        }
        accountMap.set(mapKey, record)
      }
      record.monthlyAmounts[mIdx] = (record.monthlyAmounts[mIdx] ?? 0) + netAmt
      record.annualTotal += netAmt
    }

    const categoryOrder: Record<ExpenseNatureCategory, number> = {
      RAW_MATERIALS: 1,
      LABOR: 2,
      DEPRECIATION: 3,
      OUTSIDE_SERVICES: 4,
      OTHER_CASH: 5,
    }

    const accountBreakdowns = Array.from(accountMap.values()).sort((a, b) => {
      const diff = categoryOrder[a.category] - categoryOrder[b.category]
      if (diff !== 0) return diff
      return a.accountCode.localeCompare(b.accountCode)
    })

    // ── XÂY DỰNG CÁC DÒNG 12 THÁNG ──
    const rows: ExpenseByNatureMonthRow[] = []
    for (let m = 0; m < 12; m++) {
      const mat = rawMaterials12[m] ?? 0
      const lab = labor12[m] ?? 0
      const depr = depreciation12[m] ?? 0
      const srv = outsideServices12[m] ?? 0
      const oth = otherCash12[m] ?? 0
      const totalNature = mat + lab + depr + srv + oth

      rows.push({
        month: m + 1,
        monthLabel: `Tháng ${String(m + 1).padStart(2, '0')}`,
        rawMaterials: mat,
        labor: lab,
        depreciation: depr,
        outsideServices: srv,
        otherCash: oth,
        totalNature,
      })
    }

    // Trừ các khoản giảm chi phí nguyên vật liệu thu hồi phế liệu (Nợ 152 / Có 154)
    if (reverseCostTo152 > 0) {
      const perMonth = reverseCostTo152 / 12
      for (let m = 0; m < 12; m++) {
        rawMaterials12[m] = Math.max(0, (rawMaterials12[m] ?? 0) - perMonth)
        const rowItem = rows[m]
        if (rowItem) {
          rowItem.rawMaterials = rawMaterials12[m] ?? 0
          rowItem.totalNature =
            rowItem.rawMaterials + rowItem.labor + rowItem.depreciation + rowItem.outsideServices + rowItem.otherCash
        }
      }
    }

    const annualMat = rawMaterials12.reduce((s, v) => s + v, 0)
    const annualLab = labor12.reduce((s, v) => s + v, 0)
    const annualDepr = depreciation12.reduce((s, v) => s + v, 0)
    const annualSrv = outsideServices12.reduce((s, v) => s + v, 0)
    const annualOth = otherCash12.reduce((s, v) => s + v, 0)
    const totalNatureCost =
      annualMat + annualLab + annualDepr + annualSrv + annualOth
    // ── XỬ LÝ BIẾN ĐỘNG KHO 154 & 155 (TỪ CDFS HOẶC TỰ SUY TỪ DÒNG LUÂN CHUYỂN NKC) ──
    let wipOpening154 = 0
    let wipClosing154 = 0
    let finishedOpening155 = 0
    let finishedClosing155 = 0
    let hasCdfsData = false

    if (cdfsAccounts && cdfsAccounts.size > 0) {
      for (const [code, a] of cdfsAccounts.entries()) {
        if (code.startsWith('154')) {
          wipOpening154 += a.sdndk || 0
          wipClosing154 += a.nock || 0
          if (a.sdndk || a.nock) hasCdfsData = true
        }
        if (code.startsWith('155')) {
          finishedOpening155 += a.sdndk || 0
          finishedClosing155 += a.nock || 0
          if (a.sdndk || a.nock) hasCdfsData = true
        }
      }
    }

    let deltaWip154 = 0
    let deltaFinished155 = 0

    if (hasCdfsData) {
      // 1. Trường hợp có Bảng CĐSPS: Tính chuẩn xác theo số dư đầu kỳ - cuối kỳ
      deltaWip154 = wipOpening154 - wipClosing154
      deltaFinished155 = finishedOpening155 - finishedClosing155
    } else {
      // 2. Trường hợp nạp Sổ NKC độc lập (chưa có CDFS): Tự động trích xuất biến động từ dòng luân chuyển trên NKC
      // Delta 154 = (Có 154 sang 155 + Có 154 sang 632 + Có 154 sang 152) - Nợ 154 từ 62x
      // Delta 155 = (Có 155 sang 632 + Có 155 dùng nội bộ 64x) - (Nợ 155 từ 154 + Nợ 155 trả lại hàng từ 632)
      let deb154Total = 0
      let cred154Total = 0
      let deb155Total = 0
      let cred155Total = 0

      for (const e of entries) {
        const d = e.debitAccount.trim()
        const c = e.creditAccount.trim()
        const amt = moneyToNumber(e.amount)

        if (d.startsWith('154')) deb154Total += amt
        if (c.startsWith('154')) cred154Total += amt
        if (d.startsWith('155')) deb155Total += amt
        if (c.startsWith('155')) cred155Total += amt
      }

      deltaWip154 = cred154Total - deb154Total
      deltaFinished155 = cred155Total - deb155Total

      if (deltaWip154 < 0) wipClosing154 = Math.abs(deltaWip154)
      else if (deltaWip154 > 0) wipOpening154 = deltaWip154

      if (deltaFinished155 < 0) finishedClosing155 = Math.abs(deltaFinished155)
      else if (deltaFinished155 > 0) finishedOpening155 = deltaFinished155
    }

    // Tổng chi phí SXKD tính theo công thức Thuyết minh:
    // = 5 Yếu tố thuần + Thương mại 156 + (154 ĐK - 154 CK) + (155 ĐK - 155 CK)
    const calculatedTotalOperatingCost =
      totalNatureCost + commercialCogs156 + deltaWip154 + deltaFinished155

    // Tổng chi phí chuyển sang 911 thuần (Tổng Nợ - Có của 632, 641, 642)
    const totalTransferred911Cost =
      totalCogs632Net + totalSelling641Net + totalAdmin642Net

    const difference =
      calculatedTotalOperatingCost - totalTransferred911Cost
    const isBalanced = Math.abs(difference) < 1000 // Chấp nhận sai số làm tròn nhỏ dưới 1.000 đ

    const bctcReconciliation: ExpenseByNatureBctcRecon = {
      rawMaterials: annualMat,
      labor: annualLab,
      depreciation: annualDepr,
      outsideServices: annualSrv,
      otherCash: annualOth,
      commercialCogs: commercialCogs156,
      realEstateCogs: 0,
      totalNatureCost,
      wipOpening154,
      finishedOpening155,
      wipClosing154,
      finishedClosing155,
      deltaWip154,
      deltaFinished155,
      calculatedTotalOperatingCost,
      transferredCogs632: totalCogs632Net,
      transferredSelling641: totalSelling641Net,
      transferredAdmin642: totalAdmin642Net,
      totalTransferred911Cost,
      difference,
      isBalanced,
    }

    return {
      rows,
      annualTotals: {
        rawMaterials: annualMat,
        labor: annualLab,
        depreciation: annualDepr,
        outsideServices: annualSrv,
        otherCash: annualOth,
        totalNature: totalNatureCost,
      },
      bctcReconciliation,
      accountBreakdowns,
    }
  }
}
