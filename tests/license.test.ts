import { describe, it, expect, beforeEach } from 'vitest'
import {
  verifyLicense,
  verifyLicenseAsync,
  getMachineId,
  getTrialExportStatus,
  useTrialExport,
  resetTrialExports,
  removeLicense,
  saveLicense,
  saveLicenseSync,
  getLicenseStatus,
  MAX_TRIAL_EXPORTS,
  MASTER_PUBLIC_KEY_BASE64,
  parseLicenseToken,
} from '../src/shared/license'
import { generateSecureLicenseKey } from '../scripts/keygen'

describe('License System — Asymmetric Cryptography (Ed25519 Machine-Locked)', () => {
  beforeEach(() => {
    removeLicense()
    resetTrialExports()
  })

  it('sinh và phân tích License Token đúng định dạng ASKEY-<Payload>.<Signature>', () => {
    const machineId = 'AS-9F2A-88B1-C410'
    const key = generateSecureLicenseKey(machineId, 'Auditor A')

    expect(key.startsWith('ASKEY-')).toBe(true)
    const parsed = parseLicenseToken(key)
    expect(parsed.success).toBe(true)
    expect(parsed.payload?.m).toBe(machineId)
    expect(parsed.payload?.n).toBe('Auditor A')
    expect(parsed.payload?.t).toBe('LIFETIME')
  })

  it('xác thực License Key hợp lệ với Machine ID tương ứng (Sync & Async)', async () => {
    const machineId = 'AS-9F2A-88B1-C410'
    const key = generateSecureLicenseKey(machineId, 'Thịnh Lynx')

    const syncResult = verifyLicense(machineId, key, MASTER_PUBLIC_KEY_BASE64)
    expect(syncResult.valid).toBe(true)
    expect(syncResult.message).toContain('thành công')

    const asyncResult = await verifyLicenseAsync(machineId, key, MASTER_PUBLIC_KEY_BASE64)
    expect(asyncResult.valid).toBe(true)
    expect(asyncResult.message).toContain('thành công')
  })

  it('từ chối kích hoạt nếu Machine ID không khớp (Machine-locked)', () => {
    const machineA = 'AS-9F2A-88B1-C410'
    const machineB = 'AS-1111-2222-3333'
    const keyA = generateSecureLicenseKey(machineA, 'Khách hàng Máy A')

    const result = verifyLicense(machineB, keyA, MASTER_PUBLIC_KEY_BASE64)
    expect(result.valid).toBe(false)
    expect(result.message).toContain('không khớp với thiết bị hiện tại')
  })

  it('từ chối nếu chữ ký số bị sửa đổi (Tamper protection)', () => {
    const machineId = 'AS-9F2A-88B1-C410'
    const validKey = generateSecureLicenseKey(machineId, 'VIP User')

    // Chỉnh sửa 1 ký tự trong phần signature
    const parts = validKey.split('.')
    const tamperedSig = parts[1]!.slice(0, -4) + 'AAAA'
    const tamperedKey = `${parts[0]}.${tamperedSig}`

    const result = verifyLicense(machineId, tamperedKey, MASTER_PUBLIC_KEY_BASE64)
    expect(result.valid).toBe(false)
    expect(result.message).toContain('Chữ ký số không hợp lệ')
  })

  it('từ chối nếu phần payload bị can thiệp sửa Machine ID', () => {
    const machineId = 'AS-9F2A-88B1-C410'
    const validKey = generateSecureLicenseKey(machineId, 'VIP User')

    // Cố tình thay đổi payload nhưng giữ nguyên signature cũ
    const fakePayload = Buffer.from(JSON.stringify({
      m: 'AS-9999-8888-7777',
      n: 'Hacker',
      t: 'LIFETIME',
      exp: 0,
      iat: Math.floor(Date.now() / 1000),
    })).toString('base64url')

    const fakeKey = `ASKEY-${fakePayload}.${validKey.split('.')[1]}`
    const result = verifyLicense('AS-9999-8888-7777', fakeKey, MASTER_PUBLIC_KEY_BASE64)
    expect(result.valid).toBe(false)
    expect(result.message).toContain('Chữ ký số không hợp lệ')
  })

  it('kiểm tra chính xác License có thời hạn (Expired vs Valid)', () => {
    const machineId = 'AS-9F2A-88B1-C410'

    // Key còn hạn 30 ngày
    const validAnnualKey = generateSecureLicenseKey(machineId, 'User 1', { days: 30 })
    const validRes = verifyLicense(machineId, validAnnualKey)
    expect(validRes.valid).toBe(true)

    // Key đã hết hạn (giả lập days = -1)
    const expiredKey = generateSecureLicenseKey(machineId, 'User 2', { days: -1 })
    const expiredRes = verifyLicense(machineId, expiredKey)
    expect(expiredRes.valid).toBe(false)
    expect(expiredRes.message).toContain('hết hạn')
  })

  it('quản lý lượt dùng thử miễn phí chính xác (Trial counter)', () => {
    const initial = getTrialExportStatus()
    expect(initial.isLicensed).toBe(false)
    expect(initial.remainingExports).toBe(MAX_TRIAL_EXPORTS)

    const use1 = useTrialExport()
    expect(use1.allowed).toBe(true)
    expect(use1.remainingExports).toBe(MAX_TRIAL_EXPORTS - 1)

    // Dùng hết số lượt thử
    for (let i = 0; i < MAX_TRIAL_EXPORTS - 1; i++) {
      useTrialExport()
    }

    const exhausted = getTrialExportStatus()
    expect(exhausted.remainingExports).toBe(0)
    expect(exhausted.isExpired).toBe(true)

    const blocked = useTrialExport()
    expect(blocked.allowed).toBe(false)
    expect(blocked.message).toContain('hết')
  })

  it('khi đã kích hoạt Bản Quyền Vĩnh Viễn qua saveLicense (Async), không bị giới hạn số lần xuất', async () => {
    const machineId = getMachineId()
    const key = generateSecureLicenseKey(machineId, 'VIP User')
    const saveRes = await saveLicense(key, 'VIP User')
    expect(saveRes.success).toBe(true)

    const status = getLicenseStatus()
    expect(status.isLicensed).toBe(true)
    expect(status.customerName).toBe('VIP User')

    const trialAfter = getTrialExportStatus()
    expect(trialAfter.isLicensed).toBe(true)
    expect(trialAfter.remainingExports).toBeGreaterThan(1000)

    const exportRes = useTrialExport()
    expect(exportRes.allowed).toBe(true)
    expect(exportRes.remainingExports).toBeGreaterThan(1000)
  })

  it('hỗ trợ lưu kích hoạt đồng bộ qua saveLicenseSync', () => {
    const machineId = getMachineId()
    const key = generateSecureLicenseKey(machineId, 'VIP User')
    const saveRes = saveLicenseSync(key, 'VIP User')
    expect(saveRes.success).toBe(true)
    expect(getLicenseStatus().isLicensed).toBe(true)
  })

  it('hủy kích hoạt thành công (Deactivation)', () => {
    const machineId = getMachineId()
    const key = generateSecureLicenseKey(machineId, 'VIP User')
    saveLicenseSync(key)
    expect(getLicenseStatus().isLicensed).toBe(true)

    removeLicense()
    expect(getLicenseStatus().isLicensed).toBe(false)
  })
})
