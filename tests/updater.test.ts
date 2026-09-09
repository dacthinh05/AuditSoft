import { describe, it, expect } from 'vitest'
import { compareVersions, DEFAULT_MANIFEST_URL } from '../src/main/updater'
import type { UpdateManifest } from '../src/shared/types/update'

describe('Auto-Update Engine — Remote Manifest & Version Comparison', () => {
  it('so sánh các chuỗi semantic versioning chính xác', () => {
    // Phiên bản mới hơn
    expect(compareVersions('0.1.0', '0.2.0')).toBe(1)
    expect(compareVersions('0.1.0', '0.1.1')).toBe(1)
    expect(compareVersions('0.1.0', '1.0.0')).toBe(1)
    expect(compareVersions('v0.1.0', 'v0.2.0')).toBe(1)

    // Phiên bản cũ hơn
    expect(compareVersions('0.2.0', '0.1.0')).toBe(-1)
    expect(compareVersions('1.0.0', '0.9.9')).toBe(-1)

    // Cùng phiên bản
    expect(compareVersions('0.1.0', '0.1.0')).toBe(0)
    expect(compareVersions('v1.0.0', '1.0.0')).toBe(0)
  })

  it('kết nối và đọc thành công manifest thực tế từ raw GitHub endpoint', async () => {
    expect(DEFAULT_MANIFEST_URL).toBe(
      'https://raw.githubusercontent.com/dacthinh05/AuditSoft/main/version.json'
    )

    const res = await fetch(DEFAULT_MANIFEST_URL)
    expect(res.ok).toBe(true)

    const data = (await res.json()) as UpdateManifest
    expect(data.version).toMatch(/^\d+\.\d+\.\d+$/)
    expect(data.downloadUrl).toContain('https://github.com/dacthinh05/AuditSoft/releases/latest')
    expect(data.portableUrl).toContain('https://github.com/dacthinh05/AuditSoft/releases/latest')
    expect(Array.isArray(data.changelog)).toBe(true)
    expect(data.changelog.length).toBeGreaterThan(0)
  })
})
