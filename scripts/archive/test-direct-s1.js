const AdmZip = require('adm-zip')

const zip = new AdmZip('GLV MAU/G100 - Doanh thu - Mau 2025- Thinh.xlsx')
let s1 = zip.readAsText('xl/worksheets/sheet1.xml')

// Cập nhật J2 và A1 bằng XML regex an toàn
s1 = s1.replace(/<c r="J2"[^>]*>[\s\S]*?<\/c>/, '<c r="J2" t="inlineStr"><is><t>Cong ty Sumei Test Direct</t></is></c>')

zip.updateFile('xl/worksheets/sheet1.xml', Buffer.from(s1, 'utf8'))
zip.writeZip('test_direct_s1.xlsx')
console.log('Saved test_direct_s1.xlsx')
