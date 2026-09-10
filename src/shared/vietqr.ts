import QRCode from 'qrcode'

export interface PricingPlan {
  id: 'annual' | 'lifetime' | 'early_bird'
  name: string
  price: number
  originalPrice: number
  discountPercent: number
  duration: string
  badge?: string
  description: string
  isPopular?: boolean
  isHero?: boolean
  isDecoy?: boolean
  slots?: { total: number; remaining: number }
  savingsVsAnnual?: number
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'annual',
    name: 'Gói Theo Năm',
    price: 1_090_000,
    originalPrice: 1_090_000,
    discountPercent: 0,
    duration: '1 Năm / 1 Máy',
    description: 'Dùng trọn mùa kiểm toán, phải gia hạn mỗi năm.',
    isDecoy: true,
  },
  {
    id: 'lifetime',
    name: 'Bản Quyền Vĩnh Viễn',
    price: 2_890_000,
    originalPrice: 2_890_000,
    discountPercent: 0,
    duration: 'Trọn đời / 1 Máy',
    badge: 'GIÁ GỐC',
    description: 'Mua 1 lần, dùng vĩnh viễn. Miễn phí nâng cấp trọn đời, hỗ trợ ưu tiên.',
  },
  {
    id: 'early_bird',
    name: 'Early Bird — Vĩnh Viễn',
    price: 899_000,
    originalPrice: 2_890_000,
    discountPercent: 70,
    duration: 'Trọn đời / 1 Máy',
    badge: '🔥 EARLY BIRD',
    description: 'Đủ mọi quyền lợi như gói Vĩnh Viễn — ưu đãi chỉ dành cho những người đầu tiên.',
    isPopular: true,
    isHero: true,
    slots: { total: 50, remaining: 23 },
    savingsVsAnnual: 700_000,
  },
]

function formatTlv(id: string, value: string): string {
  const len = String(value.length).padStart(2, '0')
  return `${id}${len}${value}`
}

function crc16Ccitt(data: string): string {
  let crc = 0xffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff
      } else {
        crc = (crc << 1) & 0xffff
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/**
 * Sinh chuỗi payload VietQR chuẩn EMVCo
 * Ngân hàng: MB Bank (BIN: 970422), STK: 0817567008
 */
export function buildVietQrPayload(options: {
  amount?: number
  memo?: string
}): string {
  const guid = formatTlv('00', 'A000000727')
  const bankAndAcc = formatTlv('00', '970422') + formatTlv('01', '0817567008')
  const consumer = formatTlv('01', bankAndAcc)
  const service = formatTlv('02', 'QRIBFTTA')
  const f38 = formatTlv('38', guid + consumer + service)

  let payload =
    formatTlv('00', '01') +
    formatTlv('01', options.amount ? '12' : '11') +
    f38 +
    formatTlv('53', '704')

  if (options.amount && options.amount > 0) {
    payload += formatTlv('54', String(Math.round(options.amount)))
  }

  payload += formatTlv('58', 'VN')

  if (options.memo) {
    // Chuẩn hóa memo không dấu để tương thích mọi app ngân hàng
    const cleanMemo = options.memo
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-zA-Z0-9 -]/g, '')
      .slice(0, 25)
    payload += formatTlv('62', formatTlv('08', cleanMemo))
  }

  payload += '6304'
  const checksum = crc16Ccitt(payload)
  return payload + checksum
}

/**
 * Tạo Data URL (PNG Base64) của QR Code để render tức thì trong Electron/React
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 280,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  })
}
