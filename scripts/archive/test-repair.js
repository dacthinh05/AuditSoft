const AdmZip = require('adm-zip')
const zip = new AdmZip('test_sumei_g100.xlsx')

zip.getEntries().forEach(e => {
  if (e.entryName.startsWith('xl/worksheets/sheet') && e.entryName.endsWith('.xml')) {
    let xml = e.getData().toString('utf8')
    let modified = false
    
    // 1. Fix 4294967295 DPI bug
    if (xml.includes('4294967295')) {
      xml = xml.replace(/\s*horizontalDpi="4294967295"/g, '')
      xml = xml.replace(/\s*verticalDpi="4294967295"/g, '')
      modified = true
    }
    
    // 2. Fix extLst before pageMargins
    const extLstMatch = xml.match(/<extLst[\s\S]*?<\/extLst>/)
    const pageMarginsMatch = xml.match(/<pageMargins[^>]*\/>/)
    if (extLstMatch && pageMarginsMatch && xml.indexOf('<extLst') < xml.indexOf('<pageMargins')) {
      const extStr = extLstMatch[0]
      xml = xml.replace(extStr, '') // remove from early position
      xml = xml.replace('</worksheet>', `${extStr}</worksheet>`) // place at the very end
      modified = true
    }
    
    if (modified) {
      zip.updateFile(e.entryName, Buffer.from(xml, 'utf8'))
    }
  }
})

zip.writeZip('test_repaired_sumei_g100.xlsx')
console.log('Saved test_repaired_sumei_g100.xlsx')
