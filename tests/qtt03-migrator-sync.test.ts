import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { Qtt03Migrator } from '../src/domain/etax/Qtt03Migrator'
import { PersistentTemplateStore } from '../src/domain/etax/PersistentTemplateStore'

describe('Qtt03Migrator Sync Phase 3: Engine Integration', () => {
  const fixturesDir = path.join(__dirname, 'fixtures/etax')
  const realOldFile = path.join(fixturesDir, 'sample_old_3700426920_v292.xml')
  const realNewFile = path.join(fixturesDir, 'sample_new_gemini_v294.xml')
  const tt151File = path.join(fixturesDir, 'sample_old_tt151.xml')

  beforeEach(() => {
    PersistentTemplateStore.resetToDefault()
  })

  it('đồng bộ phiên bản pbanDVu theo số hiệu HTKK trên máy người dùng', () => {
    const oldXml = fs.readFileSync(realOldFile, 'utf8')
    const result = Qtt03Migrator.migrateAuto(oldXml, { localAppVersion: '5.8.2' })

    expect(result.success).toBe(true)
    expect(result.migratedXml).toContain('<pbanDVu>5.8.2</pbanDVu>')
    expect(result.changesApplied.some((c) => c.includes('5.8.2'))).toBe(true)
  })

  it('tự động áp dụng khuôn mẫu mặc định tùy chỉnh khi người dùng đã lưu', () => {
    const newTemplateXml = fs.readFileSync(realNewFile, 'utf8')
    // Giả lập người dùng đã bấm "Lưu làm khuôn mẫu mặc định"
    PersistentTemplateStore.saveTemplate(newTemplateXml, 'gemini-new.xml', '5.7.6')
    expect(PersistentTemplateStore.hasSavedTemplate()).toBe(true)

    // Khi chuyển đổi tệp cũ ở Chế độ tự động (không truyền templateXml)
    const oldXml = fs.readFileSync(tt151File, 'utf8')
    const result = Qtt03Migrator.migrateAuto(oldXml)

    expect(result.success).toBe(true)
    expect(result.changesApplied.some((c) => c.includes('mẫu mặc định tùy chỉnh'))).toBe(true)
    // Tệp kết quả phải mang cấu trúc của template mới đã lưu (chứa thẻ ctM_GCN)
    expect(result.migratedXml).toContain('<ctM_GCN>0</ctM_GCN>')
  })
})
