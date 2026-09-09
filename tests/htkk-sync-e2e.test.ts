import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { LocalHtkkScanner } from '../src/domain/etax/LocalHtkkScanner'
import { PersistentTemplateStore } from '../src/domain/etax/PersistentTemplateStore'
import { Qtt03Migrator } from '../src/domain/etax/Qtt03Migrator'
import { EtaxXmlParser } from '../src/domain/etax/EtaxXmlParser'
import { Qtt03Validator } from '../src/domain/etax/Qtt03Validator'

describe('HTKK Sync & Persistent Template E2E Suite (Phương Án 1 & 2)', () => {
  const fixturesDir = path.join(__dirname, 'fixtures/etax')
  const realOldFile = path.join(fixturesDir, 'sample_old_3700426920_v292.xml')
  const realNewFile = path.join(fixturesDir, 'sample_new_gemini_v294.xml')

  beforeEach(() => {
    PersistentTemplateStore.resetToDefault()
  })

  it('Bước 1 (Phương án 2): Tự động phát hiện HTKK và số hiệu phiên bản trên máy tính', () => {
    const info = LocalHtkkScanner.detect()
    expect(info.checkedPaths.length).toBeGreaterThan(0)

    if (fs.existsSync('C:\\Program Files (x86)\\HTKK')) {
      expect(info.isInstalled).toBe(true)
      expect(info.installPath).toBe('C:\\Program Files (x86)\\HTKK')
      expect(info.appVersion).toBe('5.7.1')
    }
  })

  it('Bước 2 (Phương án 1): Người dùng lưu tệp mới làm khuôn mẫu mặc định', () => {
    const newXml = fs.readFileSync(realNewFile, 'utf8')
    const saved = PersistentTemplateStore.saveTemplate(newXml, 'gemini-code-1788835615512 (mới).xml', '5.7.6')

    expect(saved.pbanTKhaiXML).toBe('2.9.4')
    expect(saved.pbanDVu).toBe('5.7.6')
    expect(PersistentTemplateStore.hasSavedTemplate()).toBe(true)

    // Xác nhận template hiệu lực là template vừa lưu
    const effective = PersistentTemplateStore.getEffectiveTemplate()
    expect(effective).toBe(newXml)
  })

  it('Bước 3: Chuyển đổi tự động áp dụng đồng thời Khuôn mẫu đã lưu và Phiên bản HTKK trên máy', () => {
    const oldXml = fs.readFileSync(realOldFile, 'utf8')
    const newXml = fs.readFileSync(realNewFile, 'utf8')

    // 1. Lưu khuôn mẫu mới
    PersistentTemplateStore.saveTemplate(newXml, 'gemini-new.xml', '5.7.6')

    // 2. Chuyển đổi tự động với số hiệu phiên bản HTKK thực tế
    const result = Qtt03Migrator.migrateAuto(oldXml, { localAppVersion: '5.7.6' })
    expect(result.success).toBe(true)

    // 3. Xác nhận đã đồng bộ phiên bản và khuôn mẫu
    expect(result.migratedXml).toContain('<pbanDVu>5.7.6</pbanDVu>')
    expect(result.migratedXml).toContain('<pbanTKhaiXML>2.9.4</pbanTKhaiXML>')
    expect(result.migratedXml).toContain('<ctM_GCN>0</ctM_GCN>')

    // 4. Xác nhận giữ nguyên 100% toàn bộ 4 phụ lục
    expect(result.migratedXml).toContain('PLuc_03_1A_TNDN')
    expect(result.migratedXml).toContain('PL_GDLK2-01')
    expect(result.migratedXml).toContain('PL_GDLK2-02')
    expect(result.migratedXml).toContain('PL_GDLK2-03')

    // 5. Đối chiếu số liệu
    const oldDoc = EtaxXmlParser.parseQtt03(oldXml)
    const newDoc = EtaxXmlParser.parseQtt03(result.migratedXml)
    const summary = Qtt03Validator.validate(oldDoc, newDoc)

    expect(summary.isAllPassed).toBe(true)
    expect(summary.netVariance).toBe(0)
    expect(summary.appendixList.length).toBe(4)
  })
})
