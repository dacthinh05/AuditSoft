#!/usr/bin/env node
/**
 * CÔNG CỤ TẠO MÃ KÍCH HOẠT BẢN QUYỀN BẢO MẬT (ED25519 ASYMMETRIC SIGNING)
 * Tác giả: Thịnh Lynx (0817.567.008 - MB Bank)
 * AuditSoft NKC — Hệ thống Đối chiếu & Kiểm toán Chuyên sâu
 */

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import {
  MASTER_PUBLIC_KEY_BASE64,
  verifyLicense,
  type LicensePayload,
  type LicensePlan,
} from '../src/shared/license'

const KEYS_DIR = path.resolve(__dirname, 'keys')
const PRIV_KEY_PATH = path.join(KEYS_DIR, 'master_private_key.pem')

function getOrGeneratePrivateKey(): string {
  if (fs.existsSync(PRIV_KEY_PATH)) {
    return fs.readFileSync(PRIV_KEY_PATH, 'utf8')
  }

  if (!fs.existsSync(KEYS_DIR)) {
    fs.mkdirSync(KEYS_DIR, { recursive: true })
  }
  const { privateKey } = crypto.generateKeyPairSync('ed25519')
  const privPem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string
  fs.writeFileSync(PRIV_KEY_PATH, privPem, 'utf8')
  return privPem
}

/**
 * Ký số tạo License Key bằng Master Private Key
 */
export function generateSecureLicenseKey(
  machineId: string,
  customerName: string = 'Kiểm toán viên VIP',
  options: {
    days?: number
    expiresAt?: number
    plan?: LicensePlan
  } = {}
): string {
  const privPem = getOrGeneratePrivateKey()
  const days = options.days ?? 0
  const plan = options.plan ?? (days !== 0 || options.expiresAt ? 'ANNUAL' : 'LIFETIME')
  let expiresAt = 0
  if (typeof options.expiresAt === 'number') {
    expiresAt = options.expiresAt
  } else if (days !== 0) {
    expiresAt = Math.floor(Date.now() / 1000) + days * 86400
  }

  const payload: LicensePayload = {
    m: machineId.toUpperCase().trim(),
    n: customerName.trim(),
    t: plan,
    exp: expiresAt,
    iat: Math.floor(Date.now() / 1000),
  }

  const jsonBytes = Buffer.from(JSON.stringify(payload), 'utf8')
  const signature = crypto.sign(null, jsonBytes, privPem)

  const payloadB64 = jsonBytes.toString('base64url')
  const sigB64 = signature.toString('base64url')

  return `ASKEY-${payloadB64}.${sigB64}`
}

export function runCli(): void {
  const allArgs = process.argv.slice(2)
  const rawArgs = allArgs.filter(a => !a.includes('keygen') && !a.includes('vite-node'))

  if (rawArgs.length === 0 || rawArgs.includes('--help') || rawArgs.includes('-h')) {
    console.log(`
══════════════════════════════════════════════════════════════════
  CÔNG CỤ TẠO MÃ KÍCH HOẠT BẢN QUYỀN BẢO MẬT — AUDITSOFT NKC
  Thuật toán: Chữ ký số Bất đối xứng Ed25519 (Asymmetric Cryptography)
  Tác giả: Thịnh Lynx (0817.567.008 - MB Bank)
══════════════════════════════════════════════════════════════════

Cú pháp:
  npm run keygen <MÃ_MÁY_MACHINE_ID> [Tên_Khách_Hàng] [Tùy_chọn]

Tùy chọn:
  --lifetime          Gói Bản Quyền Vĩnh Viễn (Mặc định)
  --days=<số_ngày>   Gói có thời hạn (Ví dụ: --days=365 cho 1 năm)
  --plan=<PRO|ENT>    Phân hạng gói (PRO hoặc ENTERPRISE)

Ví dụ:
  # 1. Tạo bản quyền vĩnh viễn
  npm run keygen AS-9F2A-88B1-C410 "Kiểm toán viên Nguyễn Văn A"

  # 2. Tạo bản quyền 1 năm (365 ngày)
  npm run keygen AS-9F2A-88B1-C410 "Công ty Kiểm toán An Phát" --days=365

  # 3. Tạo bản quyền Enterprise Vĩnh viễn
  npm run keygen AS-9F2A-88B1-C410 "Big4 Audit Vietnam" --plan=ENTERPRISE --lifetime
══════════════════════════════════════════════════════════════════
`)
    return
  }

  let machineId = ''
  let customerName = ''
  let days = 0
  let plan: LicensePlan = 'LIFETIME'

  for (const arg of rawArgs) {
    const trimmed = arg.trim()
    if (trimmed.startsWith('--days=')) {
      days = parseInt(trimmed.split('=')[1] ?? '0', 10) || 0
      if (days > 0) plan = 'ANNUAL'
    } else if (trimmed === '--lifetime') {
      days = 0
      plan = 'LIFETIME'
    } else if (trimmed.startsWith('--plan=')) {
      plan = (trimmed.split('=')[1]?.toUpperCase() ?? 'PRO') as LicensePlan
    } else if (/^AS-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/i.test(trimmed) || trimmed.startsWith('AS-')) {
      machineId = trimmed
    } else if (/^\d+$/.test(trimmed) && parseInt(trimmed, 10) > 0 && !customerName) {
      days = parseInt(trimmed, 10)
      plan = 'ANNUAL'
    } else if (['PRO', 'ENTERPRISE', 'ANNUAL', 'LIFETIME'].includes(trimmed.toUpperCase())) {
      plan = trimmed.toUpperCase() as LicensePlan
    } else if (!customerName) {
      customerName = trimmed
    } else {
      customerName += ` ${trimmed}`
    }
  }

  if (!customerName) {
    customerName = 'Kiểm toán viên VIP'
  }

  if (!machineId) {
    console.error('❌ Lỗi: Bạn chưa cung cấp Machine ID hợp lệ (Ví dụ: AS-9F2A-88B1-C410)!')
    return
  }

  const licenseKey = generateSecureLicenseKey(machineId, customerName, { days, plan })
  const verifyRes = verifyLicense(machineId, licenseKey, MASTER_PUBLIC_KEY_BASE64)

  const expString = days > 0
    ? `${new Date(Date.now() + days * 86400 * 1000).toLocaleDateString('vi-VN')} (${days} ngày)`
    : 'VĨNH VIỄN (Không giới hạn thời gian)'

  console.log(`
════════════════════════════════════════════════════════════════════════════════════
  🎉 KẾT QUẢ TẠO LICENSE KEY THÀNH CÔNG — AUDITSOFT NKC
════════════════════════════════════════════════════════════════════════════════════
  Mã máy (Machine ID) : ${machineId}
  Tên khách hàng      : ${customerName}
  Gói bản quyền       : ${plan}
  Thời hạn sử dụng    : ${expString}
  Chữ ký số Ed25519   : ${verifyRes.valid ? '✓ HỢP LỆ TUYỆT ĐỐI (Verified with Public Key)' : '✗ LỖI XÁC THỰC'}
════════════════════════════════════════════════════════════════════════════════════
  🔑 MÃ KÍCH HOẠT (LICENSE KEY):

${licenseKey}

════════════════════════════════════════════════════════════════════════════════════
  👉 Hãy copy toàn bộ chuỗi trên gửi cho khách hàng qua Zalo để kích hoạt!
════════════════════════════════════════════════════════════════════════════════════
`)
}

const isVitest = typeof process.env.VITEST !== 'undefined' || process.argv.some(a => a.includes('vitest'))
if (!isVitest) {
  runCli()
}
