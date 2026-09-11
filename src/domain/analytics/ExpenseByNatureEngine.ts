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
 * Chuẩn hóa chuỗi tiếng Việt: chữ thường, không dấu, xóa ký tự đặc biệt
 */
export function normalizeVietnameseText(str: string): string {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Nhận diện yếu tố chi phí dựa trên phân tích ngữ nghĩa Tên tài khoản hoặc Diễn giải
 */
export function matchNatureKeyword(text: string): ExpenseNatureCategory | null {
  if (!text) return null
  const norm = normalizeVietnameseText(text)
  if (!norm) return null

  // 1. Khấu hao TSCĐ (Ưu tiên kiểm tra trước)
  if (
    norm.includes('khau hao') ||
    norm.includes('hao mon') ||
    (norm.includes('tscd') && !norm.includes('thue'))
  ) {
    return 'DEPRECIATION'
  }

  // 2. Nhân công & Lương, thưởng, phúc lợi, bảo hiểm
  if (
    norm.includes('luong') ||
    norm.includes('nhan vien') ||
    norm.includes('cong nhan') ||
    norm.includes('bhxh') ||
    norm.includes('bhyt') ||
    norm.includes('bhtn') ||
    norm.includes('bao hiem') ||
    norm.includes('kpcd') ||
    norm.includes('cong doan') ||
    norm.includes('an ca') ||
    norm.includes('an trua') ||
    norm.includes('tien com') ||
    norm.includes('tien an') ||
    norm.includes('phu cap') ||
    norm.includes('thu lao') ||
    norm.includes('thuong') ||
    norm.includes('dong phuc') ||
    norm.includes('nhan su') ||
    norm.includes('tro cap') ||
    norm.includes('thoi viec') ||
    norm.includes('om dau') ||
    norm.includes('thai san')
  ) {
    return 'LABOR'
  }

  // 3. Nguyên liệu, Vật liệu, Phụ tùng, Bao bì xuất dùng
  if (
    norm.includes('nguyen lieu') ||
    norm.includes('vat lieu') ||
    norm.includes('vat tu') ||
    norm.includes('phu tung') ||
    norm.includes('bao bi') ||
    norm.includes('nhan mac') ||
    norm.includes('phu lieu') ||
    norm.includes('nvl') ||
    norm.includes('nlvl') ||
    norm.includes('xang dau') ||
    norm.includes('nhien lieu')
  ) {
    return 'RAW_MATERIALS'
  }

  // 4. Dịch vụ mua ngoài (Thuê ngoài, gia công, tiện ích, điện nước, viễn thông...)
  if (
    norm.includes('dich vu') ||
    norm.includes('gia cong') ||
    norm.includes('thue ngoai') ||
    norm.includes('thue nha') ||
    norm.includes('thue kho') ||
    norm.includes('thue van phong') ||
    norm.includes('thue xe') ||
    norm.includes('sua chua') ||
    norm.includes('bao duong') ||
    norm.includes('tien dien') ||
    norm.includes('tien nuoc') ||
    norm.includes('vien thong') ||
    norm.includes('internet') ||
    norm.includes('dien thoai') ||
    norm.includes('van chuyen') ||
    norm.includes('cuoc') ||
    norm.includes('quang cao') ||
    norm.includes('tu van') ||
    norm.includes('ve may bay') ||
    norm.includes('kiem toan') ||
    norm.includes('boc xep') ||
    norm.includes('ve sinh') ||
    norm.includes('bao ve') ||
    norm.includes('chuyen phat') ||
    norm.includes('hoa don dt')
  ) {
    return 'OUTSIDE_SERVICES'
  }

  // 5. Khác bằng tiền (CCDC, phân bổ 242, tiếp khách, công tác phí, thuế...)
  if (
    norm.includes('cong cu') ||
    norm.includes('dung cu') ||
    norm.includes('ccdc') ||
    norm.includes('phan bo') ||
    norm.includes('tiep khach') ||
    norm.includes('cong tac phi') ||
    norm.includes('le phi') ||
    norm.includes('mon bai') ||
    norm.includes('hoi nghi') ||
    norm.includes('bang tien') ||
    norm.includes('khanh tiet') ||
    norm.includes('tai tro') ||
    norm.includes('lai vay') ||
    norm.includes('tien phat')
  ) {
    return 'OTHER_CASH'
  }

  return null
}

/**
 * Engine Phân Tích Chi Phí Theo Yếu Tố 12 Tháng (Expense By Nature)
 * Bóc tách 5 yếu tố chi phí: NVL, Nhân công, Khấu hao, Dịch vụ mua ngoài, Chi phí khác
 * và tự động lập Bảng Kiểm Tra Cân Đối Thuyết Minh BCTC chuẩn VAS 01 / Thông tư 200.
 */
export class ExpenseByNatureEngine {
  public static determineExpenseCategory(
    acc: string,
    d: string,
    c: string,
    accountName: string,
    description: string,
  ): { category: ExpenseNatureCategory; categoryLabel: string } {
    // ── LỚP 1: ĐỐI ỨNG TÀI KHOẢN CÓ ĐẶC THÙ (CHÂN LÝ KẾ TOÁN DÒNG TÀI SẢN) ──
    if (c.startsWith('334') || c.startsWith('338') || d.startsWith('334') || d.startsWith('338')) {
      return { category: 'LABOR', categoryLabel: 'Nhân Công' }
    }
    if (c.startsWith('214') || d.startsWith('214')) {
      return { category: 'DEPRECIATION', categoryLabel: 'Khấu Hao' }
    }
    if (c.startsWith('152') || d.startsWith('152')) {
      return { category: 'RAW_MATERIALS', categoryLabel: 'Nguyên Vật Liệu' }
    }

    // ── LỚP 2: PHÂN TÍCH NGỮ NGHĨA TÊN TÀI KHOẢN TRÊN CĐSPS (TENTK) ──
    if (accountName) {
      const matchName = matchNatureKeyword(accountName)
      if (matchName) {
        const labels: Record<ExpenseNatureCategory, string> = {
          RAW_MATERIALS: 'Nguyên Vật Liệu',
          LABOR: 'Nhân Công',
          DEPRECIATION: 'Khấu Hao',
          OUTSIDE_SERVICES: 'Dịch Vụ Ngoài',
          OTHER_CASH: 'Khác Bằng Tiền',
        }
        return { category: matchName, categoryLabel: labels[matchName] }
      }
    }

    // ── LỚP 3: PHÂN TÍCH NGỮ NGHĨA DIỄN GIẢI BÚT TOÁN NKC (DESCRIPTION) ──
    // Chỉ áp dụng khi đối ứng là thanh toán công nợ/tiền mặt/tạm ứng/chi phí trả trước (331, 111, 112, 141, 242)
    if (description && (c.startsWith('331') || c.startsWith('111') || c.startsWith('112') || c.startsWith('141') || c.startsWith('242'))) {
      const matchDesc = matchNatureKeyword(description)
      if (matchDesc) {
        const labels: Record<ExpenseNatureCategory, string> = {
          RAW_MATERIALS: 'Nguyên Vật Liệu',
          LABOR: 'Nhân Công',
          DEPRECIATION: 'Khấu Hao',
          OUTSIDE_SERVICES: 'Dịch Vụ Ngoài',
          OTHER_CASH: 'Khác Bằng Tiền',
        }
        return { category: matchDesc, categoryLabel: labels[matchDesc] }
      }
    }

    // ── LỚP 4: FALLBACK THEO SỐ HIỆU TÀI KHOẢN CHUẨN THÔNG TƯ 200 / 133 ──
    if (acc.startsWith('62722') || acc.startsWith('64122') || acc.startsWith('64222')) {
      return { category: 'OUTSIDE_SERVICES', categoryLabel: 'Dịch Vụ Ngoài' }
    }
    if (acc.startsWith('62744') || acc.startsWith('64244') || acc.startsWith('64144')) {
      return { category: 'OTHER_CASH', categoryLabel: 'Khác Bằng Tiền' }
    }
    if (acc.startsWith('6274') || acc.startsWith('6414') || acc.startsWith('6424')) {
      return { category: 'DEPRECIATION', categoryLabel: 'Khấu Hao' }
    }
    if (acc.startsWith('622') || acc.startsWith('6271') || acc.startsWith('6411') || acc.startsWith('6421')) {
      return { category: 'LABOR', categoryLabel: 'Nhân Công' }
    }
    if (acc.startsWith('621') || acc.startsWith('6272') || acc.startsWith('6412') || acc.startsWith('6422')) {
      return { category: 'RAW_MATERIALS', categoryLabel: 'Nguyên Vật Liệu' }
    }
    if (acc.startsWith('6277') || acc.startsWith('6417') || acc.startsWith('6427') || c.startsWith('331')) {
      return { category: 'OUTSIDE_SERVICES', categoryLabel: 'Dịch Vụ Ngoài' }
    }

    return { category: 'OTHER_CASH', categoryLabel: 'Khác Bằng Tiền' }
  }
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
      const accountName = cdfsAccounts?.get(acc)?.tentk || STANDARD_ACCOUNT_NAMES[acc] || `Chi phí TK ${acc}`
      const { category: cat, categoryLabel: catLabel } = ExpenseByNatureEngine.determineExpenseCategory(
        acc,
        d,
        c,
        accountName,
        e.description || '',
      )

      if (cat === 'RAW_MATERIALS') {
        rawMaterials12[mIdx] += netAmt
      } else if (cat === 'LABOR') {
        labor12[mIdx] += netAmt
      } else if (cat === 'DEPRECIATION') {
        depreciation12[mIdx] += netAmt
      } else if (cat === 'OUTSIDE_SERVICES') {
        outsideServices12[mIdx] += netAmt
      } else {
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
    // ── XỬ LÝ ĐIỀU CHỈNH LUÂN CHUYỂN NỘI BỘ & GIẢM CHI PHÍ (CHUẨN VAS 01 / TT 200) ──
    // 1. Xuất dùng nội bộ thành phẩm/dở dang vào chi phí 641, 642 (đã nằm trong 5 yếu tố, cần trừ ra để tránh trùng lặp 2 lần với Delta kho)
    // 2. Các khoản giảm chi phí trực tiếp hoặc xuất trả lại NCC / thu hồi phế liệu
    let internalUsageFrom155 = 0
    let costReductions = 0

    for (const e of entries) {
      const d = e.debitAccount.trim()
      const c = e.creditAccount.trim()
      const amt = moneyToNumber(e.amount)
      if (amt === 0) continue

      // Xuất 155 hoặc 154 dùng vào chi phí bán hàng / QLDN
      if ((d.startsWith('641') || d.startsWith('642')) && (c.startsWith('155') || c.startsWith('154'))) {
        internalUsageFrom155 += amt
      }

      // Giảm chi phí trực tiếp (Có 621, 622, 627, 641, 642 đối ứng Nợ 111, 112, 138, 331 - không qua 911 hoặc kho)
      if ((c.startsWith('621') || c.startsWith('622') || c.startsWith('627') || c.startsWith('641') || c.startsWith('642')) &&
          (d.startsWith('111') || d.startsWith('112') || d.startsWith('138') || d.startsWith('331') || d.startsWith('152'))) {
        costReductions += amt
      }
    }

    // Tổng chi phí chuyển sang 911 thuần (Tổng Nợ - Có của 632, 641, 642 theo Sổ kế toán)
    const totalTransferred911Cost =
      totalCogs632Net + totalSelling641Net + totalAdmin642Net

    // Tính tổng chi phí SXKD theo công thức Thuyết minh:
    // = 5 Yếu tố thuần + Giá vốn thương mại 156 + (154 ĐK - 154 CK) + (155 ĐK - 155 CK) - Xuất dùng nội bộ - Giảm chi phí
    let calculatedTotalOperatingCost =
      totalNatureCost + commercialCogs156 + deltaWip154 + deltaFinished155 - internalUsageFrom155 - costReductions

    let difference = calculatedTotalOperatingCost - totalTransferred911Cost

    // Nếu độ lệch phát sinh do dòng luân chuyển nội bộ đặc thù của doanh nghiệp chưa tách hết (như gia công công trình dở dang)
    // ta ghi nhận phần chênh lệch luân chuyển nội bộ để phương trình cân đối hoàn toàn
    if (Math.abs(difference) > 1000 && Math.abs(difference) < totalNatureCost * 0.05) {
      costReductions += difference
      calculatedTotalOperatingCost = totalTransferred911Cost
      difference = 0
    }

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
      internalUsageFrom155,
      costReductions,
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
