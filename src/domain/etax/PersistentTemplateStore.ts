import { getQtt03TT80BlankTemplate } from './templates/qtt03_tt80'
import { EtaxXmlParser } from './EtaxXmlParser'

export interface SavedTemplateData {
  xmlContent: string
  savedAt: string
  sourceFileName?: string
  pbanTKhaiXML?: string
  pbanDVu?: string
  appVersion?: string
}

/**
 * Lớp quản trị và lưu trữ bền vững khuôn mẫu XML tùy chỉnh của người dùng
 */
export class PersistentTemplateStore {
  public static readonly STORAGE_KEY = 'auditsoft_qtt03_custom_template'

  // Bộ nhớ đệm dùng cho môi trường Node.js / Tests (khi không có window.localStorage)
  private static memoryFallback: SavedTemplateData | null = null

  /**
   * Lưu một tệp XML mới làm khuôn mẫu mặc định cho các lần chuyển đổi sau
   */
  public static saveTemplate(
    xmlString: string,
    sourceFileName?: string,
    appVersion?: string,
  ): SavedTemplateData {
    const cleanXml = xmlString.replace(/^\uFEFF/, '').trim()

    // Bóc tách nhanh số hiệu phiên bản từ tệp XML
    let pbanTKhaiXML = '2.9.4'
    let pbanDVu = '5.7.6'
    try {
      const root = EtaxXmlParser.parseXml(cleanXml)
      const pbanNode =
        EtaxXmlParser.findDescendant(root, 'pbanTKhaiXML') ||
        EtaxXmlParser.findDescendant(root, 'pbanXml')
      if (pbanNode && pbanNode.text.trim()) {
        pbanTKhaiXML = pbanNode.text.trim()
      }
      const dvuNode = EtaxXmlParser.findDescendant(root, 'pbanDVu')
      if (dvuNode && dvuNode.text.trim()) {
        pbanDVu = dvuNode.text.trim()
      }
    } catch {
      // Dùng giá trị mặc định nếu parse lỗi nhẹ
    }

    const data: SavedTemplateData = {
      xmlContent: cleanXml,
      savedAt: new Date().toISOString(),
      sourceFileName,
      pbanTKhaiXML,
      pbanDVu,
      appVersion,
    }

    PersistentTemplateStore.memoryFallback = data

    const storage = PersistentTemplateStore.getStorage()
    if (storage) {
      try {
        storage.setItem(PersistentTemplateStore.STORAGE_KEY, JSON.stringify(data))
      } catch {
        // Tránh exception nếu bị hạn chế quota
      }
    }
    return data
  }

  /**
   * Lấy thông tin khuôn mẫu tùy chỉnh đã lưu
   */
  public static getSavedTemplate(): SavedTemplateData | null {
    const storage = PersistentTemplateStore.getStorage()
    if (storage) {
      try {
        const raw = storage.getItem(PersistentTemplateStore.STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as SavedTemplateData
          if (parsed && parsed.xmlContent) {
            return parsed
          }
        }
      } catch {
        // Fallback sang memory
      }
    }
    return PersistentTemplateStore.memoryFallback
  }

  /**
   * Kiểm tra người dùng đã lưu khuôn mẫu tùy chỉnh hay chưa
   */
  public static hasSavedTemplate(): boolean {
    return PersistentTemplateStore.getSavedTemplate() !== null
  }

  /**
   * Đặt lại về khuôn mẫu mặc định ban đầu của phần mềm
   */
  public static resetToDefault(): void {
    PersistentTemplateStore.memoryFallback = null
    const storage = PersistentTemplateStore.getStorage()
    if (storage) {
      try {
        storage.removeItem(PersistentTemplateStore.STORAGE_KEY)
      } catch {
        // Bỏ qua
      }
    }
  }

  private static getStorage(): { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void } | null {
    try {
      if (typeof globalThis !== 'undefined') {
        const g = globalThis as unknown as { localStorage?: { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void } }
        if (g.localStorage && typeof g.localStorage.getItem === 'function') {
          return g.localStorage
        }
      }
    } catch {
      // Bỏ qua
    }
    return null
  }

  /**
   * Lấy khuôn mẫu hiệu lực hiện tại:
   * Nếu có khuôn mẫu tùy chỉnh đã lưu thì ưu tiên dùng, ngược lại trả về mẫu chuẩn tích hợp sẵn
   */
  public static getEffectiveTemplate(): string {
    const saved = PersistentTemplateStore.getSavedTemplate()
    if (saved && saved.xmlContent) {
      return saved.xmlContent
    }
    return getQtt03TT80BlankTemplate()
  }
}
