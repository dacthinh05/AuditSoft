import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { PersistentTemplateStore } from '../src/domain/etax/PersistentTemplateStore'
import { getQtt03TT80BlankTemplate } from '../src/domain/etax/templates/qtt03_tt80'

describe('PersistentTemplateStore Phase 2: Template Storage', () => {
  const sampleNewPath = path.join(__dirname, 'fixtures/etax/sample_new_gemini_v294.xml')

  beforeEach(() => {
    PersistentTemplateStore.resetToDefault()
  })

  it('mặc định chưa có mẫu tùy chỉnh thì getEffectiveTemplate trả về mẫu tích hợp sẵn', () => {
    expect(PersistentTemplateStore.hasSavedTemplate()).toBe(false)
    expect(PersistentTemplateStore.getSavedTemplate()).toBeNull()

    const effective = PersistentTemplateStore.getEffectiveTemplate()
    const builtIn = getQtt03TT80BlankTemplate()
    expect(effective).toBe(builtIn)
  })

  it('lưu tệp mẫu mới thành công và trích xuất đúng phiên bản XML', () => {
    const newXml = fs.readFileSync(sampleNewPath, 'utf8')
    const saved = PersistentTemplateStore.saveTemplate(newXml, 'gemini-new.xml', '5.7.6')

    expect(saved.sourceFileName).toBe('gemini-new.xml')
    expect(saved.pbanTKhaiXML).toBe('2.9.4')
    expect(saved.pbanDVu).toBe('5.7.6')
    expect(saved.appVersion).toBe('5.7.6')
    expect(PersistentTemplateStore.hasSavedTemplate()).toBe(true)

    // Lấy khuôn mẫu hiệu lực: phải là khuôn mẫu mới vừa lưu
    const effective = PersistentTemplateStore.getEffectiveTemplate()
    expect(effective).toBe(newXml)
    expect(effective).toContain('<ctM_GCN>0</ctM_GCN>')
  })

  it('resetToDefault xóa khuôn mẫu đã lưu và quay về mẫu chuẩn ban đầu', () => {
    const newXml = fs.readFileSync(sampleNewPath, 'utf8')
    PersistentTemplateStore.saveTemplate(newXml, 'gemini-new.xml')
    expect(PersistentTemplateStore.hasSavedTemplate()).toBe(true)

    PersistentTemplateStore.resetToDefault()
    expect(PersistentTemplateStore.hasSavedTemplate()).toBe(false)
    expect(PersistentTemplateStore.getSavedTemplate()).toBeNull()
  })
})
