import fs from 'node:fs'

/** Dò delimiter trong dòng đầu có ý nghĩa. */
function sniffDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? ''
  const candidates = [',', ';', '\t']
  let best = ','
  let bestCount = -1
  for (const c of candidates) {
    const count = firstLine.split(c).length - 1
    if (count > bestCount) {
      bestCount = count
      best = c
    }
  }
  return bestCount > 0 ? best : ','
}

/** Parser CSV/DSV xử lý ngoặc kép chuẩn RFC4180 ("a""b", newline trong ô). */
export function parseDelimited(text: string, delimiter?: string): string[][] {
  const d = delimiter ?? sniffDelimiter(text)
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  const src = text.replace(/^\uFEFF/, '')

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"' && field === '') {
      inQuotes = true
    } else if (ch === d) {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(field)
      field = ''
      rows.push(row)
      row = []
    } else {
      field += ch
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

/** Đọc file CSV thành ma trận chuỗi. */
export function readCsvMatrix(filePath: string): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) reject(err)
      else resolve(parseDelimited(data))
    })
  })
}
