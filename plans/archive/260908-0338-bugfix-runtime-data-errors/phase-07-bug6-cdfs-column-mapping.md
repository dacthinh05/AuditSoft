---
phase: 7
title: "BUG-6/7: Fix CDFS column mapping — index cứng + tentk fallback sai"
status: completed
priority: P2
effort: "45m"
dependencies: [6]
---

# Phase 7: BUG-6/7 — CDFS dynamic column detection + tentk fallback

## Overview
`WorkingPaperGenerator.ts:65-72` đọc CDFS bằng column index cứng (1-9). Nếu file có cột STT đầu, toàn bộ dữ liệu lệch 1 cột: `matk` đọc STT (số), `sdndk` đọc mã TK (text) → `Number()` = NaN → 0. Working Papers điền 0 cho mọi số dư.

Đồng thời: fallback `tentk` lấy `row.getCell(2)` — chính là fallback của `matk` → `tentk` = `matk`.

## Design
Thêm dynamic header detection cho CDFS, tương tự pattern đã dùng cho NKC trong cùng file (lines 102-122). Scan tối đa 5 hàng đầu tìm header có chứa keyword TK, tên TK, PS Nợ, PS Có, CK Nợ, CK Có. Sau đó map cột theo header text, không theo index cứng.

## Related Code Files
- Modify: `src/domain/workingpaper/WorkingPaperGenerator.ts` (lines 51-78 — phần CDFS)

## Implementation Steps

### Bước 1 — Thêm helper tìm cột theo header keyword
```typescript
function findColByKeyword(headerRow: ExcelJS.Row, keywords: string[]): number | null {
  for (let c = 1; c <= Math.min(20, headerRow.cellCount); c++) {
    const txt = String(cellScalar(headerRow.getCell(c).value) || '').trim().toLowerCase()
    if (keywords.some(k => txt.includes(k))) return c
  }
  return null
}
```

### Bước 2 — Thay block đọc CDFS cứng bằng dynamic detection
```typescript
if (wsCDFS) {
  // Tìm header row động (tối đa 6 hàng đầu)
  let headerRowIdx = 3
  let colMatk: number | null = null
  let colTentk: number | null = null
  let colSdndk: number | null = null
  let colSdcdk: number | null = null
  let colPsno: number | null = null
  let colPsco: number | null = null
  let colNock: number | null = null
  let colCock: number | null = null

  for (let r = 1; r <= Math.min(6, wsCDFS.rowCount); r++) {
    const row = wsCDFS.getRow(r)
    const matkCol = findColByKeyword(row, ['matk', 'mã tk', 'số hiệu', 'tài khoản'])
    if (matkCol != null) {
      headerRowIdx = r
      colMatk = matkCol
      // Tìm các cột khác trên cùng hàng header
      colTentk = findColByKeyword(row, ['tên tk', 'tên tài khoản', 'diễn giải'])
      colSdndk = findColByKeyword(row, ['dư nợ đầu', 'số dư nợ đk', 'nợ đầu'])
      colSdcdk = findColByKeyword(row, ['dư có đầu', 'số dư có đk', 'có đầu'])
      colPsno = findColByKeyword(row, ['ps nợ', 'phát sinh nợ', 'nợ phát sinh'])
      colPsco = findColByKeyword(row, ['ps có', 'phát sinh có', 'có phát sinh'])
      colNock = findColByKeyword(row, ['nợ cuối', 'dư nợ ck', 'nợ ck'])
      colCock = findColByKeyword(row, ['có cuối', 'dư có ck', 'có ck'])
      break
    }
  }

  // Fallback về offset cố định nếu không tìm được — giả định không có cột STT
  const getCol = (detected: number | null, fallback: number) => detected ?? fallback

  wsCDFS.eachRow((row, r) => {
    if (r <= headerRowIdx) return
    const matkCol = getCol(colMatk, 2)
    const tentkCol = getCol(colTentk, 3)
    const matk = String(cellScalar(row.getCell(matkCol).value) || cellScalar(row.getCell(matkCol - 1).value) || '').trim()
    const tentk = String(cellScalar(row.getCell(tentkCol).value) || '').trim()
    const sdndk = Number(cellScalar(row.getCell(getCol(colSdndk, 4)).value) || 0)
    const sdcdk = Number(cellScalar(row.getCell(getCol(colSdcdk, 5)).value) || 0)
    const psno  = Number(cellScalar(row.getCell(getCol(colPsno,  6)).value) || 0)
    const psco  = Number(cellScalar(row.getCell(getCol(colPsco,  7)).value) || 0)
    const nock  = Number(cellScalar(row.getCell(getCol(colNock,  8)).value) || 0)
    const cock  = Number(cellScalar(row.getCell(getCol(colCock,  9)).value) || 0)

    if (matk && matk.length >= 3 && !isNaN(Number(matk.slice(0, 3)))) {
      cdfsMap.set(matk, { matk, tentk, sdndk, sdcdk, psno, psco, nock, cock })
    }
  })
}
```

## Todo
- [ ] Thêm helper `findColByKeyword` vào `WorkingPaperGenerator.ts`
- [ ] Thay block CDFS cứng bằng dynamic detection (lines 51-78)
- [ ] Test thủ công với file có cột STT đầu
- [ ] Test thủ công với file không có STT (backward compat)
- [ ] Chạy `npm test` + `npm run typecheck`

## Risk Assessment
- Nếu header không tìm được → fallback về index gốc. Hành vi không tệ hơn trạng thái hiện tại.
- Keyword matching phụ thuộc vào nội dung header. Nếu file dùng tiếng Anh thuần → cần thêm keywords. Có thể extend sau.

## Success Criteria
- [ ] File CDFS có cột STT đầu → `matk` đọc đúng mã TK (không đọc STT)
- [ ] `tentk` hiển thị tên tài khoản, không phải mã
- [ ] File không có cột STT → vẫn đọc đúng (backward compat)
- [ ] Working Papers điền số dư đúng từ file thực
