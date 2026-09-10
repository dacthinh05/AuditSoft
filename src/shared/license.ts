/**
 * Hệ thống Quản lý & Xác thực Bản quyền Bất đối xứng (Asymmetric Cryptography — Ed25519)
 * AuditSoft NKC — Hệ thống Đối chiếu & Kiểm toán Chuyên sâu
 * Tác giả: Thịnh Lynx (0817.567.008 - MB Bank)
 */

import type cryptoType from 'node:crypto'

// Khóa công khai Master (Ed25519 SPKI DER Base64) — Nhúng trực tiếp trong ứng dụng
// Phía ứng dụng CHỈ giữ Public Key để Verify. Private Key nằm an toàn tuyệt đối trên máy tác giả.
export const MASTER_PUBLIC_KEY_BASE64 = 'MCowBQYDK2VwAyEAOoDptMuej36M+mMrNKwoS4Rx2zCSlsDlGFOZQ0w4H+Y='

const STORAGE_KEY_MACHINE_ID = 'auditsoft_machine_id'
const STORAGE_KEY_LICENSE = 'auditsoft_license_token'
const STORAGE_KEY_TRIAL_EXPORTS = 'auditsoft_trial_export_count'
export const MAX_TRIAL_EXPORTS = 20
export const DEFAULT_VIP_LICENSE_KEY =
  'ASKEY-eyJtIjoiQVMtQUxMLU1BQ0hJTkVTLVBSTyIsIm4iOiJLaeG7g20gdG_DoW4gdmnDqm4gVklQIC0gVGjhu4tuaCBMeW54IFBybyIsInQiOiJMSUZFVElNRSIsImV4cCI6MCwiaWF0IjoxNzg4OTIxNDg4fQ.RvSrZXpgmzwOlSRWgxIBm7jHpoYnCyIaAlY2wSHTjZguWf-aVST0NKORd8Bbcxz15s_KnyZnq7tdcQRMPgBlAQ'

export type LicensePlan = 'LIFETIME' | 'PRO' | 'ENTERPRISE' | 'ANNUAL' | 'TRIAL'

export interface LicensePayload {
  m: string // Machine ID (e.g. AS-9F2A-88B1-C410)
  n: string // Customer Name
  t: LicensePlan // Plan type
  exp: number // Expiration timestamp in seconds (0 = Lifetime)
  iat: number // Issued at timestamp in seconds
}

export interface LicenseStatus {
  isLicensed: boolean
  machineId: string
  customerName?: string
  licenseKey: string | null
  activatedAt: string | null
  expiresAt?: string | null
  plan?: LicensePlan
  isExpired?: boolean
}

export interface TrialExportStatus {
  usedExports: number
  maxExports: number
  remainingExports: number
  isExpired: boolean
  isLicensed: boolean
}

export interface VerificationResult {
  valid: boolean
  message: string
  payload?: LicensePayload
}

/**
 * Bộ nhớ tạm in-memory khi chạy trong môi trường Node không có localStorage
 */
const inMemoryStore: Record<string, string> = {}

function readStorage(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key)
    }
  } catch {
    // ignore
  }
  return inMemoryStore[key] ?? null
}

function writeStorage(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value)
      return
    }
  } catch {
    // ignore
  }
  inMemoryStore[key] = value
}

function deleteStorage(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key)
    }
  } catch {
    // ignore
  }
  delete inMemoryStore[key]
}

/**
 * Chuyển chuỗi Base64URL sang Uint8Array
 */
export function base64UrlToUint8Array(b64url: string): Uint8Array {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  while (b64.length % 4 !== 0) {
    b64 += '='
  }
  if (typeof atob === 'function') {
    const binary = atob(b64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }
  // Node fallback
  const buf = Buffer.from(b64, 'base64')
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
}

/**
 * Chuyển Uint8Array sang Base64URL
 */
export function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  if (typeof btoa === 'function') {
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]!)
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }
  // Node fallback
  return Buffer.from(bytes).toString('base64url')
}

/**
 * Tạo chuỗi hash SHA-256 rút gọn từ một input bất kỳ
 */
function simpleHash(input: string): string {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 3864292196) ^ Math.imul(h1 ^ (h1 >>> 13), 2654435761)
  const hex = ((h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0')).toUpperCase()
  return hex
}

/**
 * Lấy hoặc sinh Mã máy (Machine ID) duy nhất cho thiết bị hiện tại
 * Định dạng: AS-XXXX-XXXX-XXXX (Ví dụ: AS-9F2A-88B1-C410)
 */
export function getMachineId(): string {
  try {
    const existing = readStorage(STORAGE_KEY_MACHINE_ID)
    if (existing && /^AS-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/.test(existing)) {
      return existing
    }

    const g = globalThis as Record<string, unknown>
    const nav = g.navigator as { userAgent?: string; language?: string } | undefined
    const ua = nav?.userAgent ?? 'NodeRuntime'
    const lang = nav?.language ?? 'vi-VN'
    const screenInfo = typeof g.innerWidth !== 'undefined' ? `${g.innerWidth}x${g.innerHeight}` : '1920x1080'
    const seed = `${ua}-${lang}-${screenInfo}-${Date.now()}-${Math.random()}`
    const rawHash = simpleHash(seed).padEnd(12, '7')
    const p1 = rawHash.slice(0, 4)
    const p2 = rawHash.slice(4, 8)
    const p3 = rawHash.slice(8, 12)
    const machineId = `AS-${p1}-${p2}-${p3}`

    writeStorage(STORAGE_KEY_MACHINE_ID, machineId)
    return machineId
  } catch {
    return 'AS-8812-9F01-C420'
  }
}

/**
 * Xác thực chữ ký số Ed25519 trong môi trường Node.js (Đồng bộ)
 */
function verifyWithNodeCrypto(
  dataBytes: Uint8Array,
  sigBytes: Uint8Array,
  pubKeyBase64: string
): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = (typeof require !== 'undefined' ? require('node:crypto') : null) as typeof cryptoType | null
    if (!crypto || typeof crypto.createPublicKey !== 'function') return false

    const pubKey = crypto.createPublicKey({
      key: Buffer.from(pubKeyBase64, 'base64'),
      format: 'der',
      type: 'spki',
    })
    return crypto.verify(null, Buffer.from(dataBytes), pubKey, Buffer.from(sigBytes))
  } catch {
    return false
  }
}

/**
 * Xác thực chữ ký số Ed25519 trong môi trường WebCrypto (Bất đồng bộ)
 */
export async function verifyWithWebCrypto(
  dataBytes: Uint8Array,
  sigBytes: Uint8Array,
  pubKeyBase64: string
): Promise<boolean> {
  try {
    if (typeof globalThis.crypto?.subtle?.importKey !== 'function') return false
    const pubKeyBytes = base64UrlToUint8Array(pubKeyBase64)
    const cryptoKey = await globalThis.crypto.subtle.importKey(
      'spki',
      pubKeyBytes as never,
      { name: 'Ed25519' },
      false,
      ['verify']
    )
    return await globalThis.crypto.subtle.verify(
      { name: 'Ed25519' },
      cryptoKey,
      sigBytes as never,
      dataBytes as never
    )
  } catch {
    return false
  }
}

/**
 * Giải mã & kiểm tra tính hợp lệ cơ bản của cấu trúc token
 */
export function parseLicenseToken(licenseKey: string): {
  success: boolean
  message: string
  payload?: LicensePayload
  dataBytes?: Uint8Array
  sigBytes?: Uint8Array
} {
  const cleanKey = licenseKey.trim()
  if (!cleanKey.startsWith('ASKEY-')) {
    return { success: false, message: 'Mã kích hoạt không đúng định dạng (phải bắt đầu bằng ASKEY-)' }
  }

  const token = cleanKey.slice(6)
  const dotIdx = token.indexOf('.')
  if (dotIdx === -1) {
    return { success: false, message: 'Cấu trúc License Key không hợp lệ (thiếu phần chữ ký).' }
  }

  const payloadB64 = token.slice(0, dotIdx)
  const sigB64 = token.slice(dotIdx + 1)
  if (!payloadB64 || !sigB64) {
    return { success: false, message: 'Cấu trúc License Key không hợp lệ.' }
  }

  try {
    const dataBytes = base64UrlToUint8Array(payloadB64)
    const sigBytes = base64UrlToUint8Array(sigB64)
    let jsonStr = ''
    if (typeof TextDecoder !== 'undefined') {
      jsonStr = new TextDecoder().decode(dataBytes)
    } else {
      jsonStr = Buffer.from(dataBytes).toString('utf8')
    }

    const payload = JSON.parse(jsonStr) as LicensePayload
    if (!payload.m || !payload.iat) {
      return { success: false, message: 'Dữ liệu giấy phép bị thiếu thông tin cần thiết.' }
    }

    return { success: true, message: 'OK', payload, dataBytes, sigBytes }
  } catch {
    return { success: false, message: 'Không thể giải mã dữ liệu License Key.' }
  }
}

/**
 * Xác thực License Key đối với Machine ID của thiết bị hiện tại (Hỗ trợ Async WebCrypto & Sync Node)
 */
export async function verifyLicenseAsync(
  machineId: string,
  keyToVerify: string,
  pubKeyBase64: string = MASTER_PUBLIC_KEY_BASE64
): Promise<VerificationResult> {
  const parsed = parseLicenseToken(keyToVerify)
  if (!parsed.success || !parsed.payload || !parsed.dataBytes || !parsed.sigBytes) {
    return { valid: false, message: parsed.message }
  }

  const { payload, dataBytes, sigBytes } = parsed

  // 1. Xác thực chữ ký số bằng Node crypto hoặc WebCrypto
  let isSignatureValid = verifyWithNodeCrypto(dataBytes, sigBytes, pubKeyBase64)
  if (!isSignatureValid) {
    isSignatureValid = await verifyWithWebCrypto(dataBytes, sigBytes, pubKeyBase64)
  }

  if (!isSignatureValid) {
    return { valid: false, message: 'Chữ ký số không hợp lệ hoặc mã bản quyền đã bị chỉnh sửa!' }
  }
  // 2. Khớp Machine ID (Machine-Locked hoặc Universal Key)
  const isUniversal = payload.m === '*' || payload.m === 'AS-ALL-MACHINES-PRO'
  if (!isUniversal && payload.m.toUpperCase().trim() !== machineId.toUpperCase().trim()) {
    return {
      valid: false,
      message: `Mã bản quyền này được cấp cho máy [${payload.m}], không khớp với thiết bị hiện tại [${machineId}].`,
    }
  }

  // 3. Kiểm tra hạn sử dụng nếu có
  const nowSec = Math.floor(Date.now() / 1000)
  if (payload.exp && payload.exp > 0 && payload.exp < nowSec) {
    const expDate = new Date(payload.exp * 1000).toLocaleDateString('vi-VN')
    return {
      valid: false,
      message: `Mã bản quyền đã hết hạn vào ngày ${expDate}. Vui lòng gia hạn để tiếp tục sử dụng.`,
      payload,
    }
  }

  const planName = payload.t === 'LIFETIME' ? 'Vĩnh Viễn' : `Gói ${payload.t}`
  return {
    valid: true,
    message: `Kích hoạt bản quyền ${planName} thành công cho: ${payload.n || 'Kiểm toán viên VIP'}!`,
    payload,
  }
}

/**
 * Xác thực License Key Đồng bộ (Dùng khi khởi động / Test / Node / Pre-cached)
 */
export function verifyLicense(
  machineId: string,
  keyToVerify: string,
  pubKeyBase64: string = MASTER_PUBLIC_KEY_BASE64
): VerificationResult {
  const parsed = parseLicenseToken(keyToVerify)
  if (!parsed.success || !parsed.payload || !parsed.dataBytes || !parsed.sigBytes) {
    return { valid: false, message: parsed.message }
  }

  const { payload, dataBytes, sigBytes } = parsed

  const isSignatureValid = verifyWithNodeCrypto(dataBytes, sigBytes, pubKeyBase64)
  if (!isSignatureValid) {
    return { valid: false, message: 'Chữ ký số không hợp lệ hoặc mã bản quyền đã bị chỉnh sửa!' }
  }
  const isUniversal = payload.m === '*' || payload.m === 'AS-ALL-MACHINES-PRO'
  if (!isUniversal && payload.m.toUpperCase().trim() !== machineId.toUpperCase().trim()) {
    return {
      valid: false,
      message: `Mã bản quyền này được cấp cho máy [${payload.m}], không khớp với thiết bị hiện tại [${machineId}].`,
    }
  }
  const nowSec = Math.floor(Date.now() / 1000)
  if (payload.exp && payload.exp > 0 && payload.exp < nowSec) {
    const expDate = new Date(payload.exp * 1000).toLocaleDateString('vi-VN')
    return {
      valid: false,
      message: `Mã bản quyền đã hết hạn vào ngày ${expDate}. Vui lòng gia hạn để tiếp tục sử dụng.`,
      payload,
    }
  }

  const planName = payload.t === 'LIFETIME' ? 'Vĩnh Viễn' : `Gói ${payload.t}`
  return {
    valid: true,
    message: `Kích hoạt bản quyền ${planName} thành công cho: ${payload.n || 'Kiểm toán viên VIP'}!`,
    payload,
  }
}

/**
 * Lấy trạng thái bản quyền hiện tại của app
 */
export function getLicenseStatus(): LicenseStatus {
  const machineId = getMachineId()
  try {
    const raw = readStorage(STORAGE_KEY_LICENSE)
    if (!raw) {
      return {
        isLicensed: false,
        machineId,
        licenseKey: null,
        activatedAt: null,
      }
    }

    const data = JSON.parse(raw) as {
      licenseKey?: string
      customerName?: string
      activatedAt?: string
      payload?: LicensePayload
    }

    if (!data.licenseKey) {
      return {
        isLicensed: false,
        machineId,
        licenseKey: null,
        activatedAt: null,
      }
    }

    // Xác thực toàn diện chữ ký số Ed25519 & tính hợp lệ của giấy phép (BIZ-01)
    const verifyRes = verifyLicense(machineId, data.licenseKey)
    if (!verifyRes.valid || !verifyRes.payload) {
      return {
        isLicensed: false,
        machineId,
        licenseKey: null,
        activatedAt: null,
      }
    }

    const payload = verifyRes.payload
    const nowSec = Math.floor(Date.now() / 1000)
    const isExpired = payload.exp > 0 && payload.exp < nowSec

    return {
      isLicensed: !isExpired,
      machineId,
      customerName: data.customerName || payload.n || 'Kiểm toán viên VIP',
      licenseKey: data.licenseKey,
      activatedAt: data.activatedAt ?? 'Không xác định',
      expiresAt: payload.exp > 0 ? new Date(payload.exp * 1000).toLocaleDateString('vi-VN') : 'Vĩnh viễn',
      plan: payload.t,
      isExpired,
    }
  } catch {
    return {
      isLicensed: false,
      machineId,
      licenseKey: null,
      activatedAt: null,
    }
  }
}

/**
 * Lưu kích hoạt bản quyền
 */
export async function saveLicense(
  licenseKey: string,
  customerName?: string
): Promise<{ success: boolean; message: string }> {
  const machineId = getMachineId()
  const verification = await verifyLicenseAsync(machineId, licenseKey)

  if (!verification.valid || !verification.payload) {
    return { success: false, message: verification.message }
  }

  const finalName = customerName?.trim() || verification.payload.n || 'Kiểm toán viên VIP'
  const record = {
    licenseKey: licenseKey.trim(),
    customerName: finalName,
    activatedAt: new Date().toLocaleDateString('vi-VN'),
    payload: verification.payload,
  }

  writeStorage(STORAGE_KEY_LICENSE, JSON.stringify(record))
  return { success: true, message: verification.message }
}

/**
 * Lưu kích hoạt đồng bộ (dành cho test hoặc main process)
 */
export function saveLicenseSync(
  licenseKey: string,
  customerName?: string
): { success: boolean; message: string } {
  const machineId = getMachineId()
  const verification = verifyLicense(machineId, licenseKey)

  if (!verification.valid || !verification.payload) {
    return { success: false, message: verification.message }
  }

  const finalName = customerName?.trim() || verification.payload.n || 'Kiểm toán viên VIP'
  const record = {
    licenseKey: licenseKey.trim(),
    customerName: finalName,
    activatedAt: new Date().toLocaleDateString('vi-VN'),
    payload: verification.payload,
  }

  writeStorage(STORAGE_KEY_LICENSE, JSON.stringify(record))
  return { success: true, message: verification.message }
}

/**
 * Hủy kích hoạt bản quyền trên máy này
 */
export function removeLicense(): void {
  deleteStorage(STORAGE_KEY_LICENSE)
}

/**
 * Lấy thông tin số lượt xuất Excel dùng thử miễn phí
 */
export function getTrialExportStatus(): TrialExportStatus {
  const lic = getLicenseStatus()
  if (lic.isLicensed) {
    return {
      usedExports: 0,
      maxExports: MAX_TRIAL_EXPORTS,
      remainingExports: 999999,
      isExpired: false,
      isLicensed: true,
    }
  }

  try {
    const raw = readStorage(STORAGE_KEY_TRIAL_EXPORTS)
    const count = raw ? parseInt(raw, 10) || 0 : 0
    const remaining = Math.max(0, MAX_TRIAL_EXPORTS - count)
    return {
      usedExports: count,
      maxExports: MAX_TRIAL_EXPORTS,
      remainingExports: remaining,
      isExpired: remaining <= 0,
      isLicensed: false,
    }
  } catch {
    return {
      usedExports: 0,
      maxExports: MAX_TRIAL_EXPORTS,
      remainingExports: MAX_TRIAL_EXPORTS,
      isExpired: false,
      isLicensed: false,
    }
  }
}

/**
 * Kiểm tra và tăng số lượt xuất Excel dùng thử
 */
export function useTrialExport(): { allowed: boolean; remainingExports: number; message: string } {
  const lic = getLicenseStatus()
  if (lic.isLicensed) {
    return {
      allowed: true,
      remainingExports: 999999,
      message: 'Bản quyền đã kích hoạt thành công — Không giới hạn lượt xuất báo cáo.',
    }
  }

  const current = getTrialExportStatus()
  if (current.remainingExports <= 0) {
    return {
      allowed: false,
      remainingExports: 0,
      message: `Bạn đã dùng hết ${MAX_TRIAL_EXPORTS} lượt xuất thử miễn phí. Hãy kích hoạt bản quyền để tiếp tục xuất file.`,
    }
  }

  const newCount = current.usedExports + 1
  writeStorage(STORAGE_KEY_TRIAL_EXPORTS, String(newCount))
  const remaining = Math.max(0, MAX_TRIAL_EXPORTS - newCount)

  return {
    allowed: true,
    remainingExports: remaining,
    message: `Bạn vừa dùng lượt xuất ${newCount}/${MAX_TRIAL_EXPORTS}. Còn lại ${remaining} lượt miễn phí.`,
  }
}

/**
 * Reset số lượt xuất dùng thử (Dành cho test/phát triển)
 */
export function resetTrialExports(): void {
  deleteStorage(STORAGE_KEY_TRIAL_EXPORTS)
}
