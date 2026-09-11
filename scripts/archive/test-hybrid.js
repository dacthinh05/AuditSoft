const ExcelJS = require('exceljs')
const AdmZip = require('adm-zip')
const fs = require('fs')

async function testHybrid() {
  const tplPath = 'GLV MAU/G100 - Doanh thu - Mau 2025- Thinh.xlsx'
  
  // 1. Cho ExcelJS ghi dữ liệu ra một file tạm
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(tplPath)
  
  // Update cell J2 on ADD
  const ws = wb.getWorksheet('ADD')
  if (ws) ws.getCell('J2').value = 'Cong ty Sumei Test Hybrid'
  
  await wb.xlsx.writeFile('temp_exceljs.xlsx')
  
  // 2. Lấy zip gốc của template, CHỈ cập nhật các sheet được thay đổi (ở đây là sheet1.xml: ADD)
  const tplZip = new AdmZip(tplPath)
  const genZip = new AdmZip('temp_exceljs.xlsx')
  
  // Thay thế sheet1.xml của template bằng sheet1.xml được sinh từ ExcelJS (chỉ chứa dữ liệu cell)
  const s1Data = genZip.getEntry('xl/worksheets/sheet1.xml').getData()
  tplZip.updateFile('xl/worksheets/sheet1.xml', s1Data)
  
  // Cũng cập nhật sharedStrings.xml nếu có
  const ssEntry = genZip.getEntry('xl/sharedStrings.xml')
  if (ssEntry) {
    tplZip.updateFile('xl/sharedStrings.xml', ssEntry.getData())
  }
  
  tplZip.writeZip('test_hybrid_g100.xlsx')
  console.log('Saved test_hybrid_g100.xlsx!')
}

testHybrid()
