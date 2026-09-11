const AdmZip = require('adm-zip')
const fs = require('fs')

// Copy the missing files from template to test_sumei_g100.xlsx:
const tplZip = new AdmZip('GLV MAU/G100 - Doanh thu - Mau 2025- Thinh.xlsx')
const genZip = new AdmZip('test_sumei_g100.xlsx')

const missing = [
  'xl/comments/comment1.xml',
  'xl/drawings/_rels/drawing1.xml.rels',
  'xl/drawings/_rels/drawing2.xml.rels',
  'xl/drawings/commentsDrawing1.vml',
  'xl/drawings/drawing1.xml',
  'xl/drawings/drawing2.xml',
  'xl/externalLinks/_rels/externalLink1.xml.rels',
  'xl/externalLinks/_rels/externalLink2.xml.rels',
  'xl/externalLinks/externalLink1.xml',
  'xl/externalLinks/externalLink2.xml',
  'xl/worksheets/_rels/sheet12.xml.rels',
  'xl/worksheets/_rels/sheet2.xml.rels',
  'xl/worksheets/_rels/sheet3.xml.rels'
]

for (const path of missing) {
  const entry = tplZip.getEntry(path)
  if (entry) {
    genZip.addFile(path, entry.getData())
  }
}

// Also restore workbook.xml.rels relationships for external links
const tplRels = tplZip.readAsText('xl/_rels/workbook.xml.rels')
genZip.updateFile('xl/_rels/workbook.xml.rels', Buffer.from(tplRels, 'utf8'))

genZip.writeZip('test_with_links_g100.xlsx')
console.log('Saved test_with_links_g100.xlsx')
