const ExcelJS = require('exceljs')
const fs = require('fs')

async function testCleanDefinedNames() {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile('GLV MAU/G100 - Doanh thu - Mau 2025- Thinh.xlsx')
  
  // Dọn dẹp an toàn definedNames rác bị ExcelJS gán sai $S$1
  wb.definedNames.model = wb.definedNames.model.filter(m => {
    // Chỉ giữ lại Print_Area và Print_Titles chuẩn
    return m.name.includes('_xlnm.Print_Area') || m.name.includes('_xlnm.Print_Titles')
  })
  
  await wb.xlsx.writeFile('test_clean_defined_g100.xlsx')
  console.log('Saved test_clean_defined_g100.xlsx')
}

testCleanDefinedNames()
