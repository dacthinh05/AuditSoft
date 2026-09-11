import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  assertCanExport,
  syncLicenseInMain,
  loadLicenseGuard,
  resetLicenseGuardForTest,
} from '../src/main/mainLicenseGuard'
import { MAX_TRIAL_EXPORTS, getMachineId } from '../src/shared/license'
import { generateSecureLicenseKey } from '../scripts/keygen'

describe('Main Process License Guard — Defense-in-Depth', () => {
  beforeEach(() => {
    resetLicenseGuardForTest()
  })

  afterEach(() => {
    resetLicenseGuardForTest()
  })

  it('cho phép xuất file trong giới hạn MAX_TRIAL_EXPORTS khi chưa kích hoạt', () => {
    for (let i = 0; i < MAX_TRIAL_EXPORTS; i++) {
      expect(() => assertCanExport('Test Export')).not.toThrow()
    }
    const guard = loadLicenseGuard()
    expect(guard.trialExportsUsed).toBe(MAX_TRIAL_EXPORTS)
  })

  it('chặn đứng và ném lỗi khi vượt quá số lượt dùng thử MAX_TRIAL_EXPORTS', () => {
    for (let i = 0; i < MAX_TRIAL_EXPORTS; i++) {
      assertCanExport('Test Export')
    }

    expect(() => assertCanExport('Tạo Giấy làm việc')).toThrow(
      /Đã sử dụng hết 20\/20 lượt xuất dùng thử miễn phí/,
    )
  })

  it('mở khóa không giới hạn khi đồng bộ key bản quyền Ed25519 hợp lệ', () => {
    // 1. Dùng hết lượt dùng thử
    for (let i = 0; i < MAX_TRIAL_EXPORTS; i++) {
      assertCanExport('Test Export')
    }
    expect(() => assertCanExport('Test Export')).toThrow()

    // 2. Kích hoạt key hợp lệ
    const machineId = getMachineId()
    const validKey = generateSecureLicenseKey(machineId, 'Test Auditor')
    const syncSuccess = syncLicenseInMain(validKey, machineId)
    expect(syncSuccess).toBe(true)

    // 3. Xuất file tiếp mà không bị chặn
    expect(() => assertCanExport('Tạo Giấy làm việc')).not.toThrow()
    expect(() => assertCanExport('Xuất Báo cáo')).not.toThrow()
  })

  it('từ chối kích hoạt key giả mạo hoặc sai Machine ID', () => {
    const machineA = getMachineId()
    const machineB = 'AS-0000-1111-2222'
    const keyB = generateSecureLicenseKey(machineB, 'Hacker')

    const syncSuccess = syncLicenseInMain(keyB, machineA)
    expect(syncSuccess).toBe(false)
  })
})
