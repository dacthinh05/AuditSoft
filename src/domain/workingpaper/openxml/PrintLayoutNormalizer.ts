
export interface WorksheetPrintConfig {
  orientation?: 'landscape' | 'portrait'
  fitToWidth?: number
  fitToHeight?: number
  paperSize?: number // 9 = A4
  horizontalCentered?: boolean
  verticalCentered?: boolean
  gridLines?: boolean
  margins?: {
    left?: number
    right?: number
    top?: number
    bottom?: number
    header?: number
    footer?: number
  }
}

/**
 * Chuẩn lề in hẹp (Narrow Margins) chuyên dụng cho hồ sơ kiểm toán:
 * - Trái: 0.59 inch (~1.5 cm) -> chừa khoảng trống vừa đẹp để bấm 2 hoặc 3 lỗ đóng còng file hồ sơ mà không che khuất số liệu.
 * - Phải: 0.39 inch (~1.0 cm) -> tiết kiệm diện tích tối đa.
 * - Trên: 0.47 inch (~1.2 cm) -> vừa đủ cho header công ty kiểm toán.
 * - Dưới: 0.47 inch (~1.2 cm) -> vừa đủ cho footer đánh số trang.
 */
export const AUDIT_NARROW_MARGINS = {
  left: 0.59,
  right: 0.39,
  top: 0.47,
  bottom: 0.47,
  header: 0.3,
  footer: 0.3,
}

/**
 * Cấu hình chuẩn A4 Landscape cho toàn bộ bảng biểu dữ liệu kiểm toán
 */
export const DEFAULT_AUDIT_LANDSCAPE_CONFIG: WorksheetPrintConfig = {
  orientation: 'landscape',
  paperSize: 9, // A4
  fitToWidth: 1, // Khóa chiều ngang vừa khít 1 trang
  fitToHeight: 0, // Chiều dọc tự do theo số lượng dòng dữ liệu
  horizontalCentered: true,
  verticalCentered: false,
  gridLines: true, // Hiển thị đường kẻ ô khi in
  margins: AUDIT_NARROW_MARGINS,
}

/**
 * Cấu hình chuẩn A4 Portrait cho các biên bản/chương trình kiểm toán
 */
export const DEFAULT_AUDIT_PORTRAIT_CONFIG: WorksheetPrintConfig = {
  orientation: 'portrait',
  paperSize: 9, // A4
  fitToWidth: 1,
  fitToHeight: 0,
  horizontalCentered: true,
  verticalCentered: false,
  gridLines: true,
  margins: AUDIT_NARROW_MARGINS,
}

/**
 * Module chuẩn hóa OpenXML Worksheet XML theo chuẩn ECMA-376 Part 4:
 * Thứ tự các phần tử con bắt buộc của <worksheet>:
 * sheetPr -> dimension -> sheetViews -> sheetFormatPr -> cols -> sheetData ->
 * sheetProtection -> protectedRanges -> scenarios -> autoFilter -> sortState ->
 * dataConsolidate -> customSheetViews -> mergeCells -> phoneticPr ->
 * conditionalFormatting -> dataValidations -> hyperlinks -> printOptions ->
 * pageMargins -> pageSetup -> headerFooter -> rowBreaks -> colBreaks ->
 * customProperties -> cellWatches -> ignoredErrors -> smartTags -> drawing ->
 * legacyDrawing -> legacyDrawingHF -> picture -> oleObjects -> controls ->
 * webPublishItems -> tableParts -> extLst
 */
export class PrintLayoutNormalizer {
  /**
   * Chuẩn hóa XML của một worksheet
   */
  public static normalizeWorksheetXml(xml: string, config: WorksheetPrintConfig = DEFAULT_AUDIT_LANDSCAPE_CONFIG): string {
    let result = xml

    // 1. Cập nhật hoặc chèn <sheetPr> chứa <pageSetUpPr fitToPage="1"/>
    result = this.ensureFitToPageInSheetPr(result)

    // 2. Cập nhật hoặc chèn <printOptions>
    result = this.ensurePrintOptions(result, config)

    // 3. Cập nhật hoặc chèn <pageMargins>
    const margins = {
      left: config.margins?.left ?? AUDIT_NARROW_MARGINS.left,
      right: config.margins?.right ?? AUDIT_NARROW_MARGINS.right,
      top: config.margins?.top ?? AUDIT_NARROW_MARGINS.top,
      bottom: config.margins?.bottom ?? AUDIT_NARROW_MARGINS.bottom,
      header: config.margins?.header ?? AUDIT_NARROW_MARGINS.header,
      footer: config.margins?.footer ?? AUDIT_NARROW_MARGINS.footer,
    }
    result = this.ensurePageMargins(result, margins)

    // 4. Cập nhật hoặc chèn <pageSetup>
    result = this.ensurePageSetup(result, config)

    return result
  }

  /**
   * Đảm bảo <pageSetUpPr fitToPage="1"/> tồn tại trong <sheetPr>
   */
  private static ensureFitToPageInSheetPr(xml: string): string {
    const sheetPrMatch = xml.match(/<sheetPr\b([^>]*)>([\s\S]*?)<\/sheetPr>|<sheetPr\b([^>]*)\/>/)

    if (sheetPrMatch) {
      if (sheetPrMatch[0].endsWith('/>')) {
        // <sheetPr .../> -> đổi thành dạng thẻ mở/đóng có chứa <pageSetUpPr fitToPage="1"/>
        const attrs = sheetPrMatch[3] || ''
        const replacement = `<sheetPr${attrs}><pageSetUpPr fitToPage="1"/></sheetPr>`
        return xml.replace(sheetPrMatch[0], replacement)
      } else {
        // Dạng thẻ mở/đóng: kiểm tra xem đã có pageSetUpPr chưa
        const fullTag = sheetPrMatch[0]
        const inner = sheetPrMatch[2] || ''
        if (/<pageSetUpPr\b/.test(inner)) {
          // Đã có -> thay thế toàn bộ thẻ <pageSetUpPr.../> thành <pageSetUpPr fitToPage="1"/>
          const updatedInner = inner.replace(/<pageSetUpPr\b[^>]*\/?>/g, '<pageSetUpPr fitToPage="1"/>')
          return xml.replace(fullTag, `<sheetPr${sheetPrMatch[1] || ''}>${updatedInner}</sheetPr>`)
        } else {
          // Chưa có -> thêm vào đầu inner
          return xml.replace(fullTag, `<sheetPr${sheetPrMatch[1] || ''}><pageSetUpPr fitToPage="1"/>${inner}</sheetPr>`)
        }
      }
    } else {
      // Chưa có <sheetPr> -> chèn ngay sau thẻ mở <worksheet ...>
      const wsOpenMatch = xml.match(/<worksheet\b[^>]*>/)
      if (wsOpenMatch) {
        const wsOpen = wsOpenMatch[0]
        return xml.replace(wsOpen, `${wsOpen}<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>`)
      }
    }

    return xml
  }

  /**
   * Đảm bảo <printOptions horizontalCentered="1" gridLines="1"/>
   */
  private static ensurePrintOptions(xml: string, config: WorksheetPrintConfig): string {
    const hCenter = config.horizontalCentered ? ' horizontalCentered="1"' : ''
    const vCenter = config.verticalCentered ? ' verticalCentered="1"' : ''
    const gridLines = config.gridLines ? ' gridLines="1"' : ''
    const printOptionsTag = `<printOptions${gridLines}${hCenter}${vCenter}/>`

    if (/<printOptions\b[^>]*\/>/.test(xml)) {
      return xml.replace(/<printOptions\b[^>]*\/>/, printOptionsTag)
    }

    // Nếu chưa có, chèn trước <pageMargins> hoặc trước </worksheet>
    if (/<pageMargins\b/.test(xml)) {
      return xml.replace(/<pageMargins\b/, `${printOptionsTag}<pageMargins`)
    }

    return this.insertProperly(xml, printOptionsTag, ['pageMargins', 'pageSetup', 'headerFooter', 'drawing', 'legacyDrawing', 'picture', 'tableParts', 'extLst'])
  }

  /**
   * Đảm bảo <pageMargins left="..." right="..." top="..." bottom="..." header="..." footer="..."/>
   */
  private static ensurePageMargins(xml: string, margins: typeof AUDIT_NARROW_MARGINS): string {
    const marginsTag = `<pageMargins left="${margins.left}" right="${margins.right}" top="${margins.top}" bottom="${margins.bottom}" header="${margins.header}" footer="${margins.footer}"/>`

    if (/<pageMargins\b[^>]*\/>/.test(xml)) {
      return xml.replace(/<pageMargins\b[^>]*\/>/, marginsTag)
    }

    return this.insertProperly(xml, marginsTag, ['pageSetup', 'headerFooter', 'drawing', 'legacyDrawing', 'picture', 'tableParts', 'extLst'])
  }

  /**
   * Đảm bảo <pageSetup paperSize="9" fitToWidth="1" fitToHeight="0" orientation="landscape" .../>
   */
  private static ensurePageSetup(xml: string, config: WorksheetPrintConfig): string {
    const orientation = config.orientation || 'landscape'
    const paperSize = config.paperSize ?? 9
    const fitToWidth = config.fitToWidth ?? 1
    const fitToHeight = config.fitToHeight ?? 0

    // Kiểm tra xem đã có pageSetup chưa và giữ lại r:id nếu có
    const existingMatch = xml.match(/<pageSetup\b([^>]*)\/?>/)
    let rIdAttr = ''
    if (existingMatch) {
      const rIdMatch = existingMatch[1]?.match(/r:id="([^"]+)"/)
      if (rIdMatch) {
        rIdAttr = ` r:id="${rIdMatch[1]}"`
      }
    }

    const pageSetupTag = `<pageSetup paperSize="${paperSize}" fitToWidth="${fitToWidth}" fitToHeight="${fitToHeight}" orientation="${orientation}"${rIdAttr}/>`

    if (existingMatch) {
      return xml.replace(existingMatch[0], pageSetupTag)
    }

    return this.insertProperly(xml, pageSetupTag, ['headerFooter', 'drawing', 'legacyDrawing', 'picture', 'tableParts', 'extLst'])
  }

  /**
   * Chèn thẻ XML vào vị trí hợp lệ trước các thẻ kế tiếp theo thứ tự schema OpenXML
   */
  private static insertProperly(xml: string, tagToInsert: string, nextTagsPriority: string[]): string {
    for (const tagName of nextTagsPriority) {
      const regex = new RegExp(`<${tagName}\\b`)
      if (regex.test(xml)) {
        return xml.replace(regex, `${tagToInsert}<${tagName}`)
      }
    }

    // Nếu không tìm thấy các thẻ sau, chèn trước </worksheet>
    return xml.replace(/<\/worksheet>/, `${tagToInsert}</worksheet>`)
  }
}
export type SheetPrintOptions = WorksheetPrintConfig
