import AdmZip from 'adm-zip'
import fs from 'fs'
import os from 'os'
import path from 'path'

export class ZipExtractor {
  private static MAX_ENTRIES = 100
  private static MAX_UNCOMPRESSED_TOTAL = 100 * 1024 * 1024 // 100MB
  private static MAX_UNCOMPRESSED_ENTRY = 30 * 1024 * 1024 // 30MB

  /**
   * Giải nén an toàn file ZIP vào thư mục tạm, trả về danh sách đường dẫn các file .xml
   */
  public static extractXmlFilesFromZip(zipFilePath: string): string[] {
    const extractedXmlPaths: string[] = []
    if (!fs.existsSync(zipFilePath)) return extractedXmlPaths

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auditsoft-etax-zip-'))

    try {
      const zip = new AdmZip(zipFilePath)
      const zipEntries = zip.getEntries()

      if (zipEntries.length > this.MAX_ENTRIES) {
        throw new Error(`File ZIP chứa quá nhiều tệp (${zipEntries.length} > ${this.MAX_ENTRIES})`)
      }

      let totalSize = 0

      for (const entry of zipEntries) {
        if (entry.isDirectory) continue

        // Chống Zip Slip / Path Traversal
        const safeName = path.basename(entry.entryName)
        if (!safeName.toLowerCase().endsWith('.xml')) continue

        if (entry.header.size > this.MAX_UNCOMPRESSED_ENTRY) {
          continue
        }

        totalSize += entry.header.size
        if (totalSize > this.MAX_UNCOMPRESSED_TOTAL) {
          throw new Error('Kích thước giải nén vượt quá giới hạn an toàn 100MB')
        }

        const targetPath = path.join(tempDir, safeName)
        const content = entry.getData()
        fs.writeFileSync(targetPath, content)
        extractedXmlPaths.push(targetPath)
      }
    } catch (err) {
      console.warn(`Lỗi khi giải nén file zip ${zipFilePath}:`, err)
    }

    return extractedXmlPaths
  }
}
