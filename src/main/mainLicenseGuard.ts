import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import {
  verifyLicense,
  MAX_TRIAL_EXPORTS,
  getMachineId,
  MASTER_PUBLIC_KEY_BASE64,
} from '../shared/license'

interface LicenseGuardData {
  licenseKey: string | null
  trialExportsUsed: number
  machineId: string
  updatedAt: string
}

let cachedGuardData: LicenseGuardData | null = null

function getGuardFilePath(): string {
  try {
    const userData = app.getPath('userData')
    return path.join(userData, 'auditsoft_license_guard.json')
  } catch {
    // Fallback khi chạy unit test môi trường Node ngoài Electron
    return path.resolve(process.cwd(), '.temp_license_guard.json')
  }
}

export function loadLicenseGuard(): LicenseGuardData {
  if (cachedGuardData) return cachedGuardData

  const filePath = getGuardFilePath()
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      const parsed = JSON.parse(content) as Partial<LicenseGuardData>
      cachedGuardData = {
        licenseKey: parsed.licenseKey ?? null,
        trialExportsUsed: typeof parsed.trialExportsUsed === 'number' ? parsed.trialExportsUsed : 0,
        machineId: parsed.machineId ?? getMachineId(),
        updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      }
      return cachedGuardData
    }
  } catch {
    // ignore read/parse error, fallback to initial state
  }

  cachedGuardData = {
    licenseKey: null,
    trialExportsUsed: 0,
    machineId: getMachineId(),
    updatedAt: new Date().toISOString(),
  }
  return cachedGuardData
}

export function saveLicenseGuard(data: LicenseGuardData): void {
  cachedGuardData = { ...data, updatedAt: new Date().toISOString() }
  const filePath = getGuardFilePath()
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, JSON.stringify(cachedGuardData, null, 2), 'utf8')
  } catch {
    // ignore write error
  }
}

/**
 * Ghi nhận kích hoạt token bản quyền phía Main Process
 */
export function syncLicenseInMain(licenseKey: string, machineId: string): boolean {
  const check = verifyLicense(machineId, licenseKey, MASTER_PUBLIC_KEY_BASE64)
  if (!check.valid || !check.payload) {
    return false
  }

  const guard = loadLicenseGuard()
  guard.licenseKey = licenseKey
  guard.machineId = machineId
  saveLicenseGuard(guard)
  return true
}

/**
 * Chốt chặn an ninh Main Process:
 * Ngăn chặn hoàn toàn việc gọi IPC xuất file khi chưa kích hoạt và đã hết 20 lượt dùng thử
 */
export function assertCanExport(actionName = 'xuất dữ liệu'): void {
  const guard = loadLicenseGuard()
  const machineId = guard.machineId || getMachineId()

  // 1. Nếu có token bản quyền, xác thực lại chữ ký số Ed25519
  if (guard.licenseKey) {
    const verification = verifyLicense(machineId, guard.licenseKey, MASTER_PUBLIC_KEY_BASE64)
    if (verification.valid && verification.payload) {
      return // Cho phép xuất không giới hạn
    }
  }

  // 2. Chế độ dùng thử: kiểm tra số lượt đã dùng
  if (guard.trialExportsUsed >= MAX_TRIAL_EXPORTS) {
    throw new Error(
      `Đã sử dụng hết ${MAX_TRIAL_EXPORTS}/${MAX_TRIAL_EXPORTS} lượt xuất dùng thử miễn phí. Vui lòng kích hoạt bản quyền AuditSoft để tiếp tục ${actionName}.`,
    )
  }

  // Tăng số lượt dùng thử và lưu lại
  guard.trialExportsUsed += 1
  saveLicenseGuard(guard)
}

/**
 * Reset dữ liệu bảo vệ (Dành cho Unit Testing)
 */
export function resetLicenseGuardForTest(): void {
  cachedGuardData = null
  const filePath = getGuardFilePath()
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch {}
}
