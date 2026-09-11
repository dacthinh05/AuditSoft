import AdmZip from 'adm-zip'
import fs from 'node:fs'
import path from 'node:path'
import type { EngagementInfo } from '../types'
import { formatDateVN } from '../helpers'

/** Chuyển đổi tên cột (A, B, ..., Z, AA, AB...) thành chỉ số 1-based (1, 2, ..., 26, 27, 28...) */
export function colLetterToIndex(colStr: string): number {
  let idx = 0
  const upper = colStr.toUpperCase()
  for (let i = 0; i < upper.length; i++) {
    idx = idx * 26 + (upper.charCodeAt(i) - 64)
  }
  return idx
}

/** Chuyển đổi chỉ số 1-based thành tên cột (1 -> A, 2 -> B, 26 -> Z, 27 -> AA...) */
export function indexToColLetter(colIdx: number): string {
  let letter = ''
  let temp = colIdx
  while (temp > 0) {
    const rem = (temp - 1) % 26
    letter = String.fromCharCode(65 + rem) + letter
    temp = Math.floor((temp - 1) / 26)
  }
  return letter
}

export function parseCellRef(ref: string): { col: string; row: number; colIdx: number } {
  const m = /^([A-Za-z]+)(\d+)$/.exec(ref)
  if (!m || !m[1] || !m[2]) {
    throw new Error(`Tọa độ ô không hợp lệ: ${ref}`)
  }
  const col = m[1].toUpperCase()
  const row = parseInt(m[2], 10)
  return { col, row, colIdx: colLetterToIndex(col) }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function normalizeSheetKey(name: string): string {
  return name.toLowerCase().replace(/[\s_\-.]/g, '')
}

export class OpenXmlPackageEditor {
  private zip: AdmZip
  private sheetPathMap: Map<string, string> // normalizedKey -> 'xl/worksheets/sheetN.xml'
  private sheetCache: Map<string, string> // 'xl/worksheets/sheetN.xml' -> xmlContent
  private modifiedPaths: Set<string>

  private constructor(templatePath: string) {
    if (!fs.existsSync(templatePath)) {
      throw new Error(`File mẫu không tồn tại: ${templatePath}`)
    }
    this.zip = new AdmZip(templatePath)
    this.sheetPathMap = new Map()
    this.sheetCache = new Map()
    this.modifiedPaths = new Set()
    this.initSheetMap()
  }

  public static load(templatePath: string): OpenXmlPackageEditor {
    return new OpenXmlPackageEditor(templatePath)
  }

  private initSheetMap(): void {
    const wbXml = this.zip.readAsText('xl/workbook.xml')
    const relsXml = this.zip.readAsText('xl/_rels/workbook.xml.rels')

    // 1. Map rId -> target file (e.g. rId4 -> 'worksheets/sheet4.xml')
    const relMatches = [...relsXml.matchAll(/<Relationship[^>]*Target="([^"]+)"[^>]*Id="([^"]+)"|<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)]
    const relMap = new Map<string, string>()
    for (const m of relMatches) {
      const id = m[2] || m[3]
      const target = (m[1] || m[4] || '').replace(/^\//, '').replace(/^xl\//, '')
      if (id && target) {
        relMap.set(id, target)
      }
    }

    // 2. Map sheetName -> full zip path
    const sheetMatches = [...wbXml.matchAll(/<sheet[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"|<sheet[^>]*r:id="([^"]+)"[^>]*name="([^"]+)"/g)]
    for (const m of sheetMatches) {
      const name = m[1] || m[4]
      const rId = m[2] || m[3]
      if (name && rId) {
        const target = relMap.get(rId)
        if (target) {
          const zipPath = 'xl/' + target
          this.sheetPathMap.set(normalizeSheetKey(name), zipPath)
        }
      }
    }
  }

  public resolveSheetPath(sheetName: string): string | undefined {
    const norm = normalizeSheetKey(sheetName)
    if (this.sheetPathMap.has(norm)) {
      return this.sheetPathMap.get(norm)
    }
    for (const [key, p] of this.sheetPathMap.entries()) {
      if (key.startsWith(norm) || norm.startsWith(key)) {
        return p
      }
    }
    return undefined
  }

  public hasSheet(sheetName: string): boolean {
    return this.resolveSheetPath(sheetName) !== undefined
  }

  private getSheetXml(zipPath: string): string {
    let xml = this.sheetCache.get(zipPath)
    if (!xml) {
      xml = this.zip.readAsText(zipPath)
      this.sheetCache.set(zipPath, xml)
    }
    return xml
  }

  private setSheetXml(zipPath: string, xml: string): void {
    this.sheetCache.set(zipPath, xml)
    this.modifiedPaths.add(zipPath)
  }

  /**
   * Cập nhật một ô tính trong sheet XML, bảo toàn style `s="..."` và công thức `f`
   */
  public updateCell(
    sheetName: string,
    cellRef: string,
    value: { number?: number; text?: string; date?: unknown; formula?: string; styleId?: number | string },
  ): void {
    const zipPath = this.resolveSheetPath(sheetName)
    if (!zipPath) return

    let xml = this.getSheetXml(zipPath)
    const { col, row, colIdx } = parseCellRef(cellRef)
    const cellTag = `${col}${row}`

    // 1. Tìm hoặc tạo <row r="row">
    const rowRegex = new RegExp(`(<row[^>]*r="${row}"[^>]*>)([\\s\\S]*?)(<\\/row>)`, 'i')
    const rowMatch = rowRegex.exec(xml)

    if (rowMatch && rowMatch[1] && rowMatch[2] !== undefined && rowMatch[3]) {
      let rowContent = rowMatch[2]

      // 2. Tìm ô tính <c r="cellTag"...> trong hàng
      const cellRegex = new RegExp(`(<c[^>]*r="${cellTag}"[^>]*>)([\\s\\S]*?)(<\\/c>)|(<c[^>]*r="${cellTag}"[^>]*\\/>)`, 'i')
      const cellMatch = cellRegex.exec(rowContent)

      if (cellMatch) {
        const fullCellTag = cellMatch[1] || cellMatch[4] || ''
        const innerContent = cellMatch[2] || ''

        // Trích xuất style `s="..."` hiện hữu nếu có
        const sMatch = /s="([^"]+)"/.exec(fullCellTag)
        let sAttr = sMatch ? ` s="${sMatch[1]}"` : ''
        if (!sAttr && value.styleId !== undefined) {
          sAttr = ` s="${value.styleId}"`
        } else if (!sAttr && value.number !== undefined) {
          sAttr = ' s="164"'
        }

        // Kiểm tra xem ô có công thức <f>...</f> không
        const fMatch = /<f[^>]*>[\s\S]*?<\/f>/.exec(innerContent)
        let fTag = value.formula ? `<f>${value.formula}</f>` : fMatch ? fMatch[0] : ''
        if (fTag.includes('#REF!')) {
          fTag = fTag.replace('#REF!', 'E29')
        }
        let newCellXml = ''
        if (value.number !== undefined && value.number !== null) {
          const numVal = isNaN(value.number) ? 0 : value.number
          newCellXml = `<c r="${cellTag}"${sAttr}>${fTag}<v>${numVal}</v></c>`
        } else if (value.text !== undefined && value.text !== null) {
          const escText = escapeXml(String(value.text))
          newCellXml = `<c r="${cellTag}" t="inlineStr"${sAttr}>${fTag}<is><t xml:space="preserve">${escText}</t></is></c>`
        } else if (value.date !== undefined && value.date !== null) {
          const dateStr = formatDateVN(value.date)
          const escText = escapeXml(dateStr)
          newCellXml = `<c r="${cellTag}" t="inlineStr"${sAttr}>${fTag}<is><t xml:space="preserve">${escText}</t></is></c>`
        }

        rowContent = rowContent.replace(cellMatch[0], newCellXml)
      } else {
        // Ô chưa có trong hàng -> chèn vào hàng theo đúng thứ tự cột OpenXML
        const sAttr = value.styleId !== undefined ? ` s="${value.styleId}"` : value.number !== undefined ? ' s="164"' : ''
        let newCellXml = ''
        if (value.number !== undefined && value.number !== null) {
          const numVal = isNaN(value.number) ? 0 : value.number
          newCellXml = `<c r="${cellTag}"${sAttr}><v>${numVal}</v></c>`
        } else if (value.text !== undefined && value.text !== null) {
          const escText = escapeXml(String(value.text))
          newCellXml = `<c r="${cellTag}" t="inlineStr"${sAttr}><is><t xml:space="preserve">${escText}</t></is></c>`
        } else if (value.date !== undefined && value.date !== null) {
          const dateStr = formatDateVN(value.date)
          const escText = escapeXml(dateStr)
          newCellXml = `<c r="${cellTag}" t="inlineStr"${sAttr}><is><t xml:space="preserve">${escText}</t></is></c>`
        }

        rowContent = this.insertCellIntoRowContent(rowContent, row, colIdx, newCellXml)
      }

      xml = xml.replace(rowMatch[0], `${rowMatch[1]}${rowContent}${rowMatch[3]}`)
    } else {
      // Hàng chưa có -> tạo hàng mới và chèn vào <sheetData>
      const sAttr = value.styleId !== undefined ? ` s="${value.styleId}"` : value.number !== undefined ? ' s="164"' : ''
      let newCellXml = ''
      if (value.number !== undefined && value.number !== null) {
        const numVal = isNaN(value.number) ? 0 : value.number
        newCellXml = `<c r="${cellTag}"${sAttr}><v>${numVal}</v></c>`
      } else if (value.text !== undefined && value.text !== null) {
        const escText = escapeXml(String(value.text))
        newCellXml = `<c r="${cellTag}" t="inlineStr"${sAttr}><is><t xml:space="preserve">${escText}</t></is></c>`
      } else if (value.date !== undefined && value.date !== null) {
        const dateStr = formatDateVN(value.date)
        const escText = escapeXml(dateStr)
        newCellXml = `<c r="${cellTag}" t="inlineStr"${sAttr}><is><t xml:space="preserve">${escText}</t></is></c>`
      }

      const newRowXml = `<row r="${row}">${newCellXml}</row>`
      xml = this.insertRowIntoSheetData(xml, row, newRowXml)
    }

    this.setSheetXml(zipPath, xml)
  }

  private insertCellIntoRowContent(rowContent: string, rowNum: number, targetColIdx: number, newCellXml: string): string {
    const cRegex = /<c[^>]*r="([A-Za-z]+)\d+"[^>]*>/g
    let match: RegExpExecArray | null
    let insertPos = -1

    while ((match = cRegex.exec(rowContent)) !== null) {
      const colLetter = match[1]
      if (colLetter) {
        const colIdx = colLetterToIndex(colLetter)
        if (colIdx > targetColIdx) {
          insertPos = match.index
          break
        }
      }
    }

    if (insertPos >= 0) {
      return rowContent.slice(0, insertPos) + newCellXml + rowContent.slice(insertPos)
    }
    return rowContent + newCellXml
  }

  private insertRowIntoSheetData(sheetXml: string, targetRow: number, newRowXml: string): string {
    const sheetDataRegex = /(<sheetData[^>]*>)([\s\S]*?)(<\/sheetData>)/i
    const sdMatch = sheetDataRegex.exec(sheetXml)
    if (!sdMatch || !sdMatch[1] || sdMatch[2] === undefined || !sdMatch[3]) {
      return sheetXml
    }

    const rowsContent = sdMatch[2]
    const rRegex = /<row[^>]*r="(\d+)"[^>]*>/g
    let match: RegExpExecArray | null
    let insertPos = -1

    while ((match = rRegex.exec(rowsContent)) !== null) {
      const rNum = parseInt(match[1] || '0', 10)
      if (rNum > targetRow) {
        insertPos = match.index
        break
      }
    }

    let updatedRowsContent = ''
    if (insertPos >= 0) {
      updatedRowsContent = rowsContent.slice(0, insertPos) + newRowXml + rowsContent.slice(insertPos)
    } else {
      updatedRowsContent = rowsContent + newRowXml
    }

    return sheetXml.replace(sdMatch[0], `${sdMatch[1]}${updatedRowsContent}${sdMatch[3]}`)
  }

  // ══════════════════════════════════════════════════════════════════════
  // HIGH-LEVEL WORKING PAPER HELPERS
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Điền Lead Schedule row (Cột 4: Số trước KT, Cột 7: Số đầu kỳ)
   * Không chạm Cột 5 (AJE) và Cột 6 (Sau KT) để bảo toàn 100% công thức mẫu!
   */
  public setLeadRowValues(
    sheetName: string,
    rowNum: number,
    options: {
      ck: number
      dk: number
      adj?: number
      tk?: string
      ten?: string
      colTk?: number
      colTen?: number
      colCk?: number
      colDk?: number
      colAdj?: number
    },
  ): void {
    const colCkLetter = indexToColLetter(options.colCk ?? 4)
    const colDkLetter = indexToColLetter(options.colDk ?? 7)

    if (options.tk) {
      const colTkLetter = indexToColLetter(options.colTk ?? 1)
      this.updateCell(sheetName, `${colTkLetter}${rowNum}`, { text: options.tk })
    }
    if (options.ten) {
      const colTenLetter = indexToColLetter(options.colTen ?? 2)
      this.updateCell(sheetName, `${colTenLetter}${rowNum}`, { text: options.ten })
    }

    // Cột Số trước KT (D)
    this.updateCell(sheetName, `${colCkLetter}${rowNum}`, { number: options.ck })
    // Cột Số đầu kỳ (G)
    this.updateCell(sheetName, `${colDkLetter}${rowNum}`, { number: options.dk })

    // Cột Điều chỉnh thuần (E)
    if (options.adj !== undefined) {
      const colAdjLetter = indexToColLetter(options.colAdj ?? 5)
      this.updateCell(sheetName, `${colAdjLetter}${rowNum}`, { number: options.adj })
    }
  }

  /**
   * Điền Sheet ADD (Thông tin khách hàng & Niên độ)
   */
  public fillAddSheet(engagement: EngagementInfo): void {
    if (!this.hasSheet('ADD')) return
    const yearStr = (engagement?.fiscalYearEnd || '2026').slice(-4) || '2026'

    // J2 & A1: Khách hàng
    this.updateCell('ADD', 'J2', { text: engagement.clientName })
    this.updateCell('ADD', 'A1', { text: `Khách hàng: ${engagement.clientName}` })

    // A2: Ngày khóa sổ
    this.updateCell('ADD', 'A2', { text: `Ngày khóa sổ:          31 / 12 / ${yearStr}` })
    // A3: Đợt 1
    const rawP1 = engagement.auditPeriod1?.replace(/^Đợt 1:\s*/i, '').trim() || `01/01 - 30/06/${yearStr}`
    this.updateCell('ADD', 'A3', { text: `Đợt 1:             ${rawP1}` })
    // A4: Đợt 2
    const rawP2 = engagement.auditPeriod2?.replace(/^Đợt 2:\s*/i, '').trim() || `01/07 - 31/12/${yearStr}`
    this.updateCell('ADD', 'A4', { text: `Đợt 2:             ${rawP2}` })

    // G3 & K3: Người thực hiện
    if (engagement.auditorName) {
      this.updateCell('ADD', 'G3', { text: engagement.auditorName })
      this.updateCell('ADD', 'K3', { text: engagement.auditorName })
    }

    // F1 & G1: Công ty kiểm toán
    if (engagement.auditFirmName) {
      this.updateCell('ADD', 'F1', { text: engagement.auditFirmName })
      this.updateCell('ADD', 'G1', { text: engagement.auditFirmName })
    }
  }

  /**
   * Điền một hàng nhiều ô tính bắt đầu từ cột startCol (1-based, mặc định 1 = A)
   */
  public fillRow(
    sheetName: string,
    rowNum: number,
    cells: Array<{ number?: number; text?: string; date?: unknown } | number | string | null | undefined>,
    startCol = 1,
  ): void {
    cells.forEach((cellVal, idx) => {
      if (cellVal === null || cellVal === undefined) return
      const colLetter = indexToColLetter(startCol + idx)
      const cellRef = `${colLetter}${rowNum}`

      if (typeof cellVal === 'number') {
        this.updateCell(sheetName, cellRef, { number: cellVal })
      } else if (typeof cellVal === 'string') {
        this.updateCell(sheetName, cellRef, { text: cellVal })
      } else {
        this.updateCell(sheetName, cellRef, cellVal)
      }
    })
  }

  /**
   * Đảm bảo độ rộng cột tối thiểu (ví dụ cột Ngày tháng cần tối thiểu 13 ký tự để không bị cắt cụt)
   */
  public ensureColumnWidth(sheetName: string, colIndex: number, minWidth = 13): void {
    const sheetXml = this.getSheetXml(sheetName)
    if (!sheetXml) return

    const colRegex = new RegExp(`<col[^>]*min="${colIndex}"[^>]*max="${colIndex}"[^>]*>`, 'i')
    const match = colRegex.exec(sheetXml)
    if (match) {
      const wMatch = /width="([^"]+)"/.exec(match[0])
      const currWidth = wMatch && wMatch[1] ? parseFloat(wMatch[1]) : 0
      if (currWidth < minWidth) {
        let updatedCol = match[0]
        if (/width="[^"]+"/.test(updatedCol)) {
          updatedCol = updatedCol.replace(/width="[^"]+"/, `width="${minWidth}"`)
        } else {
          updatedCol = updatedCol.replace('/>', ` width="${minWidth}" customWidth="1"/>`)
        }
        if (!/customWidth="[^"]+"/.test(updatedCol)) {
          updatedCol = updatedCol.replace('/>', ' customWidth="1"/>')
        }
        this.setSheetXml(sheetName, sheetXml.replace(match[0], updatedCol))
      }
      return
    }

    if (sheetXml.includes('<cols>')) {
      const newColTag = `<col min="${colIndex}" max="${colIndex}" width="${minWidth}" customWidth="1"/>`
      this.setSheetXml(sheetName, sheetXml.replace('<cols>', `<cols>${newColTag}`))
      return
    }

    if (sheetXml.includes('<sheetData')) {
      const colsTag = `<cols><col min="${colIndex}" max="${colIndex}" width="${minWidth}" customWidth="1"/></cols>`
      this.setSheetXml(sheetName, sheetXml.replace('<sheetData', `${colsTag}<sheetData`))
    }
  }

  /**
   * Điền một dòng chứng từ chọn mẫu (dùng cho D191, D595, D690, E291, G490...)
   * Thứ tự chuẩn VACPA: 1. Ngày | 2. Số CT | 3. Nội dung | 4. TK NỢ | 5. TK CÓ | 6. Số PS
   */
  public fillSampleRow(
    sheetName: string,
    rowNum: number,
    item: {
      date?: unknown
      docNo?: string
      desc?: string
      amount?: number
      debit?: string
      credit?: string
      colOffset?: number // mặc định bắt đầu từ Col 1 (A)
    },
  ): void {
    const offset = item.colOffset ?? 1
    if (item.date !== undefined) {
      this.ensureColumnWidth(sheetName, offset, 13)
      this.updateCell(sheetName, `${indexToColLetter(offset)}${rowNum}`, { date: item.date })
    }
    if (item.docNo !== undefined) {
      this.updateCell(sheetName, `${indexToColLetter(offset + 1)}${rowNum}`, { text: item.docNo })
    }
    if (item.desc !== undefined) {
      this.updateCell(sheetName, `${indexToColLetter(offset + 2)}${rowNum}`, { text: item.desc })
    }
    // ĐÚNG THỨ TỰ KẾ TOÁN CHUẨN MỰC VACPA:
    // Cột 4: TK NỢ
    if (item.debit !== undefined) {
      this.updateCell(sheetName, `${indexToColLetter(offset + 3)}${rowNum}`, { text: item.debit })
    }
    // Cột 5: TK CÓ
    if (item.credit !== undefined) {
      this.updateCell(sheetName, `${indexToColLetter(offset + 4)}${rowNum}`, { text: item.credit })
    }
    // Cột 6: SỐ TIỀN / Số PS (format số tiền kế toán)
    if (item.amount !== undefined) {
      this.updateCell(sheetName, `${indexToColLetter(offset + 5)}${rowNum}`, { number: item.amount })
    }
  }

  /**
   * Điền bảng phân tích đối ứng 2 bên (Nợ & Có) kèm W/P Ref cho D390, E290...
   */
  public fillCounterpartTable(
    sheetName: string,
    startRow: number,
    maxRows: number,
    result: {
      debitItems: Array<{ ref: string; account: string; amount: number }>
      creditItems: Array<{ ref: string; account: string; amount: number }>
    },
    opts?: {
      colRefDebit?: number
      colAccDebit?: number
      colAmtDebit?: number
      colRefCredit?: number
      colAccCredit?: number
      colAmtCredit?: number
    },
  ): void {
    const colRefD = indexToColLetter(opts?.colRefDebit ?? 1)
    const colAccD = indexToColLetter(opts?.colAccDebit ?? 2)
    const colAmtD = indexToColLetter(opts?.colAmtDebit ?? 3)

    const colRefC = indexToColLetter(opts?.colRefCredit ?? 5)
    const colAccC = indexToColLetter(opts?.colAccCredit ?? 6)
    const colAmtC = indexToColLetter(opts?.colAmtCredit ?? 7)

    for (let i = 0; i < maxRows; i++) {
      const r = startRow + i
      const dItem = result.debitItems[i]
      if (dItem) {
        this.updateCell(sheetName, `${colRefD}${r}`, { text: dItem.ref })
        this.updateCell(sheetName, `${colAccD}${r}`, { text: dItem.account })
        this.updateCell(sheetName, `${colAmtD}${r}`, { number: dItem.amount })
      } else {
        this.updateCell(sheetName, `${colRefD}${r}`, { text: '' })
        this.updateCell(sheetName, `${colAccD}${r}`, { text: '' })
        this.updateCell(sheetName, `${colAmtD}${r}`, { number: 0 })
      }

      const cItem = result.creditItems[i]
      if (cItem) {
        this.updateCell(sheetName, `${colRefC}${r}`, { text: cItem.ref })
        this.updateCell(sheetName, `${colAccC}${r}`, { text: cItem.account })
        this.updateCell(sheetName, `${colAmtC}${r}`, { number: cItem.amount })
      } else {
        this.updateCell(sheetName, `${colRefC}${r}`, { text: '' })
        this.updateCell(sheetName, `${colAccC}${r}`, { text: '' })
        this.updateCell(sheetName, `${colAmtC}${r}`, { number: 0 })
      }
    }
  }

  /**
   * Điền danh sách bút toán điều chỉnh AJE vào sheet x41 hoặc CHITIETDC
   */
  public fillAjeSheet(
    sheetName: string,
    startRow: number,
    maxRows: number,
    entries: Array<{
      stt: number
      glvRef: string
      noiDung: string
      tkNo: string
      tkCo: string
      soTien: number
      chiTieuCdkt?: string
    }>,
    defaultBsName = 'Tài sản',
  ): number {
    let filled = 0
    const count = Math.min(entries.length, maxRows)
    for (let i = 0; i < count; i++) {
      const aje = entries[i]
      if (!aje) continue
      const r = startRow + i
      const isDebitAsset =
        aje.tkNo.startsWith('1') || aje.tkNo.startsWith('2')
      const impactVal = isDebitAsset ? aje.soTien : -aje.soTien

      this.updateCell(sheetName, `A${r}`, { text: String(i + 1) })
      this.updateCell(sheetName, `B${r}`, { text: aje.glvRef || `AJE.${i + 1}` })
      this.updateCell(sheetName, `C${r}`, { text: aje.noiDung })
      this.updateCell(sheetName, `D${r}`, { text: aje.tkNo })
      this.updateCell(sheetName, `E${r}`, { text: aje.tkCo })
      this.updateCell(sheetName, `F${r}`, { number: aje.soTien })
      this.updateCell(sheetName, `G${r}`, { text: aje.chiTieuCdkt || defaultBsName })
      this.updateCell(sheetName, `H${r}`, { number: impactVal })
      filled++
    }
    return filled
  }
  /**
   * Lưu file kết quả ra đĩa: cập nhật toàn bộ buffer XML đã chỉnh sửa vào zip package
   */
  public save(outputPath: string): void {
    const outDir = path.dirname(outputPath)
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true })
    }

    for (const zipPath of this.modifiedPaths) {
      const xml = this.sheetCache.get(zipPath)
      if (xml) {
        this.zip.updateFile(zipPath, Buffer.from(xml, 'utf8'))
      }
    }

    this.zip.writeZip(outputPath)
  }
}
