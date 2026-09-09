import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const KEYS_DIR = path.resolve(__dirname, 'keys')
const PRIV_KEY_PATH = path.join(KEYS_DIR, 'master_private_key.pem')
const PUB_KEY_PATH = path.join(KEYS_DIR, 'master_public_key.pem')

if (!fs.existsSync(KEYS_DIR)) {
  fs.mkdirSync(KEYS_DIR, { recursive: true })
}

if (fs.existsSync(PRIV_KEY_PATH)) {
  console.log(`⚠️  Khóa Private Key đã tồn tại tại: ${PRIV_KEY_PATH}`)
  console.log('Nếu bạn muốn tạo mới hoàn toàn, hãy xóa file cũ trước.')
  process.exit(0)
}

const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519')
const privPem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string
const pubPem = publicKey.export({ type: 'spki', format: 'pem' }) as string
const pubDer = publicKey.export({ type: 'spki', format: 'der' }) as Buffer
const pubBase64 = pubDer.toString('base64')

fs.writeFileSync(PRIV_KEY_PATH, privPem, 'utf8')
fs.writeFileSync(PUB_KEY_PATH, pubPem, 'utf8')

console.log(`
══════════════════════════════════════════════════════════════════
  ĐÃ SINH THÀNH CÔNG BỘ MASTER KEY CHO AUDITSOFT NKC
══════════════════════════════════════════════════════════════════
  Private Key: ${PRIV_KEY_PATH} (TUYỆT ĐỐI KHÔNG CHIA SẺ)
  Public Key : ${PUB_KEY_PATH}

  PUBLIC KEY BASE64 (Dùng để nhúng vào src/shared/license.ts):
  "${pubBase64}"
══════════════════════════════════════════════════════════════════
`)
