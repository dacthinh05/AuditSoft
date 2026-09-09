import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { LocalHtkkScanner } from '../src/domain/etax/LocalHtkkScanner'

describe('LocalHtkkScanner Phase 1: HTKK Auto-Detection', () => {
  it('tự động quét và nhận diện phần mềm HTKK cài đặt trên Windows', () => {
    const info = LocalHtkkScanner.detect()
    expect(info.checkedPaths.length).toBeGreaterThan(0)

    // Nếu máy tính hiện tại có cài HTKK (như trên máy trạm này)
    if (fs.existsSync('C:\\Program Files (x86)\\HTKK')) {
      expect(info.isInstalled).toBe(true)
      expect(info.installPath).toBe('C:\\Program Files (x86)\\HTKK')
      expect(info.appVersion).toBe('5.7.1')
    }
  })

  it('xử lý an toàn khi truyền đường dẫn không tồn tại', () => {
    const fakePath = 'X:\\DuAnKhongTonTai\\HTKK_Fake'
    const info = LocalHtkkScanner.detect(fakePath)

    // Vẫn an toàn không văng exception
    expect(info).toBeDefined()
    expect(info.checkedPaths).toContain(fakePath)
  })

  it('đọc nội dung tệp XML thành công hoặc trả về null nếu không tồn tại', () => {
    const nonExistent = 'C:\\KhongTonTai\\fake.xml'
    expect(LocalHtkkScanner.readXmlFile(nonExistent)).toBeNull()

    const realFixture = path.join(__dirname, 'fixtures/etax/sample_old_tt151.xml')
    if (fs.existsSync(realFixture)) {
      const content = LocalHtkkScanner.readXmlFile(realFixture)
      expect(content).not.toBeNull()
      expect(content).toContain('<HSoThueDTu')
    }
  })
})
