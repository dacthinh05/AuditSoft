export interface UpdateManifest {
  version: string
  releaseDate?: string
  title?: string
  changelog?: string[]
  downloadUrl?: string
  portableUrl?: string
  /** SHA-256 hex của file installer — main từ chối chạy khi lệch hoặc thiếu (SEC-H2). */
  sha256?: string
  critical?: boolean
  minSupportedVersion?: string
}

export interface AppUpdateInfo {
  currentVersion: string
  latestVersion: string
  hasUpdate: boolean
  releaseDate?: string
  title?: string
  changelog?: string[]
  downloadUrl?: string
  portableUrl?: string
  checkedAt: string
  error?: string
}

export interface UpdateProgress {
  percent: number
  transferredBytes: number
  totalBytes: number
  stage: 'downloading' | 'verifying' | 'installing' | 'error'
  message?: string
}

export interface InstallUpdateResult {
  success: boolean
  message: string
}
