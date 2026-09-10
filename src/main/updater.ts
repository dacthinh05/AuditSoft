import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import type { AppUpdateInfo, UpdateManifest, UpdateProgress, InstallUpdateResult } from '../shared/types/update'

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

/**
 * Tải trực tiếp gói cài đặt Setup.exe từ máy chủ, hiển thị tiến trình % và kích hoạt cài đặt tự động
 */
export const OFFICIAL_RELEASE_PREFIX = 'https://github.com/dacthinh05/AuditSoft/releases/'

export async function downloadAndInstallUpdate(
  downloadUrl: string,
  onProgress?: (progress: UpdateProgress) => void
): Promise<InstallUpdateResult> {
  let targetUrl = downloadUrl.trim()
  if (targetUrl.endsWith('/latest') || targetUrl.includes('/releases/tag/')) {
    targetUrl = 'https://github.com/dacthinh05/AuditSoft/releases/latest/download/AuditSoft-Setup.exe'
  }

  // Bảo vệ an ninh (SEC-01): Chỉ chấp nhận URL tải về từ GitHub Releases chính thức của dự án
  if (!targetUrl.startsWith(OFFICIAL_RELEASE_PREFIX)) {
    throw new Error(`Địa chỉ tải cập nhật không an toàn: Nguồn phát hành không thuộc kho chính thức (${OFFICIAL_RELEASE_PREFIX}).`)
  }

  const tempDir = app.getPath('temp')
  const installerPath = path.join(tempDir, `AuditSoft_Update_Setup_${Date.now()}.exe`)

  try {
    onProgress?.({
      stage: 'downloading',
      percent: 0,
      transferredBytes: 0,
      totalBytes: 0,
      message: 'Đang kết nối đến máy chủ cập nhật...',
    })

    const response = await fetch(targetUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': `AuditSoft/${app.getVersion() || '1.0.0'}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Máy chủ báo lỗi HTTP ${response.status}: ${response.statusText}`)
    }

    const totalBytes = parseInt(response.headers.get('content-length') || '0', 10)
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Không thể đọc dữ liệu phản hồi từ máy chủ')
    }

    const fileStream = fs.createWriteStream(installerPath)
    let transferredBytes = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        fileStream.write(Buffer.from(value))
        transferredBytes += value.byteLength
        const percent = totalBytes > 0 ? Math.min(100, Math.round((transferredBytes / totalBytes) * 100)) : 0
        onProgress?.({
          stage: 'downloading',
          percent,
          transferredBytes,
          totalBytes,
          message: totalBytes > 0
            ? `Đang tải: ${percent}% (${(transferredBytes / (1024 * 1024)).toFixed(1)} MB / ${(totalBytes / (1024 * 1024)).toFixed(1)} MB)`
            : `Đang tải: ${(transferredBytes / (1024 * 1024)).toFixed(1)} MB...`,
        })
      }
    }

    await new Promise<void>((resolve, reject) => {
      fileStream.end(() => resolve())
      fileStream.on('error', reject)
    })

    onProgress?.({
      stage: 'verifying',
      percent: 100,
      transferredBytes,
      totalBytes,
      message: 'Đã tải xong 100%. Đang khởi chạy bộ cài đặt và khởi động lại...',
    })

    // Kích hoạt bộ cài đặt installer
    const child = spawn(installerPath, [], {
      detached: true,
      stdio: 'ignore',
    })
    child.unref()

    // Thoát app sau 1.2s để installer ghi đè file nhị phân
    setTimeout(() => {
      app.quit()
    }, 1200)

    return {
      success: true,
      message: 'Khởi chạy bộ cài đặt thành công!',
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    onProgress?.({
      stage: 'error',
      percent: 0,
      transferredBytes: 0,
      totalBytes: 0,
      message: `Lỗi tải: ${errorMsg}`,
    })
    try {
      if (fs.existsSync(installerPath)) fs.unlinkSync(installerPath)
    } catch {}
    return {
      success: false,
      message: errorMsg,
    }
  }
}
