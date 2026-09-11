const AdmZip = require('adm-zip')

// Load the original template directly with OpenXmlPackageEditor!
const zip = new AdmZip('GLV MAU/G100 - Doanh thu - Mau 2025- Thinh.xlsx')

// Let's modify ADD sheet and G 110 sheet using OpenXML directly (just like OpenXmlPackageEditor does!)
let s1 = zip.readAsText('xl/worksheets/sheet1.xml') // ADD
// Update A1 or J2 with client name
s1 = s1.replace(/<c r="J2"[^>]*><v>[^<]*<\/v><\/c>/, '<c r="J2" t="inlineStr"><is><t>Công ty Cổ phần Sumei Test</t></is></c>')

zip.updateFile('xl/worksheets/sheet1.xml', Buffer.from(s1, 'utf8'))
zip.writeZip('test_direct_openxml_g100.xlsx')
console.log('Saved test_direct_openxml_g100.xlsx directly from template!')
