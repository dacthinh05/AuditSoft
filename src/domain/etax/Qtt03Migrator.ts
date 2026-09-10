import { PersistentTemplateStore } from './PersistentTemplateStore'
import { EtaxXmlParser } from './EtaxXmlParser'
import { EtaxXmlSerializer } from './EtaxXmlSerializer'
import type { XmlNode } from './types'

export interface MigrateOptions {
  customTemplateXml?: string
  localAppVersion?: string
}

export interface MigrationResult {
  success: boolean
  migratedXml: string
  versionFrom: string
  versionTo: string
  changesApplied: string[]
  warnings: string[]
}
/**
 * Lõi chuyển đổi tờ khai Quyết toán thuế TNDN (03/TNDN)
 * Hỗ trợ 2 chế độ:
 * 1. Tự động nâng cấp sang TT80 chuẩn mới nhất (HTKK 5.7.6 / XML 2.9.4)
 * 2. Rót dữ liệu vào một file XML mẫu tùy ý của người dùng
 */
export class Qtt03Migrator {
  /**
   * Chế độ 1: Tự động chuyển đổi từ file cũ sang mẫu mới nhất mà không cần file mẫu
   */
  public static migrateAuto(oldXmlString: string, options?: MigrateOptions): MigrationResult {
    const changesApplied: string[] = []
    const warnings: string[] = []

    const oldDoc = EtaxXmlParser.parseQtt03(oldXmlString)
    const rawTree = EtaxXmlParser.parseXml(oldXmlString)

    // Loại bỏ khối chữ ký số <CKyDTu> nếu có để file hợp lệ khi import vào HTKK
    Qtt03Migrator.removeSignatureBlock(rawTree)
    changesApplied.push('Loại bỏ khối chữ ký điện tử cũ (<CKyDTu>) để HTKK cho phép mở và sửa dữ liệu.')

    // Nếu có mẫu tùy chỉnh lưu trước đó, ưu tiên sử dụng
    const hasCustomSaved = PersistentTemplateStore.hasSavedTemplate()
    if (hasCustomSaved && !options?.customTemplateXml) {
      changesApplied.push('Áp dụng khuôn mẫu mặc định tùy chỉnh đã lưu trong hệ thống.')
    }

    if (oldDoc.version === 'TT80' && !hasCustomSaved && !options?.customTemplateXml) {
      // Trường hợp 1A: Tờ khai đã ở TT80 nhưng ở bản cập nhật cũ (ví dụ HTKK 5.6.1 / XML 2.9.2)
      // Nâng cấp trực tiếp trên cây DOM của file cũ
      Qtt03Migrator.upgradeTT80MinorVersion(rawTree, changesApplied, options?.localAppVersion)

      const migratedXml = EtaxXmlSerializer.serialize(rawTree)
      return {
        success: true,
        migratedXml,
        versionFrom: oldDoc.generalInfo.pbanXml || '2.9.2',
        versionTo: '2.9.4',
        changesApplied,
        warnings,
      }
    } else {
      // Trường hợp 1B: Tờ khai cũ theo TT 151 / TT 156 HOẶC có khuôn mẫu tùy chỉnh được chỉ định
      const templateXml = options?.customTemplateXml || PersistentTemplateStore.getEffectiveTemplate()
      const targetTree = EtaxXmlParser.parseXml(templateXml)

      Qtt03Migrator.injectOldDataIntoTT80Template(rawTree, targetTree, changesApplied)
      Qtt03Migrator.upgradeTT80MinorVersion(targetTree, changesApplied, options?.localAppVersion)

      const migratedXml = EtaxXmlSerializer.serialize(targetTree)
      return {
        success: true,
        migratedXml,
        versionFrom: oldDoc.version === 'TT80' ? 'TT 80 (Bản cũ)' : 'TT 151/2014',
        versionTo: 'TT 80/2021 (XML 2.9.4)',
        changesApplied,
        warnings,
      }
    }
  }

  /**
   * Chế độ 2: Rót dữ liệu từ file cũ vào file XML mẫu mới do người dùng cung cấp
   */
  public static migrateWithCustomTemplate(
    oldXmlString: string,
    templateXmlString: string,
  ): MigrationResult {
    const changesApplied: string[] = []
    const warnings: string[] = []

    const oldTree = EtaxXmlParser.parseXml(oldXmlString)
    const targetTree = EtaxXmlParser.parseXml(templateXmlString)

    // Loại bỏ chữ ký số cũ nếu có ở template hoặc file cũ
    Qtt03Migrator.removeSignatureBlock(targetTree)

    // Rót toàn bộ dữ liệu từ oldTree sang targetTree
    Qtt03Migrator.injectOldDataIntoTT80Template(oldTree, targetTree, changesApplied)

    const migratedXml = EtaxXmlSerializer.serialize(targetTree)
    return {
      success: true,
      migratedXml,
      versionFrom: 'Custom Source',
      versionTo: 'Custom Target Template',
      changesApplied,
      warnings,
    }
  }

  /**
   * Nâng cấp các thẻ kỹ thuật cho bản cập nhật nhỏ của HTKK (ví dụ 5.6.1 -> 5.7.6 / XML 2.9.2 -> 2.9.4)
   */
  private static upgradeTT80MinorVersion(
    root: XmlNode,
    changes: string[],
    localAppVersion?: string,
  ): void {
    // 1. Chuẩn hóa HSoKhaiThue id="ID_1"
    const hsoKhaiThue = EtaxXmlParser.findDescendant(root, 'HSoKhaiThue')
    if (hsoKhaiThue) {
      if (hsoKhaiThue.attributes['id'] !== 'ID_1') {
        hsoKhaiThue.attributes['id'] = 'ID_1'
        changes.push('Cập nhật mã định danh HSoKhaiThue id="ID_1"')
      }
    }

    // 2. Nâng cấp phiên bản dịch vụ <pbanDVu> theo phiên bản HTKK thực tế hoặc 5.7.6
    const targetAppVersion = localAppVersion || '5.7.6'
    const pbanDVuNode = EtaxXmlParser.findDescendant(root, 'pbanDVu')
    if (pbanDVuNode) {
      pbanDVuNode.text = targetAppVersion
      changes.push(`Đồng bộ phiên bản dịch vụ HTKK lên ${targetAppVersion}`)
    }
    // 3. Nâng cấp mã nhà cung cấp dịch vụ <ttinNhaCCapDVu>
    const nhaCCapNode = EtaxXmlParser.findDescendant(root, 'ttinNhaCCapDVu')
    if (nhaCCapNode) {
      nhaCCapNode.text = '8CAA73E25E2E77BCFCBB40B6028B22F7'
    }

    // 4. Nâng cấp phiên bản tờ khai XML <pbanTKhaiXML> lên 2.9.4
    const pbanXmlNode =
      EtaxXmlParser.findDescendant(root, 'pbanTKhaiXML') ||
      EtaxXmlParser.findDescendant(root, 'pbanXml')
    if (pbanXmlNode) {
      pbanXmlNode.text = '2.9.4'
      changes.push('Nâng cấp phiên bản tờ khai XML pbanTKhaiXML lên 2.9.4')
    }

    // 5. Bổ sung thẻ con bắt buộc mới: <ctM_GCN>0</ctM_GCN> trong Phụ lục Giao dịch liên kết PL_GDLK2-01
    const ctietNode = EtaxXmlParser.findDescendant(root, 'CTiet')
    if (ctietNode) {
      const existingMgcn = EtaxXmlParser.findChild(ctietNode, 'ctM_GCN')
      if (!existingMgcn) {
        const newChild: XmlNode = {
          tag: 'ctM_GCN',
          attributes: {},
          children: [],
          text: '0',
          parent: ctietNode,
        }
        ctietNode.children.push(newChild)
        changes.push('Bổ sung chỉ tiêu bắt buộc mới <ctM_GCN>0</ctM_GCN> trong phụ lục GDLK (tránh lỗi cấu trúc XSD).')
      }
    }
  }

  /**
   * Rót dữ liệu từ cây XML cũ sang cây XML mẫu mới
   */
  private static injectOldDataIntoTT80Template(
    oldTree: XmlNode,
    targetTree: XmlNode,
    changes: string[],
  ): void {
    // 1. Đồng bộ Thông tin chung NNT
    const nntOld = EtaxXmlParser.findDescendant(oldTree, 'NNT') || EtaxXmlParser.findDescendant(oldTree, 'TTinChung')
    const nntTarget = EtaxXmlParser.findDescendant(targetTree, 'NNT')

    if (nntOld && nntTarget) {
      const fields = ['mst', 'tenNNT', 'dchiNNT', 'dthoaiNNT', 'faxNNT', 'emailNNT', 'maTinhNNT', 'tenTinhNNT']
      for (const field of fields) {
        const oldVal = EtaxXmlParser.getNodeText(EtaxXmlParser.findDescendant(nntOld, field))
        if (oldVal) {
          let targetNode = EtaxXmlParser.findDescendant(nntTarget, field)
          if (!targetNode) {
            targetNode = { tag: field, attributes: {}, children: [], text: '', parent: nntTarget }
            nntTarget.children.push(targetNode)
          }
          targetNode.text = oldVal
        }
      }
      changes.push('Đồng bộ thông tin người nộp thuế (MST, Tên công ty, Địa chỉ, CQT).')
    }

    // Đồng bộ kỳ kê khai và ngày lập
    const kyKKhaiOld = EtaxXmlParser.findDescendant(oldTree, 'KyKKhaiThue') || EtaxXmlParser.findDescendant(oldTree, 'kyKKhai')
    const kyKKhaiTarget = EtaxXmlParser.findDescendant(targetTree, 'KyKKhaiThue')
    if (kyKKhaiOld && kyKKhaiTarget) {
      const kyTu = EtaxXmlParser.getNodeText(EtaxXmlParser.findDescendant(kyKKhaiOld, 'kyKKhaiTuNgay'))
      const kyDen = EtaxXmlParser.getNodeText(EtaxXmlParser.findDescendant(kyKKhaiOld, 'kyKKhaiDenNgay'))
      const namKK = EtaxXmlParser.getNodeText(EtaxXmlParser.findDescendant(kyKKhaiOld, 'kyKKhai'))

      if (kyTu) {
        const node = EtaxXmlParser.findDescendant(kyKKhaiTarget, 'kyKKhaiTuNgay')
        if (node) node.text = kyTu
      }
      if (kyDen) {
        const node = EtaxXmlParser.findDescendant(kyKKhaiTarget, 'kyKKhaiDenNgay')
        if (node) node.text = kyDen
      }
      if (namKK) {
        const node = EtaxXmlParser.findDescendant(kyKKhaiTarget, 'kyKKhai')
        if (node) node.text = namKK
      }
    }

    // 2. Rót dữ liệu Tờ khai chính (CTieuTKhaiChinh)
    const oldMain =
      EtaxXmlParser.findDescendant(oldTree, 'CTieuTKhaiChinh') ||
      EtaxXmlParser.findDescendant(oldTree, 'CTietTKhaiChinh')

    const targetMain =
      EtaxXmlParser.findDescendant(targetTree, 'CTieuTKhaiChinh') ||
      EtaxXmlParser.findDescendant(targetTree, 'CTietTKhaiChinh')

    if (oldMain && targetMain) {
      // Tìm toàn bộ thẻ lá dạng ct* trong oldMain
      const oldIndicators = EtaxXmlParser.findAllLeafTags(oldMain)
      let count = 0
      for (const [tag, val] of oldIndicators.entries()) {
        let targetNode = EtaxXmlParser.findDescendant(targetMain, tag)
        if (!targetNode && tag === 'ctC7') {
          targetNode = EtaxXmlParser.findDescendant(targetMain, 'ctC7_thuNhap')
          const thueSuat = EtaxXmlParser.findDescendant(targetMain, 'ctC7_thueSuat')
          if (thueSuat) thueSuat.text = '20'
        }
        if (targetNode) {
          targetNode.text = val
          count++
        }
      }
      changes.push(`Rót thành công ${count} chỉ tiêu số liệu vào Tờ khai chính 03/TNDN.`)
    }

    // 3. Chuyển đổi các Phụ lục (<PLuc>) từ file cũ sang file mới
    const oldPLuc = EtaxXmlParser.findDescendant(oldTree, 'PLuc')
    const targetPLuc = EtaxXmlParser.findDescendant(targetTree, 'PLuc')

    if (oldPLuc && targetPLuc) {
      const isTargetMinimal =
        targetPLuc.children.length <= 1 &&
        Boolean(targetPLuc.children[0]?.tag.includes('03_1A'))

      if (isTargetMinimal) {
        // Xóa phụ lục mẫu trống và sao chép toàn bộ các phụ lục thực tế của file cũ
        targetPLuc.children = []
        for (const plChild of oldPLuc.children) {
          const clonedChild = Qtt03Migrator.deepCloneNode(plChild, targetPLuc)
          targetPLuc.children.push(clonedChild)
          changes.push(`Chuyển đổi trọn vẹn phụ lục đính kèm <${plChild.tag}>.`)
        }
      } else {
        // Template đích là template đầy đủ của người dùng (chứa GDLK, v.v.)
        for (const oldPlChild of oldPLuc.children) {
          const matchingTargetPl =
            EtaxXmlParser.findChild(targetPLuc, oldPlChild.tag) ||
            (oldPlChild.tag.includes('03_1A')
              ? targetPLuc.children.find((c) => c.tag.includes('03_1A'))
              : null) ||
            (oldPlChild.tag.includes('03_2A')
              ? targetPLuc.children.find((c) => c.tag.includes('03_2A'))
              : null)

          if (matchingTargetPl) {
            const oldLeaves = EtaxXmlParser.findAllLeafTags(oldPlChild)
            for (const [tag, val] of oldLeaves.entries()) {
              const targetNode = EtaxXmlParser.findDescendant(matchingTargetPl, tag)
              if (targetNode) {
                targetNode.text = val
              }
            }
            changes.push(`Đồng bộ số liệu phụ lục <${matchingTargetPl.tag}>.`)
          } else {
            // Phụ lục có ở cũ nhưng chưa có ở đích -> sao chép sang
            targetPLuc.children.push(Qtt03Migrator.deepCloneNode(oldPlChild, targetPLuc))
            changes.push(`Bổ sung phụ lục từ tệp cũ <${oldPlChild.tag}>.`)
          }
        }
      }
    }
    Qtt03Migrator.upgradeTT80MinorVersion(targetTree, changes)
  }

  /**
   * Xóa khối chữ ký số <CKyDTu> khỏi cây XML
   */
  private static removeSignatureBlock(root: XmlNode): void {
    root.children = root.children.filter(
      (c) => c.tag.toLowerCase() !== 'ckydtu' && c.tag.toLowerCase() !== 'signature',
    )
    for (const child of root.children) {
      Qtt03Migrator.removeSignatureBlock(child)
    }
  }

  /**
   * Sao chép sâu (deep clone) một XmlNode
   */
  public static deepCloneNode(node: XmlNode, parent?: XmlNode | null): XmlNode {
    const clone: XmlNode = {
      tag: node.tag,
      attributes: { ...node.attributes },
      children: [],
      text: node.text,
      parent: parent || null,
    }
    clone.children = node.children.map((child) => Qtt03Migrator.deepCloneNode(child, clone))
    return clone
  }
}
