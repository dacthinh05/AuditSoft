import fs from 'fs'
import path from 'path'
import type {
  IngestedTaxDeclarations,
  PitDeclarationSnapshot,
  VatDeclarationSnapshot,
} from '../../../shared/types/taxAnalytics'
import { PitXmlParser } from '../parsers/PitXmlParser'
import { VatXmlParser } from '../parsers/VatXmlParser'
import { ZipExtractor } from './ZipExtractor'

export class LocalXmlIngestionEngine {
  /**
   * Quét và nạp dữ liệu từ một danh sách đường dẫn tệp hoặc thư mục
   */
  public static async ingestFiles(filePaths: string[]): Promise<IngestedTaxDeclarations> {
    const rawXmlFiles: string[] = []
    const failedFiles: { path: string; error: string }[] = []

    for (const fp of filePaths) {
      if (!fs.existsSync(fp)) continue
      try {
        const stat = fs.statSync(fp)
        if (stat.isDirectory()) {
          const nested = this.collectXmlAndZipFiles(fp)
          rawXmlFiles.push(...nested)
        } else if (stat.isFile()) {
          const lower = fp.toLowerCase()
          if (lower.endsWith('.xml')) {
            rawXmlFiles.push(fp)
          } else if (lower.endsWith('.zip')) {
            const extracted = ZipExtractor.extractXmlFilesFromZip(fp)
            rawXmlFiles.push(...extracted)
          }
        }
      } catch (err) {
        failedFiles.push({ path: fp, error: String(err) })
      }
    }

    const vatDeclarations: VatDeclarationSnapshot[] = []
    const pitDeclarations: PitDeclarationSnapshot[] = []

    for (const xmlPath of rawXmlFiles) {
      try {
        const content = fs.readFileSync(xmlPath, 'utf-8')

        const vat = VatXmlParser.parseVatXml(content, xmlPath)
        if (vat) {
          vatDeclarations.push(vat)
          continue
        }

        const pit = PitXmlParser.parsePitXml(content, xmlPath)
        if (pit) {
          pitDeclarations.push(pit)
          continue
        }

        failedFiles.push({ path: xmlPath, error: 'Không nhận diện được loại tờ khai (không phải 01/GTGT hoặc 05/TNCN)' })
      } catch (err) {
        failedFiles.push({ path: xmlPath, error: String(err) })
      }
    }

    // Sắp xếp tờ khai theo năm và kỳ (ưu tiên Quý 1..4, Tháng 1..12)
    vatDeclarations.sort((a, b) => a.period.normalizedKey.localeCompare(b.period.normalizedKey))
    pitDeclarations.sort((a, b) => a.period.normalizedKey.localeCompare(b.period.normalizedKey))

    return {
      vatDeclarations,
      pitDeclarations,
      totalFilesProcessed: rawXmlFiles.length,
      failedFiles,
    }
  }

  private static collectXmlAndZipFiles(dirPath: string): string[] {
    const results: string[] = []
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      for (const entry of entries) {
        const full = path.join(dirPath, entry.name)
        if (entry.isDirectory()) {
          results.push(...this.collectXmlAndZipFiles(full))
        } else if (entry.isFile()) {
          const lower = entry.name.toLowerCase()
          if (lower.endsWith('.xml')) {
            results.push(full)
          } else if (lower.endsWith('.zip')) {
            const extracted = ZipExtractor.extractXmlFilesFromZip(full)
            results.push(...extracted)
          }
        }
      }
    } catch (err) {
      console.warn(`Lỗi đọc thư mục ${dirPath}:`, err)
    }
    return results
  }
}
