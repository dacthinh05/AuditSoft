import type {
  PitDeclarationSnapshot,
  TaxDeclarationType,
} from '../../../shared/types/taxAnalytics'
import { parseMoneyToBigInt, VatXmlParser } from './VatXmlParser'

export class PitXmlParser {
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

  public static parsePitXml(
    xmlContent: string,
    sourceFile?: string,
  ): PitDeclarationSnapshot | null {
    if (!xmlContent || typeof xmlContent !== 'string') return null

    const isPit =
      xmlContent.includes('05/KK-TNCN') ||
      xmlContent.includes('05_KK_TNCN') ||
      xmlContent.includes('05/QTT-TNCN') ||
      xmlContent.includes('05_QTT_TNCN') ||
      xmlContent.includes('02/KK-TNCN') ||
      xmlContent.includes('TKhaiThueTNCN') ||
      xmlContent.includes('ToKhaiTNCN')

    if (!isPit) {
      if (!this.findTag(xmlContent, ['ct16', 'ct21', 'ct26', 'ct29']) &&
          !this.findTag(xmlContent, ['ct22', 'ct24', 'ct27', 'ct31'])) {
        return null
      }
    }

    const isFinalization =
      xmlContent.includes('05/QTT') ||
      xmlContent.includes('05_QTT') ||
      xmlContent.includes('QuyetToan') ||
      Boolean(this.findTag(xmlContent, ['ct40', 'ct41', 'ct36', 'ct44']))

    const taxpayerId =
      this.findTag(xmlContent, ['mst', 'maSoThue', 'tin', 'mstNnt']) || ''
    const taxpayerName =
      this.findTag(xmlContent, ['tenNNT', 'tenNguoiNopThue', 'ten']) || ''

    // Loại tờ khai
    let declarationType: TaxDeclarationType = 'ORIGINAL'
    let supplementalNo: number | undefined = undefined

    const soLanMatch =
      xmlContent.match(/<(?:[a-zA-Z0-9_]+:)?(?:soLan|lanBS|soLanBS)[^>]*>(\d+)<\/(?:[a-zA-Z0-9_]+:)?(?:soLan|lanBS|soLanBS)\s*>/i)
    if (soLanMatch && soLanMatch[1]) {
      const parsedLan = parseInt(soLanMatch[1], 10)
      if (!isNaN(parsedLan) && parsedLan > 0) {
        declarationType = 'SUPPLEMENTAL'
        supplementalNo = parsedLan
      }
    }

    // Kỳ kê khai
    const kyKK =
      this.findTag(xmlContent, ['kyKKhai', 'kyTinhThue', 'kyKhai', 'kyBaoCao', 'namKKhai']) || ''
    const period = VatXmlParser.normalizePeriod(kyKK)

    // Bóc tách chỉ tiêu TT80: [16] LĐ, [21] Tổng TNCT, [26] TNCT khấu trừ, [29] Thuế khấu trừ
    // Cũ: [21] LĐ, [24] TNCT, [27] TNCT khấu trừ, [31] Thuế khấu trừ
    const rawCt16 = this.findTag(xmlContent, ['ct16', 'ct21_tongSoNguoiLaoDong', 'tongSoLaoDong', 'ct16_tongSoLaoDong']) ||
      this.findTag(xmlContent, ['ct21']) // Nếu cũ
    const rawCt21 = this.findTag(xmlContent, ['ct21', 'ct24_tongThuNhapChiuThue', 'tongThuNhapChiuThue', 'ct21_tongTNCT']) ||
      this.findTag(xmlContent, ['ct24'])
    const rawCt26 = this.findTag(xmlContent, ['ct26', 'ct27_tongThuNhapChiuThueKhauTru', 'ct26_tongTNCTKhauTru']) ||
      this.findTag(xmlContent, ['ct27'])
    const rawCt27 = this.findTag(xmlContent, ['ct27', 'ct27_tongThueTncnDaKhauTru', 'ct27_tongThueKhauTru'])
    const rawCt28 = this.findTag(xmlContent, ['ct28', 'ct28_thueKhauTruCuTru', 'ct28_cuTru'])
    const rawCt29 = this.findTag(xmlContent, ['ct29', 'ct31_tongThueTncnDaKhauTru', 'ct34_tongThueKhauTru', 'ct29_tongThueKhauTru']) ||
      this.findTag(xmlContent, ['ct31'])
    const rawCt30 = this.findTag(xmlContent, ['ct30', 'ct30_khongCuTru', 'ct29_khongCuTru'])

    const ct16_tongSoNguoiLaoDong = parseMoneyToBigInt(rawCt16)
    const ct21_tongThuNhapChiuThue = parseMoneyToBigInt(rawCt21)
    const ct26_tongThuNhapChiuThueKhauTru = parseMoneyToBigInt(rawCt26)
    
    let ct29_tongThueTncnDaKhauTru = parseMoneyToBigInt(rawCt29)
    let ct28_thueKhauTruCuTru: bigint = 0n
    let ct29_thueKhauTruKhongCuTru: bigint = 0n

    if (rawCt27) {
      ct29_tongThueTncnDaKhauTru = parseMoneyToBigInt(rawCt27)
      ct28_thueKhauTruCuTru = rawCt28 ? parseMoneyToBigInt(rawCt28) : ct29_tongThueTncnDaKhauTru
      ct29_thueKhauTruKhongCuTru = rawCt29 ? parseMoneyToBigInt(rawCt29) : 0n
    } else {
      if (rawCt28) ct28_thueKhauTruCuTru = parseMoneyToBigInt(rawCt28)
      if (rawCt30) ct29_thueKhauTruKhongCuTru = parseMoneyToBigInt(rawCt30)
      if (!rawCt28 && !rawCt30) {
        ct28_thueKhauTruCuTru = ct29_tongThueTncnDaKhauTru
        ct29_thueKhauTruKhongCuTru = 0n
      }
    }

    let ct31_qtt_tongThueDaKhauTruTrongNam: bigint | undefined
    let ct40_qtt_tongThuePhaiNopTrongNam: bigint | undefined
    let ct41_qtt_tongThueNopThua: bigint | undefined

    if (isFinalization) {
      const rawCt31Qtt = this.findTag(xmlContent, ['ct31', 'ct36_qtt_tongThueDaKhauTruTrongNam'])
      const rawCt40Qtt = this.findTag(xmlContent, ['ct40', 'ct41_qtt_tongThuePhaiNopTrongNam', 'ct40_tongThuePhaiNop'])
      const rawCt41Qtt = this.findTag(xmlContent, ['ct41', 'ct44_qtt_tongThueNopThua', 'ct41_tongThueNopThua'])

      if (rawCt31Qtt) ct31_qtt_tongThueDaKhauTruTrongNam = parseMoneyToBigInt(rawCt31Qtt)
      if (rawCt40Qtt) ct40_qtt_tongThuePhaiNopTrongNam = parseMoneyToBigInt(rawCt40Qtt)
      if (rawCt41Qtt) ct41_qtt_tongThueNopThua = parseMoneyToBigInt(rawCt41Qtt)
    }

    const submittedAt =
      this.findTag(xmlContent, ['ngayNop', 'ngayLap', 'ngayKy', 'ngayNopTKhai']) || undefined

    return {
      taxpayerId,
      taxpayerName,
      formCode: isFinalization ? '05/QTT-TNCN' : '05/KK-TNCN',
      period,
      declarationType,
      supplementalNo,
      isFinalization,
      submittedAt,
      sourceFile,
      ct16_tongSoNguoiLaoDong,
      ct21_tongThuNhapChiuThue,
      ct26_tongThuNhapChiuThueKhauTru,
      ct29_tongThueTncnDaKhauTru,
      ct28_thueKhauTruCuTru,
      ct29_thueKhauTruKhongCuTru,
      ct31_qtt_tongThueDaKhauTruTrongNam,
      ct40_qtt_tongThuePhaiNopTrongNam,
      ct41_qtt_tongThueNopThua,
    }
  }
}
