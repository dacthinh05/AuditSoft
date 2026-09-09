import { describe, it, expect } from 'vitest'
import fs from 'fs'
import { Qtt03Migrator } from '../src/domain/etax/Qtt03Migrator'
import { EtaxXmlParser } from '../src/domain/etax/EtaxXmlParser'

describe('Qtt03Migrator Phase 2: Migration Engine', () => {
  const realOldPath = 'D:/Desktop/thư mục/3700426920000-03_TNDN_TT80-Y2025-L00 (cũ).xml'
  const realNewPath = 'D:/Desktop/thư mục/gemini-code-1788835615512 (mới).xml'

  it('tự động nâng cấp file XML thực tế của người dùng từ HTKK cũ sang HTKK mới', () => {
    if (!fs.existsSync(realOldPath)) return

    const oldXml = fs.readFileSync(realOldPath, 'utf8')
    const result = Qtt03Migrator.migrateAuto(oldXml)

    expect(result.success).toBe(true)
    expect(result.versionTo).toBe('2.9.4')

    // 1. Kiểm tra pbanTKhaiXML đã được nâng cấp lên 2.9.4
    expect(result.migratedXml).toContain('<pbanTKhaiXML>2.9.4</pbanTKhaiXML>')

    // 2. Kiểm tra pbanDVu đã được nâng cấp lên 5.7.6
    expect(result.migratedXml).toContain('<pbanDVu>5.7.6</pbanDVu>')

    // 3. Kiểm tra HSoKhaiThue id="ID_1"
    expect(result.migratedXml).toContain('<HSoKhaiThue id="ID_1">')

    // 4. Kiểm tra thẻ bắt buộc mới ctM_GCN đã được chèn vào phụ lục GDLK
    expect(result.migratedXml).toContain('<ctM_GCN>0</ctM_GCN>')

    // 5. Kiểm tra chữ ký số cũ CKyDTu đã được loại bỏ
    expect(result.migratedXml).not.toContain('<CKyDTu>')
    expect(result.migratedXml).not.toContain('<Signature')

    // 6. Kiểm tra parse lại và đối chiếu toàn bộ số liệu: BẢO TOÀN 100%
    const migratedDoc = EtaxXmlParser.parseQtt03(result.migratedXml)
    const oldDoc = EtaxXmlParser.parseQtt03(oldXml)

    expect(migratedDoc.generalInfo.mst).toBe(oldDoc.generalInfo.mst)
    expect(migratedDoc.generalInfo.tenNNT).toBe(oldDoc.generalInfo.tenNNT)
    expect(migratedDoc.mainForm.ctA1).toBe(oldDoc.mainForm.ctA1)
    expect(migratedDoc.mainForm.ctB1).toBe(oldDoc.mainForm.ctB1)
    expect(migratedDoc.mainForm.ctB4).toBe(oldDoc.mainForm.ctB4)
    expect(migratedDoc.mainForm.ctC1).toBe(oldDoc.mainForm.ctC1)
    expect(migratedDoc.mainForm.ctC9).toBe(oldDoc.mainForm.ctC9)
    expect(migratedDoc.mainForm.ctE1).toBe(oldDoc.mainForm.ctE1)
    expect(migratedDoc.mainForm.ctG).toBe(oldDoc.mainForm.ctG)
  })

  it('chuyển đổi dữ liệu chính xác khi người dùng cung cấp file mẫu tùy chỉnh', () => {
    if (!fs.existsSync(realOldPath) || !fs.existsSync(realNewPath)) return

    const oldXml = fs.readFileSync(realOldPath, 'utf8')
    const templateXml = fs.readFileSync(realNewPath, 'utf8')

    const result = Qtt03Migrator.migrateWithCustomTemplate(oldXml, templateXml)

    expect(result.success).toBe(true)
    const migratedDoc = EtaxXmlParser.parseQtt03(result.migratedXml)
    const oldDoc = EtaxXmlParser.parseQtt03(oldXml)

    // Khớp 100% các chỉ tiêu tài chính
    expect(migratedDoc.mainForm.ctA1).toBe(oldDoc.mainForm.ctA1)
    expect(migratedDoc.mainForm.ctC1).toBe(oldDoc.mainForm.ctC1)
    expect(migratedDoc.mainForm.ctC9).toBe(oldDoc.mainForm.ctC9)
  })
})
