import { app } from 'electron'
import type { AppUpdateInfo, UpdateManifest } from '../shared/types/update'

/**
 * URL manifest thông tin phiên bản mới nhất.
 * Có thể ghi đè bằng biến môi trường AUDITSOFT_UPDATE_URL khi triển khai.
 */
export const DEFAULT_MANIFEST_URL =
  process.env.AUDITSOFT_UPDATE_URL ||
  'https://raw.githubusercontent.com/dacthinh05/AuditSoft/main/version.json'

/**
 * So sánh 2 chuỗi phiên bản dạng semver (ví dụ: '1.0.0' vs '0.1.0')
 * Trả về:
 *   1  nếu v2 > v1 (có bản mới hơn)
 *  -1  nếu v1 > v2 (v1 mới hơn v2)
 *   0  nếu v1 == v2
 */
export function compareVersions(v1: string, v2: string): number {
  const clean1 = v1.replace(/^v/i, '').trim()
  const clean2 = v2.replace(/^v/i, '').trim()

  const parts1 = clean1.split('.').map((p) => parseInt(p, 10) || 0)
  const parts2 = clean2.split('.').map((p) => parseInt(p, 10) || 0)

  const maxLen = Math.max(parts1.length, parts2.length)
  for (let i = 0; i < maxLen; i++) {
    const p1 = parts1[i] ?? 0
    const p2 = parts2[i] ?? 0
    if (p2 > p1) return 1
    if (p1 > p2) return -1
  }
  return 0
}

/**
 * Kiểm tra cập nhật phiên bản mới từ máy chủ từ xa
 */
export async function checkForAppUpdates(customUrl?: string): Promise<AppUpdateInfo> {
  const currentVersion = app.getVersion() || '1.0.0'
  const manifestUrl = customUrl || DEFAULT_MANIFEST_URL
  const now = new Date().toISOString()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(manifestUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': `AuditSoft/${currentVersion}`,
      },
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      return {
        currentVersion,
        latestVersion: currentVersion,
        hasUpdate: false,
        checkedAt: now,
        error: `Máy chủ phản hồi mã ${response.status}`,
      }
    }

    const manifest = (await response.json()) as UpdateManifest
    if (!manifest || typeof manifest.version !== 'string') {
      return {
        currentVersion,
        latestVersion: currentVersion,
        hasUpdate: false,
        checkedAt: now,
        error: 'Dữ liệu phiên bản không hợp lệ',
      }
    }

    const hasUpdate = compareVersions(currentVersion, manifest.version) > 0

    return {
      currentVersion,
      latestVersion: manifest.version,
      hasUpdate,
      releaseDate: manifest.releaseDate,
      title: manifest.title || (hasUpdate ? `Phát hành phiên bản ${manifest.version}` : undefined),
      changelog: manifest.changelog || [],
      downloadUrl: manifest.downloadUrl,
      portableUrl: manifest.portableUrl,
      checkedAt: now,
    }
  } catch (err: unknown) {
    // Xử lý an toàn khi mất mạng hoặc không kết nối được
    const errMsg = err instanceof Error ? err.message : String(err)
    return {
      currentVersion,
      latestVersion: currentVersion,
      hasUpdate: false,
      checkedAt: now,
      error: errMsg.includes('abort') ? 'Hết thời gian kết nối (Timeout)' : 'Không có kết nối mạng',
    }
  }
}
