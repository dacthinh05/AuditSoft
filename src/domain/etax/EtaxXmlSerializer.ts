import type { XmlNode } from './types'

/**
 * Bộ tuần tự hóa (Serializer) XML chuyên dụng cho cơ quan Thuế.
 * Đảm bảo:
 * 1. Không chứa Byte Order Mark (No BOM)
 * 2. UTF-8 XML Declaration chuẩn
 * 3. Thụt lề chuẩn 2 spaces, đóng thẻ đúng chuẩn XSD
 */
export class EtaxXmlSerializer {
  /**
   * Chuyển đổi XmlNode thành chuỗi XML hoàn chỉnh
   */
  public static serialize(root: XmlNode, indent = 2): string {
    const lines: string[] = ['<?xml version="1.0" encoding="UTF-8"?>']
    EtaxXmlSerializer.serializeNode(root, 0, indent, lines)
    return lines.join('\n')
  }

  /**
   * Chuyển đổi chuỗi XML thành Uint8Array đảm bảo không chứa BOM
   */
  public static toCleanUtf8Bytes(xmlString: string): Uint8Array {
    // Loại bỏ BOM nếu có
    const clean = xmlString.replace(/^\uFEFF/, '')
    const encoder = new TextEncoder()
    const bytes = encoder.encode(clean)

    // Kiểm tra byte đầu tiên phải là '<' (0x3C)
    if (bytes.length > 0 && bytes[0] !== 0x3c) {
      // Đảm bảo byte đầu tiên là '<'
      if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
        return bytes.slice(3)
      }
    }
    return bytes
  }

  private static serializeNode(
    node: XmlNode,
    depth: number,
    indentSize: number,
    lines: string[],
  ): void {
    const pad = ' '.repeat(depth * indentSize)

    // Chuẩn bị thuộc tính
    const attrs = Object.entries(node.attributes)
      .map(([k, v]) => `${k}="${EtaxXmlSerializer.escapeXml(v)}"`)
      .join(' ')
    const attrStr = attrs ? ` ${attrs}` : ''

    const hasChildren = node.children && node.children.length > 0
    const hasText = node.text !== undefined && node.text.trim().length > 0

    if (!hasChildren && !hasText) {
      // Thẻ rỗng tự đóng <tag/>
      lines.push(`${pad}<${node.tag}${attrStr}/>`)
      return
    }

    if (!hasChildren && hasText) {
      // Thẻ lá chứa giá trị text: <tag>value</tag>
      const escapedText = EtaxXmlSerializer.escapeXml(node.text.trim())
      lines.push(`${pad}<${node.tag}${attrStr}>${escapedText}</${node.tag}>`)
      return
    }

    // Thẻ chứa các thẻ con
    lines.push(`${pad}<${node.tag}${attrStr}>`)
    for (const child of node.children) {
      EtaxXmlSerializer.serializeNode(child, depth + 1, indentSize, lines)
    }
    lines.push(`${pad}</${node.tag}>`)
  }

  /**
   * Escape các ký tự đặc biệt theo chuẩn XML
   */
  public static escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }
}
