import type {
  AppendixMeta,
  DiffItem,
  Qtt03Document,
  Qtt03MainIndicators,
  QttPL03_1AData,
  QttPL03_2ARow,
  TaxGeneralInfo,
  XmlNode,
} from './types'
import { HeuristicMatcher } from './HeuristicMatcher'
/**
 * Bộ phân tích cú pháp XML chuyên dụng cho tờ khai thuế Việt Nam.
 * Chạy độc lập 100% trong cả Node.js (test/worker) và Browser (renderer).
 */
export class EtaxXmlParser {
  /**
   * Phân tích chuỗi XML thành cây XmlNode
   */
  public static parseXml(rawXml: string): XmlNode {
    // Loại bỏ BOM nếu có ở đầu chuỗi
    let cleanXml = rawXml.replace(/^\uFEFF/, '').trim()

    // Bỏ qua XML Declaration (<?xml ...?>)
    cleanXml = cleanXml.replace(/<\?xml[^>]*\?>/i, '').trim()

    // Bỏ qua comments (<!-- ... -->)
    cleanXml = cleanXml.replace(/<!--[\s\S]*?-->/g, '')

    const root: XmlNode = {
      tag: 'ROOT_CONTAINER',
      attributes: {},
      children: [],
      text: '',
    }

    const stack: XmlNode[] = [root]
    let pos = 0
    const len = cleanXml.length
    while (pos < len) {
      const nextOpen = cleanXml.indexOf('<', pos)
      if (nextOpen === -1) {
        // Phần text còn lại ở cuối
        const remainingText = cleanXml.slice(pos).trim()
        const top = stack[stack.length - 1]
        if (remainingText && stack.length > 1 && top) {
          top.text += EtaxXmlParser.unescapeXml(remainingText)
        }
        break
      }

      // Nếu có text trước thẻ mở
      if (nextOpen > pos) {
        const textContent = cleanXml.slice(pos, nextOpen).trim()
        const top = stack[stack.length - 1]
        if (textContent && stack.length > 1 && top) {
          top.text += EtaxXmlParser.unescapeXml(textContent)
        }
      }

      // Tìm thẻ đóng '>'
      const nextClose = cleanXml.indexOf('>', nextOpen)
      if (nextClose === -1) break

      const tagContent = cleanXml.slice(nextOpen + 1, nextClose).trim()

      if (tagContent.startsWith('/')) {
        // Thẻ đóng </tag>
        if (stack.length > 1) {
          stack.pop()
        }
      } else if (tagContent.endsWith('/')) {
        // Thẻ tự đóng <tag attr="val" />
        const selfClosingBody = tagContent.slice(0, -1).trim()
        const node = EtaxXmlParser.parseTagHeader(selfClosingBody)
        const top = stack[stack.length - 1]
        if (top) {
          node.parent = top
          top.children.push(node)
        }
      } else if (tagContent.startsWith('![CDATA[')) {
        // Xử lý CDATA
        const cdataEnd = cleanXml.indexOf(']]>', nextOpen)
        if (cdataEnd !== -1) {
          const cdataText = cleanXml.slice(nextOpen + 9, cdataEnd)
          const top = stack[stack.length - 1]
          if (stack.length > 1 && top) {
            top.text += cdataText
          }
          pos = cdataEnd + 3
          continue
        }
      } else {
        // Thẻ mở bình thường <tag attr="val">
        const node = EtaxXmlParser.parseTagHeader(tagContent)
        const top = stack[stack.length - 1]
        if (top) {
          node.parent = top
          top.children.push(node)
        }
        stack.push(node)
      }

      pos = nextClose + 1
    }

    const firstChild = root.children[0]
    if (!firstChild) {
      throw new Error('Tệp XML không hợp lệ: Không tìm thấy thẻ gốc.')
    }

    return firstChild
  }

  /**
   * Tách tên thẻ và các thuộc tính
   */
  private static parseTagHeader(tagHeader: string): XmlNode {
    const parts = tagHeader.trim().split(/\s+/)
    const rawTag = parts[0] || 'node'
    // Loại bỏ namespace prefix nếu có (ví dụ ns:tag -> tag)
    const tag = rawTag.includes(':') ? (rawTag.split(':')[1] || rawTag) : rawTag

    const attributes: Record<string, string> = {}
    const attrRegex = /([a-zA-Z0-9_:-]+)\s*=\s*["']([^"']*)["']/g
    let match: RegExpExecArray | null

    while ((match = attrRegex.exec(tagHeader)) !== null) {
      if (match[1] && match[2] !== undefined) {
        attributes[match[1]] = match[2]
      }
    }

    return {
      tag,
      attributes,
      children: [],
      text: '',
    }
  }

  /**
   * Giải mã các thực thể XML chuẩn
   */
  public static unescapeXml(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CÁC HÀM TIỆN ÍCH DUYỆT CÂY XML
  // ─────────────────────────────────────────────────────────────────────────────

  public static findChild(parent: XmlNode, tagName: string): XmlNode | null {
    const lower = tagName.toLowerCase()
    return parent.children.find((c) => c.tag.toLowerCase() === lower) || null
  }

  public static findChildren(parent: XmlNode, tagName: string): XmlNode[] {
    const lower = tagName.toLowerCase()
    return parent.children.filter((c) => c.tag.toLowerCase() === lower)
  }

  public static findDescendant(node: XmlNode, tagName: string): XmlNode | null {
    const lower = tagName.toLowerCase()
    if (node.tag.toLowerCase() === lower) return node
    for (const child of node.children) {
      const found = EtaxXmlParser.findDescendant(child, tagName)
      if (found) return found
    }
    return null
  }

  public static findDescendants(node: XmlNode, tagName: string): XmlNode[] {
    const lower = tagName.toLowerCase()
    const results: XmlNode[] = []
    if (node.tag.toLowerCase() === lower) results.push(node)
    for (const child of node.children) {
      results.push(...EtaxXmlParser.findDescendants(child, tagName))
    }
    return results
  }

  public static getNodeText(node?: XmlNode | null): string {
    return node ? node.text.trim() : ''
  }

  public static getNodeNumber(node?: XmlNode | null): number {
    if (!node) return 0
    const raw = node.text.trim().replace(/,/g, '')
    const num = parseFloat(raw)
    return isNaN(num) ? 0 : num
  }

  /**
   * Thu thập tất cả các thẻ lá (không có thẻ con) dưới dạng Map<tag, text>
   */
  public static findAllLeafTags(node: XmlNode, result = new Map<string, string>()): Map<string, string> {
    if (!node.children || node.children.length === 0) {
      if (node.text !== undefined && node.text.trim().length > 0) {
        result.set(node.tag, node.text.trim())
      }
      return result
    }
    for (const child of node.children) {
      EtaxXmlParser.findAllLeafTags(child, result)
    }
    return result
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHÂN TÍCH TỜ KHAI QUYẾT TOÁN THUẾ TNDN (03/TNDN)
  // ─────────────────────────────────────────────────────────────────────────────

  public static parseQtt03(xmlString: string): Qtt03Document {
    const root = EtaxXmlParser.parseXml(xmlString)

    // 1. Phân tích Thông tin chung <TTinChung>
    const generalInfo = EtaxXmlParser.parseGeneralInfo(root)

    // 2. Nhận diện phiên bản: TT151 (cũ) hay TT80 (mới)
    const pban = (generalInfo.pbanXml || '').toLowerCase()
    const moTa = EtaxXmlParser.getNodeText(EtaxXmlParser.findDescendant(root, 'moTaBMau'))
    const isTT80 =
      pban.startsWith('2.9') ||
      pban.includes('2.1.4') ||
      pban.includes('2.2') ||
      pban.includes('80') ||
      moTa.includes('80/2021') ||
      EtaxXmlParser.findDescendant(root, 'thueTNDN_SXKD') !== null ||
      EtaxXmlParser.findDescendant(root, 'thueTNDN_tamnop_sxkd') !== null

    const version = isTT80 ? 'TT80' : 'TT151'

    // 3. Phân tích Tờ khai chính
    const mainForm = EtaxXmlParser.parse03MainForm(root)

    // 4. Phân tích Phụ lục 03-1A/TNDN (Kết quả kinh doanh)
    const pl03_1a = EtaxXmlParser.parsePL03_1A(root)

    // 5. Phân tích Phụ lục 03-2A/TNDN (Chuyển lỗ)
    const pl03_2a = EtaxXmlParser.parsePL03_2A(root)

    // 6. Phân tích động toàn bộ danh sách phụ lục có trong <PLuc>
    const appendices = EtaxXmlParser.extractAllAppendices(root)

    return {
      version,
      generalInfo,
      mainForm,
      pl03_1a,
      pl03_2a,
      appendices,
      rawXmlTree: root,
    }
  }

  private static parseGeneralInfo(root: XmlNode): TaxGeneralInfo {
    const ttinChung = EtaxXmlParser.findDescendant(root, 'TTinChung') || root

    const maTKhai =
      EtaxXmlParser.getNodeText(EtaxXmlParser.findDescendant(ttinChung, 'maTKhai')) || '03/TNDN'
    const tenTKhai =
      EtaxXmlParser.getNodeText(EtaxXmlParser.findDescendant(ttinChung, 'tenTKhai')) ||
      'TỜ KHAI QUYẾT TOÁN THUẾ TNDN'
    const pbanXml =
      EtaxXmlParser.getNodeText(EtaxXmlParser.findDescendant(ttinChung, 'pbanTKhaiXML')) ||
      EtaxXmlParser.getNodeText(EtaxXmlParser.findDescendant(ttinChung, 'pbanXml')) ||
      '2.0.0'
    const loaiTKhaiRaw = EtaxXmlParser.getNodeText(EtaxXmlParser.findDescendant(ttinChung, 'loaiTKhai'))
    const loaiTKhai = loaiTKhaiRaw === 'B' ? 'B' : 'C'

    const mst = EtaxXmlParser.getNodeText(EtaxXmlParser.findDescendant(ttinChung, 'mst'))
    const tenNNT = EtaxXmlParser.getNodeText(EtaxXmlParser.findDescendant(ttinChung, 'tenNNT'))
    const dchiNNT = EtaxXmlParser.getNodeText(EtaxXmlParser.findDescendant(ttinChung, 'dchiNNT'))
    const ngayNop =
      EtaxXmlParser.getNodeText(EtaxXmlParser.findDescendant(ttinChung, 'ngayLapTKhai')) ||
      EtaxXmlParser.getNodeText(EtaxXmlParser.findDescendant(ttinChung, 'ngayNop'))

    const cqtNoiNop = {
      maCQT:
        EtaxXmlParser.getNodeText(EtaxXmlParser.findDescendant(ttinChung, 'maCQTNoiNop')) ||
        EtaxXmlParser.getNodeText(EtaxXmlParser.findDescendant(ttinChung, 'maCQT')),
      tenCQT:
        EtaxXmlParser.getNodeText(EtaxXmlParser.findDescendant(ttinChung, 'tenCQTNoiNop')) ||
        EtaxXmlParser.getNodeText(EtaxXmlParser.findDescendant(ttinChung, 'tenCQT')),
    }

    const kyKKhaiTuNgay =
      EtaxXmlParser.getNodeText(EtaxXmlParser.findDescendant(ttinChung, 'kyKKhaiTuNgay')) ||
      EtaxXmlParser.getNodeText(EtaxXmlParser.findDescendant(ttinChung, 'kyTaiChinh_Tu')) ||
      '01/01'
    const kyKKhaiDenNgay =
      EtaxXmlParser.getNodeText(EtaxXmlParser.findDescendant(ttinChung, 'kyKKhaiDenNgay')) ||
      EtaxXmlParser.getNodeText(EtaxXmlParser.findDescendant(ttinChung, 'kyTaiChinh_Den')) ||
      '31/12'
    const kieuKyRaw =
      EtaxXmlParser.getNodeText(EtaxXmlParser.findDescendant(ttinChung, 'kieuKy')) || 'Y'
    const kieuKy = kieuKyRaw === 'Q' || kieuKyRaw === 'M' ? kieuKyRaw : 'N'

    return {
      maTKhai,
      tenTKhai,
      pbanXml,
      loaiTKhai,
      mst,
      tenNNT,
      dchiNNT,
      ngayNop,
      cqtNoiNop,
      kyKKhai: {
        kieuKy: kieuKy as 'N' | 'Q' | 'M',
        kyKKhaiTuNgay,
        kyKKhaiDenNgay,
      },
    }
  }

  private static parse03MainForm(root: XmlNode): Qtt03MainIndicators {
    // Hàm phụ tìm giá trị của chỉ tiêu theo nhiều mẫu tag khác nhau (cả ctA1, ctB1, lẫn maCTieu)
    const getVal = (code: string): number => {
      // 1. Thử tìm thẻ <ctXX>
      const directTag = EtaxXmlParser.findDescendant(root, `ct${code}`)
      if (directTag && directTag.text.trim()) {
        return EtaxXmlParser.getNodeNumber(directTag)
      }

      // 2. Thử tìm thẻ có thuộc tính maSo="XX" hoặc maCTieu="XX"
      const allNodes = EtaxXmlParser.findDescendants(root, 'ct')
      for (const node of allNodes) {
        if (
          node.attributes['maSo'] === code ||
          node.attributes['maCTieu'] === code ||
          node.attributes['ma'] === code
        ) {
          return EtaxXmlParser.getNodeNumber(node)
        }
      }

      return 0
    }

    return {
      // Nhóm A
      ctA1: getVal('A1'),

      // Nhóm B
      ctB1: getVal('B1'),
      ctB2: getVal('B2'),
      ctB3: getVal('B3'),
      ctB4: getVal('B4'),
      ctB5: getVal('B5'),
      ctB6: getVal('B6'),
      ctB7: getVal('B7'),
      ctB8: getVal('B8'),
      ctB9: getVal('B9'),
      ctB10: getVal('B10'),
      ctB11: getVal('B11'),
      ctB12: getVal('B12'),
      ctB13: getVal('B13'),
      ctB14: getVal('B14'),

      // Nhóm C
      ctC1: getVal('C1'),
      ctC2: getVal('C2'),
      ctC3: getVal('C3'),
      ctC3a: getVal('C3a'),
      ctC3b: getVal('C3b'),
      ctC4: getVal('C4'),
      ctC5: getVal('C5'),
      ctC6: getVal('C6'),
      ctC7: getVal('C7') || getVal('C7_thuNhap'),
      ctC8: getVal('C8'),
      ctC9: getVal('C9'),
      ctC10: getVal('C10'),
      ctC11: getVal('C11'),
      ctC12: getVal('C12'),
      ctC13: getVal('C13'),
      ctC14: getVal('C14'),
      ctC15: getVal('C15'),
      ctC16: getVal('C16'),

      // Nhóm D
      ctD1: getVal('D1'),
      ctD2: getVal('D2'),
      ctD3: getVal('D3'),
      ctD4: getVal('D4'),
      ctD5: getVal('D5'),
      ctD6: getVal('D6'),
      ctD7: getVal('D7'),
      ctD8: getVal('D8'),

      // Nhóm E
      ctE1: getVal('E1'),
      ctE2: getVal('E2'),
      ctE3: getVal('E3'),
      ctE4: getVal('E4'),

      // Nhóm G
      ctG1: getVal('G1'),
      ctG2: getVal('G2'),
    }
  }

  private static parsePL03_1A(root: XmlNode): QttPL03_1AData | undefined {
    // Tìm node phụ lục 03-1A
    const plNode =
      EtaxXmlParser.findDescendant(root, 'PLuc_03_1A_TNDN') ||
      EtaxXmlParser.findDescendant(root, 'PL03_1A_TNDN') ||
      EtaxXmlParser.findDescendant(root, 'PL03_1A') ||
      EtaxXmlParser.findDescendant(root, 'BangKe_03_1A')
    if (!plNode) return undefined

    const getVal = (codeStr: string): number => {
      // 1. Thử <ctXX>
      const direct = EtaxXmlParser.findDescendant(plNode, `ct${codeStr}`)
      if (direct && direct.text.trim()) {
        return EtaxXmlParser.getNodeNumber(direct)
      }
      // 2. Thử <cXX>
      const cTag = EtaxXmlParser.findDescendant(plNode, `c${codeStr}`)
      if (cTag && cTag.text.trim()) {
        return EtaxXmlParser.getNodeNumber(cTag)
      }
      return 0
    }

    return {
      ct01: getVal('01'),
      ct02: getVal('02'),
      ct03: getVal('03'),
      ct04: getVal('04'),
      ct05: getVal('05'),
      ct06: getVal('06'),
      ct07: getVal('07'),
      ct08: getVal('08'),
      ct09: getVal('09'),
      ct10: getVal('10'),
      ct11: getVal('11'),
      ct12: getVal('12'),
      ct13: getVal('13'),
      ct14: getVal('14'),
      ct15: getVal('15'),
      ct16: getVal('16'),
      ct17: getVal('17'),
      ct18: getVal('18'),
      ct19: getVal('22') || getVal('19'),
    }
  }

  private static parsePL03_2A(root: XmlNode): QttPL03_2ARow[] | undefined {
    const plNode =
      EtaxXmlParser.findDescendant(root, 'PLuc_03_2A_TNDN') ||
      EtaxXmlParser.findDescendant(root, 'PL03_2A_TNDN') ||
      EtaxXmlParser.findDescendant(root, 'PL03_2A') ||
      EtaxXmlParser.findDescendant(root, 'BangKe_03_2A')
    if (!plNode) return undefined
    let rowNodes = EtaxXmlParser.findDescendants(plNode, 'Dong')
    if (rowNodes.length === 0) {
      rowNodes = EtaxXmlParser.findDescendants(plNode, 'chiTietChuyenLo')
    }
    if (rowNodes.length === 0) return []

    return rowNodes.map((row, index) => {
      const namPS =
        EtaxXmlParser.getNodeNumber(EtaxXmlParser.findChild(row, 'namPhatSinh')) ||
        EtaxXmlParser.getNodeNumber(EtaxXmlParser.findChild(row, 'namPS')) ||
        EtaxXmlParser.getNodeNumber(EtaxXmlParser.findChild(row, 'nam')) ||
        0

      const soLoPS =
        EtaxXmlParser.getNodeNumber(EtaxXmlParser.findChild(row, 'soLoPhatSinh')) ||
        EtaxXmlParser.getNodeNumber(EtaxXmlParser.findChild(row, 'soLoPS')) ||
        0

      const soLoDaChuyen =
        EtaxXmlParser.getNodeNumber(EtaxXmlParser.findChild(row, 'soLoDaChuyen')) || 0

      const soLoChuyenKyNay =
        EtaxXmlParser.getNodeNumber(EtaxXmlParser.findChild(row, 'soLoChuyenKyNay')) ||
        EtaxXmlParser.getNodeNumber(EtaxXmlParser.findChild(row, 'soLoChuyen')) ||
        0

      const soLoConLai =
        EtaxXmlParser.getNodeNumber(EtaxXmlParser.findChild(row, 'soLoConLai')) ||
        soLoPS - soLoDaChuyen - soLoChuyenKyNay

      return {
        stt: index + 1,
        namPhatSinh: namPS,
        soLoPhatSinh: soLoPS,
        soLoDaChuyen: soLoDaChuyen,
        soLoChuyenKyNay: soLoChuyenKyNay,
        soLoConLai: soLoConLai,
      }
    })
  }

  /**
   * Trích xuất động toàn bộ các phụ lục có trong thẻ <PLuc>
   */
  public static extractAllAppendices(root: XmlNode): AppendixMeta[] {
    const plucNode = EtaxXmlParser.findDescendant(root, 'PLuc')
    if (!plucNode || !plucNode.children) return []

    const list: AppendixMeta[] = []
    for (const child of plucNode.children) {
      const leafTags = EtaxXmlParser.findAllLeafTags(child)
      const diffs: DiffItem[] = []
      for (const [tag, val] of leafTags.entries()) {
        const numVal = parseFloat(val.replace(/,/g, ''))
        const valNum = isNaN(numVal) ? 0 : numVal
        diffs.push({
          code: tag,
          name: HeuristicMatcher.getIndicatorName(tag),
          oldValue: valNum,
          newValue: valNum,
          variance: 0,
          status: 'MATCHED',
        })
      }

      list.push({
        tag: child.tag,
        name: HeuristicMatcher.getAppendixTitle(child.tag),
        fieldCount: leafTags.size,
        diffs,
      })
    }
    return list
  }
}