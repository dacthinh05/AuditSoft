import fs from 'fs'
import path from 'path'

export interface LocalHtkkInfo {
  isInstalled: boolean
  installPath?: string
  appVersion?: string // Ví dụ "5.7.1", "5.7.6"
  recentFiles?: {
    mst: string
    fileName: string
    fullPath: string
    modifiedAt: string
  }[]
  checkedPaths: string[]
}

/**
 * Service quét và tự động nhận diện phần mềm HTKK cài đặt cục bộ trên máy tính
 */
export class LocalHtkkScanner {
  public static readonly CANDIDATE_PATHS = [
    'C:\\Program Files (x86)\\HTKK',
    'C:\\Program Files\\HTKK',
    'C:\\HTKK',
    'D:\\HTKK',
    'D:\\Desktop\\HTKK',
  ]

  /**
   * Phát hiện thư mục cài đặt và phiên bản HTKK trên máy tính
   */
  public static detect(customPath?: string): LocalHtkkInfo {
    const checkedPaths: string[] = []

    // Nếu người dùng cung cấp đường dẫn tùy chỉnh, ưu tiên kiểm tra trước
    const pathsToCheck = customPath
      ? [customPath, ...LocalHtkkScanner.CANDIDATE_PATHS]
      : LocalHtkkScanner.CANDIDATE_PATHS

    for (const p of pathsToCheck) {
      checkedPaths.push(p)
      try {
        if (fs.existsSync(p)) {
          const version = LocalHtkkScanner.readAppVersion(p)
          const recentFiles = LocalHtkkScanner.scanRecentDataFiles(p)

          return {
            isInstalled: true,
            installPath: p,
            appVersion: version,
            recentFiles,
            checkedPaths,
          }
        }
      } catch {
        // Tiếp tục kiểm tra đường dẫn khác nếu có lỗi phân quyền
      }
    }

    return {
      isInstalled: false,
      checkedPaths,
    }
  }

  /**
   * Đọc số hiệu phiên bản HTKK từ tệp cấu hình AutoUpdate/AppSchedulerCf.xml
   */
  public static readAppVersion(installPath: string): string | undefined {
    try {
      const cfPath = path.join(installPath, 'AutoUpdate', 'AppSchedulerCf.xml')
      if (fs.existsSync(cfPath)) {
        const content = fs.readFileSync(cfPath, 'utf8')
        const match = content.match(/<AppVersion>([^<]+)<\/AppVersion>/i)
        if (match && match[1]) {
          return match[1].trim()
        }
      }
    } catch {
      // Bỏ qua lỗi đọc file
    }
    return undefined
  }

  /**
   * Quét các tệp tờ khai XML gần nhất trong thư mục DataFiles
   */
  public static scanRecentDataFiles(
    installPath: string,
    limit = 5,
  ): { mst: string; fileName: string; fullPath: string; modifiedAt: string }[] {
    const results: { mst: string; fileName: string; fullPath: string; modifiedAt: string }[] = []
    try {
      const dataFilesPath = path.join(installPath, 'DataFiles')
      if (!fs.existsSync(dataFilesPath)) return results

      const msts = fs.readdirSync(dataFilesPath)
      for (const mst of msts) {
        const mstDir = path.join(dataFilesPath, mst)
        if (fs.statSync(mstDir).isDirectory()) {
          const files = fs.readdirSync(mstDir)
          for (const f of files) {
            if (f.toLowerCase().endsWith('.xml') && f !== 'HEADER.xml') {
              const fullPath = path.join(mstDir, f)
              const stat = fs.statSync(fullPath)
              results.push({
                mst,
                fileName: f,
                fullPath,
                modifiedAt: stat.mtime.toISOString(),
              })
            }
          }
        }
      }

      // Sắp xếp tệp mới nhất lên đầu
      results.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
      return results.slice(0, limit)
    } catch {
      return []
    }
  }

  /**
   * Đọc nội dung một tệp XML từ HTKK
   */
  public static readXmlFile(filePath: string): string | null {
    try {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8')
      }
    } catch {
      return null
    }
    return null
  }
}
