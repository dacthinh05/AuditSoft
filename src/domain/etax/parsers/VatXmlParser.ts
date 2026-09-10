import type {
  TaxDeclarationType,
  TaxPeriodType,
  VatDeclarationSnapshot,
  VatIndicatorItem,
} from '../../../shared/types/taxAnalytics'

export const VAT_INDICATOR_NAMES: Record<string, string> = {
  '22': 'Thuế GTGT còn được khấu trừ kỳ trước chuyển sang',
  '23': 'Tổng giá trị hàng hoá, dịch vụ mua vào',
  '24': 'Tổng thuế GTGT của hàng hoá, dịch vụ mua vào',
  '25': 'Tổng thuế GTGT được khấu trừ kỳ này',
  '26': 'Hàng hoá, dịch vụ bán ra không chịu thuế GTGT',
  '27': 'Hàng hoá, dịch vụ bán ra chịu thuế suất 0%',
  '28': 'Hàng hoá, dịch vụ bán ra chịu thuế suất 5%',
  '29': 'Hàng hoá, dịch vụ bán ra chịu thuế suất 10%',
  '34': 'Tổng doanh thu hàng hoá, dịch vụ bán ra',
  '35': 'Tổng thuế GTGT của hàng hoá, dịch vụ bán ra',
  '36': 'Thuế GTGT phát sinh trong kỳ',
  '37': 'Điều chỉnh giảm thuế GTGT còn được khấu trừ của các kỳ trước',
  '38': 'Điều chỉnh tăng thuế GTGT còn được khấu trừ của các kỳ trước',
  '40': 'Thuế GTGT còn phải nộp trong kỳ',
  '41': 'Thuế GTGT chưa khấu trừ hết kỳ này',
  '42': 'Thuế GTGT đề nghị hoàn',
  '43': 'Thuế GTGT còn được khấu trừ chuyển kỳ sau',
}

export function parseMoneyToBigInt(val: unknown): bigint {
  if (val == null) return 0n
  const clean = String(val).replace(/[,.\s]/g, '').trim()
  if (!clean || clean === '-' || isNaN(Number(clean))) return 0n
  try {
    return BigInt(clean)
  } catch {
    return 0n
  }
}

export class VatXmlParser {
  private static findTag(xml: string, tagNames: string[]): string | undefined {
    if (!xml) return undefined
    for (const tag of tagNames) {
      const regex = new RegExp(`<(?:[a-zA-Z0-9_]+:)?${tag}(?:\\s+[^>]*)?>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9_]+:)?${tag}\\s*>`, 'i')
      const match = xml.match(regex)
      if (match && match[1] !== undefined) {
        return match[1].trim()
      }
    }
    return undefined
  }

  public static normalizePeriod(periodVal: string): {
    type: TaxPeriodType
    value: string
    normalizedKey: string
    key: string
    year: number
    quarter?: number
    month?: number
  } {
    const raw = (periodVal || '').trim()
    const clean = raw
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    // Vd: "Q1/2025", "QUY 1/2025", "01/2025", "THANG 01/2025", "2025"
    const qMatch = clean.match(/(?:QUY|Q)\s*([1-4])(?:\/|\s*NAM\s*|\s*)(20\d\d)/i)
    if (qMatch && qMatch[1] && qMatch[2]) {
      const q = parseInt(qMatch[1], 10)
      const y = parseInt(qMatch[2], 10)
      const k = `${y}-Q${q}`
      return {
        type: 'QUARTER',
        value: `Quý ${q}/${y}`,
        normalizedKey: k,
        key: k,
        year: y,
        quarter: q,
      }
    }

    const mMatch = clean.match(/(?:THANG|T|M)?\s*([0-1]?\d)(?:\/|\s*NAM\s*|\s*)(20\d\d)/i)
    if (mMatch && mMatch[1] && mMatch[2]) {
      const m = parseInt(mMatch[1], 10)
      const y = parseInt(mMatch[2], 10)
      if (m >= 1 && m <= 12) {
        const mm = String(m).padStart(2, '0')
        const q = Math.ceil(m / 3)
        const k = `${y}-M${mm}`
        return {
          type: 'MONTH',
          value: `Tháng ${mm}/${y}`,
          normalizedKey: k,
          key: k,
          year: y,
          quarter: q,
          month: m,
        }
      }
    }

    const yMatch = clean.match(/(?:NAM\s*)?(20\d\d)/)
    if (yMatch && yMatch[1]) {
      const y = parseInt(yMatch[1], 10)
      const k = `${y}-YEAR`
      return {
        type: 'YEAR',
        value: `Năm ${y}`,
        normalizedKey: k,
        key: k,
        year: y,
      }
    }

    return {
      type: 'UNKNOWN',
      value: raw || 'Chưa rõ kỳ',
      normalizedKey: 'UNKNOWN',
      key: 'UNKNOWN',
      year: new Date().getFullYear(),
    }
  }

  public static parseVatXml(
    xmlContent: string,
    sourceFile?: string,
  ): VatDeclarationSnapshot | null {
    if (!xmlContent || typeof xmlContent !== 'string') return null
    if (!xmlContent.includes('01/GTGT') && !xmlContent.includes('01_GTGT') && !xmlContent.includes('TKhaiThue')) {
      // Kiểm tra xem có các tag đặc thù của 01/GTGT không
      if (!this.findTag(xmlContent, ['ct22', 'ct23', 'ct34', 'ct35'])) {
        return null
      }
    }

    // 1. Trích xuất thông tin người nộp thuế
    const taxpayerId =
      this.findTag(xmlContent, ['mst', 'maSoThue', 'tin', 'mstNnt']) || ''
    const taxpayerName =
      this.findTag(xmlContent, ['tenNNT', 'tenNguoiNopThue', 'ten']) || ''

    // 2. Trích xuất loại tờ khai và lần bổ sung
    let declarationType: TaxDeclarationType = 'ORIGINAL'
    let supplementalNo: number | undefined = undefined

    const soLanMatch =
      xmlContent.match(/<(?:[a-zA-Z0-9_]+:)?(?:soLan|lanBS|soLanBS)[^>]*>(\d+)<\/(?:[a-zA-Z0-9_]+:)?(?:soLan|lanBS|soLanBS)\s*>/i)
    if (soLanMatch && soLanMatch[1]) {
      const parsedLan = parseInt(soLanMatch[1], 10)
      if (!isNaN(parsedLan)) {
        if (parsedLan > 0) {
          declarationType = 'SUPPLEMENTAL'
          supplementalNo = parsedLan
        } else {
          declarationType = 'ORIGINAL'
        }
      }
    }

    // 3. Trích xuất kỳ kê khai
    const kyKK =
      this.findTag(xmlContent, ['kyKKhai', 'kyTinhThue', 'kyKhai', 'kyBaoCao']) || ''
    const period = this.normalizePeriod(kyKK)

    // 4. Trích xuất các chỉ tiêu [22] -> [43]
    const mainSectionMatch =
      xmlContent.match(/<(?:[a-zA-Z0-9_]+:)?(?:CTietTKhaiChinh|CTietKHBS|CTietTKhai|ChiTietToKhai|BangChiTiet)[^>]*>([\s\S]*?)<\/(?:[a-zA-Z0-9_]+:)?(?:CTietTKhaiChinh|CTietKHBS|CTietTKhai|ChiTietToKhai|BangChiTiet)\s*>/i)
    const targetXml = mainSectionMatch && mainSectionMatch[1] ? mainSectionMatch[1] : xmlContent

    const indicators: Record<string, VatIndicatorItem> = {}

    const extractAndAdd = (code: string, tagAliases: string[]) => {
      const raw = this.findTag(targetXml, tagAliases) || this.findTag(xmlContent, tagAliases)
      const rawStr = (raw || '0').trim()
      indicators[code] = {
        code,
        name: VAT_INDICATOR_NAMES[code] || `Chỉ tiêu [${code}]`,
        rawValue: rawStr,
        numericValue: parseMoneyToBigInt(rawStr),
      }
    }

    extractAndAdd('22', ['ct22', 'thueDauVaoKyTruoc', 'thueGTGTDauVaoKyTruoc', 'ct_22'])
    extractAndAdd('23', ['ct23', 'giaTriHHDVMuaVao', 'tongGiaTriHHDVMuaVao', 'ct_23'])
    extractAndAdd('24', ['ct24', 'thueHHDVMuaVao', 'tongThueHHDVMuaVao', 'ct_24'])
    extractAndAdd('25', ['ct25', 'thueKhauTruKyNay', 'tongThueKhauTruKyNay', 'ct_25'])
    extractAndAdd('26', ['ct26', 'hhdvBanKhongChiuThue', 'ct_26'])
    extractAndAdd('27', ['ct27', 'hhdvBanChiuThue0', 'ct_27'])
    extractAndAdd('28', ['ct28', 'hhdvBanChiuThue5', 'ct_28'])
    extractAndAdd('29', ['ct29', 'hhdvBanChiuThue10', 'ct_29'])
    extractAndAdd('34', ['ct34', 'tongDoanhThuHHDVBanRa', 'tongDTHHDVBanRa', 'ct_34'])
    extractAndAdd('35', ['ct35', 'tongThueHHDVBanRa', 'tongThueGTGTBanRa', 'ct_35'])
    extractAndAdd('36', ['ct36', 'thuePhatSinhTrongKy', 'ct_36'])
    extractAndAdd('37', ['ct37', 'dChinhGiamKhauTruKyTruoc', 'ct_37'])
    extractAndAdd('38', ['ct38', 'dChinhTangKhauTruKyTruoc', 'ct_38'])
    extractAndAdd('40', ['ct40', 'thuePhaiNopTrongKy', 'ct_40', 'thueGTGTPhaiNop'])
    extractAndAdd('41', ['ct41', 'thueChuaKhauTruHet', 'ct_41'])
    extractAndAdd('42', ['ct42', 'thueDeNghiHoan', 'ct_42'])
    extractAndAdd('43', ['ct43', 'thueKhauTruChuyenKySau', 'ct_43', 'thueConDuocKhauTruChuyenKySau'])

    // Fallback tính tổng nếu tờ khai thiếu [34] hoặc [35]
    const c34 = indicators['34']
    const c26 = indicators['26']
    const c27 = indicators['27']
    const c28 = indicators['28']
    const c29 = indicators['29']
    if (c34 && c34.numericValue === 0n && c26 && c27 && c28 && c29) {
      c34.numericValue =
        c26.numericValue +
        c27.numericValue +
        c28.numericValue +
        c29.numericValue
    }

    const submittedAt =
      this.findTag(xmlContent, ['ngayNop', 'ngayLap', 'ngayKy', 'ngayNopTKhai']) || undefined

    return {
      taxpayerId,
      taxpayerName,
      formCode: '01/GTGT',
      period,
      declarationType,
      supplementalNo,
      submittedAt,
      indicators,
      sourceFile,
    }
  }
}
