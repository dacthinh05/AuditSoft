import type { B410Issue, B410NormalizedIssue, B410ParsedFile } from './B410Types'

/**
 * Chuẩn hóa mã GLV: bỏ khoảng trắng thừa, viết hoa tiền tố
 * Ví dụ: "E 440.1" -> "E440.1", "TH 1" -> "TH1", "th.1" -> "TH.1"
 */
export function normalizeGlvCode(raw: string): string {
  if (!raw) return ''
  const trimmed = raw.trim()
  // Bỏ khoảng trắng giữa chữ và số hoặc dấu chấm
  const noSpaces = trimmed.replace(/\s+/g, '')
  // Viết hoa chữ cái đầu
  return noSpaces.toUpperCase()
}

/**
 * Tính toán chiều cao dòng an toàn tuyệt đối chống đè hình
 * finalRowHeight = max(textRequiredHeight, sourceRowHeight, tallestVisibleImageHeight + 6)
 */
/**
 * Đếm số dòng hiển thị thực tế của đoạn văn bản khi wrap trong ô
 */
export function countTextLines(text: string, charsPerLine: number): number {
  if (!text || text.trim().length === 0) return 1
  const paragraphs = text.split(/\r?\n/)
  let total = 0
  for (const p of paragraphs) {
    total += Math.max(1, Math.ceil(p.trim().length / charsPerLine))
  }
  return Math.max(1, total)
}

export function calculateSafeRowHeight(issue: B410Issue): number {
  const findingText = issue.finding || ''
  const recText = issue.recommendation || ''

  // Ước lượng số dòng hiển thị chuẩn xác (Cột D:E ~ 66 ký tự/dòng, Cột F:H ~ 64 ký tự/dòng)
  const findingLines = countTextLines(findingText, 66)
  const recLines = countTextLines(recText, 64)
  const maxTextLines = Math.max(findingLines, recLines, 1)
  const textRequiredHeight = Math.max(maxTextLines * 13.5 + 5, 18)

  // Nếu ô chỉ có văn bản (không có ảnh): tính chiều cao chuẩn theo số dòng, không để dư khoảng trắng thừa
  if (!issue.images || issue.images.length === 0) {
    return Math.ceil(textRequiredHeight)
  }

  // Nếu ô có ảnh/bảng biểu: lấy chiều cao ảnh gốc từ file
  let tallestImageHeight = 0
  for (const img of issue.images) {
    const h = img.heightPt > 20 ? img.heightPt : 100
    if (h > tallestImageHeight) tallestImageHeight = h
  }

  const finalHeight = textRequiredHeight + 8 + tallestImageHeight + 10
  return Math.ceil(finalHeight)
}

export interface NormalizationResult {
  normalizedIssues: B410NormalizedIssue[]
  warnings: string[]
  duplicatesDetected: number
}

/**
 * Chuẩn hóa toàn bộ mảng file, đánh số thứ tự TT liên tục (1..N) và gom nhóm Người thực hiện
 */
export function normalizeAndGroupIssues(parsedFiles: B410ParsedFile[]): NormalizationResult {
  const normalizedIssues: B410NormalizedIssue[] = []
  const warnings: string[] = []
  const seenIssueKeys = new Map<string, string>()
  let duplicatesDetected = 0

  // Gom toàn bộ issues theo đúng thứ tự file mà người dùng đã sắp xếp
  const allIssues: B410Issue[] = []
  for (const file of parsedFiles) {
    for (const issue of file.issues) {
      allIssues.push(issue)
    }
  }

  // Tách riêng: Đưa toàn bộ các mục "TH" (Lưu ý tổng hợp) lên đầu bảng
  const thIssues: B410Issue[] = []
  const detailIssues: B410Issue[] = []

  for (const issue of allIssues) {
    const cleanCode = normalizeGlvCode(issue.glv)
    if (cleanCode.startsWith('TH')) {
      thIssues.push({ ...issue, glv: cleanCode })
    } else {
      detailIssues.push({ ...issue, glv: cleanCode })
    }
  }

  const sortedIssues = [...thIssues, ...detailIssues]

  // Đánh số TT liên tục và tính chiều cao dòng
  let currentTt = 1
  for (let i = 0; i < sortedIssues.length; i++) {
    const issue = sortedIssues[i]
    if (!issue) continue

    const calcHeight = calculateSafeRowHeight(issue)

    // Kiểm tra trùng lặp nghiệp vụ
    const dedupKey = `${issue.glv}_${issue.finding.slice(0, 60).toLowerCase()}`
    if (seenIssueKeys.has(dedupKey)) {
      duplicatesDetected++
      const prevSource = seenIssueKeys.get(dedupKey)
      warnings.push(`Phát hiện lưu ý có thể trùng: [${issue.glv}] trong ${issue.sourceFile} (tương tự như trong ${prevSource})`)
    } else {
      seenIssueKeys.set(dedupKey, issue.sourceFile)
    }
    // TH KHÔNG ĐÁNH STT, CHỈ ĐÁNH STT TỪ GLV ĐẦU TIÊN
    const isTh = issue.glv.toUpperCase().startsWith('TH')
    let assignedTt: number | null = null
    if (!isTh) {
      assignedTt = currentTt
      currentTt++
    }

    // Xác định xem đây có phải mục ĐẦU TIÊN của nhóm KTV này (hoặc file này) không
    // QUY TẮC CỐT LÕI: Phần TH đứng ở đầu tiên (trước Người thực hiện), KHÔNG chèn Người thực hiện trước TH
    const prevIssue = sortedIssues[i - 1]
    let isPerformerGroupStart = false
    if (!isTh) {
      isPerformerGroupStart = !prevIssue || prevIssue.glv.toUpperCase().startsWith('TH') || prevIssue.sourceFile !== issue.sourceFile || prevIssue.performer !== issue.performer
    }
    // Xác định xem đây có phải mục CUỐI CÙNG của KTV này (hoặc file này) không
    const nextIssue = sortedIssues[i + 1]
    const isPerformerGroupEnd = !nextIssue || nextIssue.sourceFile !== issue.sourceFile || nextIssue.performer !== issue.performer

    normalizedIssues.push({
      ...issue,
      calculatedHeight: calcHeight,
      continuousTt: assignedTt ?? 0,
      isPerformerGroupStart,
      isPerformerGroupEnd,
    })
  }
  return {
    normalizedIssues,
    warnings,
    duplicatesDetected,
  }
}
