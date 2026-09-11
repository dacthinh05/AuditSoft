const { OpenXmlPackageEditor } = require('./dist-electron/domain/workingpaper/openxml/OpenXmlPackageEditor')
const fs = require('fs')

async function testFullOpenXmlG100() {
  const tplPath = 'GLV MAU/G100 - Doanh thu - Mau 2025- Thinh.xlsx'
  const outPath = 'test_full_openxml_g100.xlsx'
  
  const editor = OpenXmlPackageEditor.load(tplPath)
  
  // 1. Fill ADD sheet
  editor.fillAddSheet({
    clientName: 'Công ty Cổ phần Sumei Test Full',
    fiscalYearEnd: '31/12/2025',
    auditPeriod1: '01/01 - 30/06/2025',
    auditPeriod2: '01/07 - 31/12/2025',
    auditorName: 'Nguyễn Đắc Thịnh',
    auditFirmName: 'Công ty TNHH Kiểm toán BẮC ĐẨU',
  })
  
  // 2. Fill G110 lead row
  editor.setLeadRowValues('G 110', 11, { ck: 15000000000, dk: 12000000000, adj: 0 })
  editor.setLeadRowValues('G 110', 12, { ck: 5000000000, dk: 4000000000, adj: 0 })
  editor.setLeadRowValues('G 110', 13, { ck: 2000000000, dk: 1000000000, adj: 0 })
  
  // 3. Fill sample row on G 191.1
  editor.fillSampleRow('G 191.1', 17, {
    date: '15/03/2025',
    docNo: 'HD-00123',
    desc: 'Bán hàng cho khách hàng VIP Sumei',
    amount: 1500000000,
    debit: '131',
    credit: '5111',
  })
  
  // 4. Save directly
  editor.save(outPath)
  console.log('Saved test_full_openxml_g100.xlsx!')
}

testFullOpenXmlG100()
