import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { Qtt03Migrator } from '../src/domain/etax/Qtt03Migrator'
import { EtaxXmlParser } from '../src/domain/etax/EtaxXmlParser'
import { Qtt03Validator } from '../src/domain/etax/Qtt03Validator'
import { EtaxXmlSerializer } from '../src/domain/etax/EtaxXmlSerializer'

describe('QTT 03 TNDN End-to-End Pipeline & Verification Suite', () => {
  const fixturesDir = path.join(__dirname, 'fixtures/etax')
  const realOldFile = path.join(fixturesDir, 'sample_old_3700426920_v292.xml')
  const realNewFile = path.join(fixturesDir, 'sample_new_gemini_v294.xml')
  const tt151File = path.join(fixturesDir, 'sample_old_tt151.xml')

  it('Test 1: Full Pipeline Auto-Upgrade trên file thực tế của doanh nghiệp Kiến Đạt', () => {
    expect(fs.existsSync(realOldFile)).toBe(true)
    const oldXml = fs.readFileSync(realOldFile, 'utf8')

    // 1. Chuyển đổi tự động
    const result = Qtt03Migrator.migrateAuto(oldXml)
    expect(result.success).toBe(true)
    expect(result.versionTo).toBe('2.9.4')

    // 2. Kiểm tra các thẻ XSD bắt buộc của HTKK 5.7.x
    expect(result.migratedXml).toContain('<pbanTKhaiXML>2.9.4</pbanTKhaiXML>')
    expect(result.migratedXml).toContain('<pbanDVu>5.7.6</pbanDVu>')
    expect(result.migratedXml).toContain('<HSoKhaiThue id="ID_1">')
    expect(result.migratedXml).toContain('<ctM_GCN>0</ctM_GCN>')
    expect(result.migratedXml).not.toContain('<CKyDTu>')

    // 3. Phân tích kết quả sau chuyển đổi
    const oldDoc = EtaxXmlParser.parseQtt03(oldXml)
    const newDoc = EtaxXmlParser.parseQtt03(result.migratedXml)

    // 4. Đối chiếu số liệu
    const summary = Qtt03Validator.validate(oldDoc, newDoc)
    expect(summary.isAllPassed).toBe(true)
    expect(summary.netVariance).toBe(0)
    expect(summary.newLntt).toBe(31615542690)
    expect(summary.newTaxPayable).toBe(6415180887)

    // 5. Kiểm tra toàn bộ 4 phụ lục đều được chuyển đổi đầy đủ
    expect(result.migratedXml).toContain('PLuc_03_1A_TNDN')
    expect(result.migratedXml).toContain('PL_GDLK2-01')
    expect(result.migratedXml).toContain('PL_GDLK2-02')
    expect(result.migratedXml).toContain('PL_GDLK2-03')
    expect(summary.appendixList.length).toBe(4)
  })

  it('Test 2: Custom Template Pipeline rót dữ liệu vào khuôn mẫu mới', () => {
    expect(fs.existsSync(realOldFile)).toBe(true)
    expect(fs.existsSync(realNewFile)).toBe(true)

    const oldXml = fs.readFileSync(realOldFile, 'utf8')
    const templateXml = fs.readFileSync(realNewFile, 'utf8')

    const result = Qtt03Migrator.migrateWithCustomTemplate(oldXml, templateXml)
    expect(result.success).toBe(true)

    const oldDoc = EtaxXmlParser.parseQtt03(oldXml)
    const newDoc = EtaxXmlParser.parseQtt03(result.migratedXml)

    const summary = Qtt03Validator.validate(oldDoc, newDoc)
    expect(summary.isAllPassed).toBe(true)
    expect(summary.netVariance).toBe(0)
    expect(summary.newLntt).toBe(oldDoc.mainForm.ctA1)
    expect(summary.newTaxPayable).toBe(oldDoc.mainForm.ctC9)
  })

  it('Test 3: Chuyển đổi tờ khai cũ theo Thông tư 151 sang chuẩn Thông tư 80', () => {
    expect(fs.existsSync(tt151File)).toBe(true)
    const oldXml = fs.readFileSync(tt151File, 'utf8')

    const result = Qtt03Migrator.migrateAuto(oldXml)
    expect(result.success).toBe(true)

    const oldDoc = EtaxXmlParser.parseQtt03(oldXml)
    const newDoc = EtaxXmlParser.parseQtt03(result.migratedXml)

    expect(newDoc.version).toBe('TT80')
    expect(result.migratedXml).toContain('<pbanTKhaiXML>2.9.4</pbanTKhaiXML>')

    const summary = Qtt03Validator.validate(oldDoc, newDoc)
    expect(summary.isAllPassed).toBe(true)
    expect(summary.netVariance).toBe(0)
    expect(summary.newLntt).toBe(1200000000)
    expect(summary.newTaxPayable).toBe(240000000)
  })

  it('Test 4: Kiểm tra nhị phân (Binary & Byte-level) đảm bảo tương thích 100% với iTaxViewer', () => {
    const oldXml = fs.readFileSync(realOldFile, 'utf8')
    const result = Qtt03Migrator.migrateAuto(oldXml)

    const bytes = EtaxXmlSerializer.toCleanUtf8Bytes(result.migratedXml)

    // Byte đầu tiên bắt buộc phải là ký tự '<' (0x3C / ASCII 60)
    expect(bytes[0]).toBe(0x3c)

    // Tuyệt đối không được chứa 3 byte BOM (0xEF, 0xBB, 0xBF)
    const hasBom = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf
    expect(hasBom).toBe(false)

    // Bắt đầu bằng XML Declaration
    const textStart = new TextDecoder('utf-8').decode(bytes.slice(0, 38))
    expect(textStart).toBe('<?xml version="1.0" encoding="UTF-8"?>')
  })
})
