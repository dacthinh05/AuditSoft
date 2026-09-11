import fs from 'node:fs'
import path from 'node:path'
import { OpenXmlPackageEditor } from '../src/domain/workingpaper/openxml/OpenXmlPackageEditor'
import { fillRevenueWorkingPaper } from '../src/domain/workingpaper/fillers/G100_RevenueFiller'
import { extractAccountingContext } from '../src/domain/workingpaper/WorkingPaperGenerator'

async function run() {
  const sourcePath = path.resolve('MAU NKC.xlsx')
  const templatePath = path.resolve('GLV MAU/G100 - Doanh thu - Mau 2025- Thinh.xlsx')
  const outputPath = path.resolve('test_openxml_g100.xlsx')

  const ctx = await extractAccountingContext(sourcePath, {
    clientName: 'Công ty Cổ phần Sumei Test',
    fiscalYearEnd: '31/12/2025',
    auditPeriod1: '01/01 - 30/06/2025',
    auditPeriod2: '01/07 - 31/12/2025',
    auditorName: 'Đắc Thịnh',
    auditFirmName: 'Công ty TNHH Kiểm toán BẮC ĐẨU',
  })

  console.log('Context extracted. Loading template with OpenXmlPackageEditor...')
  const editor = OpenXmlPackageEditor.load(templatePath)
  const res = fillRevenueWorkingPaper(editor as never, ctx)
  console.log('Filled result:', res)
  editor.save(outputPath)
  console.log('Saved to test_openxml_g100.xlsx')
}

run()
