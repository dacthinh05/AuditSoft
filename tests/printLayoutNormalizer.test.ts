import { describe, it, expect } from 'vitest'
import { PrintLayoutNormalizer, AUDIT_NARROW_MARGINS, DEFAULT_AUDIT_LANDSCAPE_CONFIG, DEFAULT_AUDIT_PORTRAIT_CONFIG } from '../src/domain/workingpaper/openxml/PrintLayoutNormalizer'

describe('PrintLayoutNormalizer — Chuẩn Hóa Trang In A4 Cho Giấy Làm Việc Kiểm Toán', () => {
  it('tự động chèn <pageSetUpPr fitToPage="1"/> vào sheetPr khi chưa có', () => {
    const rawXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetPr codeName="Sheet1"/>
  <sheetData><row r="1"><c r="A1"><v>100</v></c></row></sheetData>
</worksheet>`

    const normalized = PrintLayoutNormalizer.normalizeWorksheetXml(rawXml, DEFAULT_AUDIT_LANDSCAPE_CONFIG)
    expect(normalized).toContain('<pageSetUpPr fitToPage="1"/>')
    expect(normalized).toContain('orientation="landscape"')
    expect(normalized).toContain('paperSize="9"')
    expect(normalized).toContain('fitToWidth="1"')
    expect(normalized).toContain('fitToHeight="0"')
    expect(normalized).toContain(`left="${AUDIT_NARROW_MARGINS.left}"`)
    expect(normalized).toContain('horizontalCentered="1"')
    expect(normalized).toContain('gridLines="1"')
  })

  it('tự động chèn <sheetPr> nếu worksheet hoàn toàn chưa có thẻ này', () => {
    const rawXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData><row r="1"><c r="A1"><v>100</v></c></row></sheetData>
</worksheet>`

    const normalized = PrintLayoutNormalizer.normalizeWorksheetXml(rawXml, DEFAULT_AUDIT_LANDSCAPE_CONFIG)
    expect(normalized).toContain('<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>')
  })

  it('cập nhật chuẩn A4 Portrait khi cấu hình là portrait', () => {
    const rawXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetPr codeName="MucLuc"/>
  <sheetData></sheetData>
</worksheet>`

    const normalized = PrintLayoutNormalizer.normalizeWorksheetXml(rawXml, DEFAULT_AUDIT_PORTRAIT_CONFIG)
    expect(normalized).toContain('orientation="portrait"')
    expect(normalized).toContain('paperSize="9"')
    expect(normalized).toContain('fitToWidth="1"')
    expect(normalized).toContain('fitToHeight="0"')
  })

  it('bảo toàn r:id trong thẻ <pageSetup> nếu file gốc đã có mối quan hệ máy in r:id', () => {
    const rawXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetPr codeName="Sheet1"/>
  <sheetData></sheetData>
  <pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>
  <pageSetup paperSize="1" orientation="portrait" r:id="rId99"/>
</worksheet>`

    const normalized = PrintLayoutNormalizer.normalizeWorksheetXml(rawXml, DEFAULT_AUDIT_LANDSCAPE_CONFIG)
    expect(normalized).toContain('r:id="rId99"')
    expect(normalized).toContain('paperSize="9"')
    expect(normalized).toContain('orientation="landscape"')
    expect(normalized).toContain('fitToWidth="1"')
    expect(normalized).toContain('fitToHeight="0"')
  })

  it('đảm bảo thứ tự schema OpenXML hợp lệ: printOptions -> pageMargins -> pageSetup', () => {
    const rawXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData></sheetData>
</worksheet>`

    const normalized = PrintLayoutNormalizer.normalizeWorksheetXml(rawXml, DEFAULT_AUDIT_LANDSCAPE_CONFIG)
    const idxPrintOptions = normalized.indexOf('<printOptions')
    const idxPageMargins = normalized.indexOf('<pageMargins')
    const idxPageSetup = normalized.indexOf('<pageSetup')

    expect(idxPrintOptions).toBeGreaterThan(-1)
    expect(idxPageMargins).toBeGreaterThan(idxPrintOptions)
    expect(idxPageSetup).toBeGreaterThan(idxPageMargins)
  })
})
