export interface UpdateManifest {
  version: string
  releaseDate?: string
  title?: string
  changelog?: string[]
  downloadUrl?: string
  portableUrl?: string
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
