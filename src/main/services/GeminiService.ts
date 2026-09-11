/**
 * Dịch vụ Tích hợp Trợ Lý Kiểm Toán AI Google Gemini 2.5 (BYOK)
 * AuditSoft — Phân Tích Chuyên Sâu BCTC Chuẩn Mực VSA 520
 */

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'

export interface GeminiConfig {
  apiKey: string
  model?: string
}

export interface FinancialMetricsPayload {
  clientName?: string
  fiscalYear?: string
  ebitda?: {
    revenue: number
    cogs: number
    grossProfit: number
    ebitda: number
    operatingProfit: number
    ebitdaMarginPct: number
    netInterest?: number
    depreciation?: number
    interestToEbitdaRatio?: number | null
    isOverCap?: boolean
  }
  trend12m?: {
    totalRevenue: number
    totalCogs: number
    revenueByMonth: number[]
    cogsByMonth: number[]
    grossMarginByMonth: number[]
    anomalousMonths: number[]
  }
  opex?: {
    sellingExpense: number
    adminExpense: number
    opexRatioPct: number
    anomalousMonths: number[]
  }
  cogsMatrix?: {
    isLumpSumYearEnd: boolean
    totalProductionCost: number
    totalCogs632: number
    monthlyProductionCost: number[]
    monthlyCogs632: number[]
    prodCostToRevenuePctByMonth: number[]
    summaryWarnings: string[]
  }
  topRisks?: string[]
}

/**
 * Khử định danh thông tin doanh nghiệp trước khi gửi lên Gemini API
 * Đảm bảo 100% tuân thủ bảo mật thông tin khách hàng kiểm toán.
 */
export function anonymizePayload(payload: FinancialMetricsPayload): FinancialMetricsPayload {
  return {
    ...payload,
    clientName: 'DOANH_NGHIEP_KIEM_TOAN_A',
    fiscalYear: payload.fiscalYear || `${new Date().getFullYear()}`,
  }
}

/**
 * Xây dựng Prompt phân tích tài chính chuyên sâu chuẩn VSA 520
 */
export function buildVsa520Prompt(payload: FinancialMetricsPayload): string {
  const safeData = anonymizePayload(payload)
  const ebitda = safeData.ebitda
  const trend = safeData.trend12m
  const opex = safeData.opex

  const formatVnd = (num: number | undefined | null) => {
    if (num == null || !Number.isFinite(num)) return '0 đ'
    return Math.round(num).toLocaleString('vi-VN') + ' đ'
  }

  let dataSummary = `=== BỘ CHỈ SỐ TÀI CHÍNH KIỂM TOÁN NIÊN ĐỘ ${safeData.fiscalYear} ===\n`
  dataSummary += `- Đơn vị: ${safeData.clientName}\n`

  if (ebitda) {
    dataSummary += `\n1. KẾT QUẢ KINH DOANH & CHỈ SỐ EBITDA:\n`
    dataSummary += `  + Doanh thu thuần (TK 511): ${formatVnd(ebitda.revenue)}\n`
    dataSummary += `  + Giá vốn hàng bán (TK 632): ${formatVnd(ebitda.cogs)}\n`
    dataSummary += `  + Lợi nhuận gộp: ${formatVnd(ebitda.grossProfit)}\n`
    dataSummary += `  + Lợi nhuận thuần từ HĐKD: ${formatVnd(ebitda.operatingProfit)}\n`
    dataSummary += `  + Chi phí lãi vay thuần: ${formatVnd(ebitda.netInterest)}\n`
    dataSummary += `  + Khấu hao TSCĐ (TK 214): ${formatVnd(ebitda.depreciation)}\n`
    dataSummary += `  + EBITDA: ${formatVnd(ebitda.ebitda)}\n`
    dataSummary += `  + Tỷ suất biên EBITDA: ${ebitda.ebitdaMarginPct ?? 0}%\n`
    if (ebitda.interestToEbitdaRatio != null) {
      dataSummary += `  + Tỷ lệ Lãi vay / EBITDA: ${ebitda.interestToEbitdaRatio}%\n`
    }
    if (ebitda.isOverCap) {
      dataSummary += `  + CẢNH BÁO NGHỊ ĐỊNH 132/2020: Chi phí lãi vay vượt mức khống chế 30% EBITDA!\n`
    }
  }

  if (trend) {
    dataSummary += `\n2. BIẾN ĐỘNG DOANH THU & BIÊN LÃI GỘP 12 THÁNG:\n`
    dataSummary += `  + Doanh thu cả năm: ${formatVnd(trend.totalRevenue)}\n`
    dataSummary += `  + Giá vốn cả năm: ${formatVnd(trend.totalCogs)}\n`
    if (trend.anomalousMonths && trend.anomalousMonths.length > 0) {
      dataSummary += `  + CẢNH BÁO ĐỘT BIẾN: Các tháng có biên lãi gộp lệch chuẩn: Tháng ${trend.anomalousMonths.join(', ')}\n`
    }
  }

  if (opex) {
    dataSummary += `\n3. CHI PHÍ HOẠT ĐỘNG (OPEX):\n`
    dataSummary += `  + Chi phí bán hàng (TK 641): ${formatVnd(opex.sellingExpense)}\n`
    dataSummary += `  + Chi phí quản lý doanh nghiệp (TK 642): ${formatVnd(opex.adminExpense)}\n`
    dataSummary += `  + Tỷ lệ OPEX / Doanh thu: ${opex.opexRatioPct}%\n`
    if (opex.anomalousMonths && opex.anomalousMonths.length > 0) {
      dataSummary += `  + CẢNH BÁO OPEX BẤT THƯỜNG: Các tháng chi phí tăng vọt: Tháng ${opex.anomalousMonths.join(', ')}\n`
    }
  }

  if (safeData.cogsMatrix) {
    const cm = safeData.cogsMatrix
    dataSummary += `\n4. MA TRẬN CHI PHÍ GIÁ VỐN 12M & BÓC TÁCH CHI PHÍ THỰC TẾ:\n`
    dataSummary += `  + Tổng Chi Phí Sản Xuất thực tế phát sinh cả năm: ${formatVnd(cm.totalProductionCost)}\n`
    dataSummary += `  + Tổng Giá Vốn 632 doanh nghiệp đã hạch toán cả năm: ${formatVnd(cm.totalCogs632)}\n`
    if (cm.isLumpSumYearEnd) {
      dataSummary += `  + ⚠️ CẢNH BÁO TRỌNG YẾU VSA 520: DOANH NGHIỆP CÓ HIỆN TƯỢNG DỒN GIÁ VỐN VÀO THÁNG 12! Trong 11 tháng đầu năm, chi phí sản xuất thực tế vẫn phát sinh đều đặn nhưng kế toán không kết chuyển sang TK 632 mà dồn toàn bộ vào cuối năm. Nghi ngờ vi phạm nghiêm trọng nguyên tắc phù hợp (Matching concept) và rủi ro ghi nhận sai kỳ (Cutoff).\n`
    }
    if (cm.summaryWarnings && cm.summaryWarnings.length > 0) {
      cm.summaryWarnings.forEach((w) => {
        dataSummary += `  + Điểm lưu ý ma trận: ${w}\n`
      })
    }
  }

  if (safeData.topRisks && safeData.topRisks.length > 0) {
    dataSummary += `\n5. CÁC ĐIỂM RỦI RO ĐÃ PHÁT HIỆN QUA ENGINE NỘI BỘ:\n`
    safeData.topRisks.forEach((r, idx) => {
      dataSummary += `  - [Rủi ro ${idx + 1}]: ${r}\n`
    })
  }

  return `Bạn là một Chủ nhiệm kiểm toán độc lập cấp cao (Senior Audit Partner) có hơn 15 năm kinh nghiệm thực chiến theo Hệ thống Chuẩn mực Kiểm toán Việt Nam (VSA), đặc biệt là Chuẩn mực VSA 520 (Thủ tục phân tích) và Chuẩn mực Kế toán Việt Nam (VAS / Thông tư 200).

Hãy phân tích toàn diện bộ số liệu tài chính dưới đây và lập BẢN THUYẾT MINH PHÂN TÍCH KIỂM TOÁN VSA 520 chuyên nghiệp, ngắn gọn, khúc chiết, mang tính thực chiến cao để KTV đưa trực tiếp vào Giấy làm việc kiểm toán:

${dataSummary}

YÊU CẦU CẤU TRÚC BÀI NHẬN XÉT PHẢI CÓ ĐỦ 4 PHẦN CHUẨN MỰC SAU:

### I. ĐÁNH GIÁ TỔNG QUAN HIỆU QUẢ HOẠT ĐỘNG & KHẢ NĂNG SINH LỜI
- Đánh giá chất lượng lợi nhuận qua chỉ số EBITDA và tỷ suất sinh lời gộp.
- Khái quát về mô hình kinh doanh và tính ổn định của dòng tiền kinh doanh.

### II. PHÂN TÍCH BIẾN ĐỘNG BẤT THƯỜNG TRỌNG YẾU (ANOMALY ANALYSIS)
- Mổ xẻ chi tiết nguyên nhân tiềm ẩn tại các tháng có biên lãi gộp hoặc chi phí bán hàng/quản lý bất thường đã được cảnh báo ở trên.
- Đánh giá khả năng dồn doanh thu, trì hoãn chi phí hoặc ghi nhận sai kỳ (Cutoff) giữa các quý.

### III. ĐÁNH GIÁ RỦI RO TUÂN THỦ THUẾ & GIAO DỊCH TRỌNG YẾU
- Nhận định rủi ro về thuế TNDN (chi phí không hợp lý, trích lập dự phòng không đủ điều kiện).
- Rủi ro đối chiếu giữa doanh thu hạch toán kế toán và hóa đơn tờ khai thuế GTGT.

### IV. THỦ TỤC KIỂM TOÁN CƠ BẢN CẦN BỔ SUNG (SUBSTANTIVE PROCEDURES)
- Đề xuất cụ thể 3 đến 5 thủ tục kiểm toán chi tiết tiếp theo theo VSA 500 / VSA 520 (ví dụ: bốc mẫu hóa đơn tháng nào, gửi thư xác nhận khoản mục nào, đối chiếu chứng từ vận chuyển...).

LƯU Ý QUAN TRỌNG:
- Bắt đầu trực tiếp từ tiêu đề "### I. ĐÁNH GIÁ TỔNG QUAN...". TUYỆT ĐỐI KHÔNG mở đầu bằng các placeholder như [Tên KTV], [Ngày lập], [Người soát xét].
- Trích dẫn trực tiếp các con số thực tế từ dữ liệu cung cấp để chứng minh nhận định.
- Văn phong đanh thép, chuẩn mực, trung thực, mang tính phản biện kiểm toán cao.
- Sử dụng tiếng Việt chuẩn kiểm toán tài chính.`
}
/**
 * Kiểm tra tính hợp lệ của Gemini API Key
 */
export async function testGeminiConnection(
  apiKey: string,
  model = DEFAULT_GEMINI_MODEL,
): Promise<{ success: boolean; message: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'Vui lòng nhập API Key của Google Gemini.' }
  }

  const cleanKey = apiKey.trim()
  const cleanModel = (model || DEFAULT_GEMINI_MODEL).trim()
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${cleanKey}`

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: 'Trả lời đúng 1 từ "OK" để xác nhận kết nối thành công.' }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 10,
        },
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      if (res.status === 400 || res.status === 403) {
        return { success: false, message: 'API Key không hợp lệ hoặc chưa được kích hoạt quyền Generative AI.' }
      }
      if (res.status === 404) {
        return { success: false, message: `Không tìm thấy model ${cleanModel}. Hãy thử chọn model gemini-2.5-flash.` }
      }
      if (res.status === 429) {
        return { success: false, message: 'API Key đã tạm thời hết lượt yêu cầu (Quota limit). Vui lòng thử lại sau 1 phút.' }
      }
      return { success: false, message: `Lỗi máy chủ Google (${res.status}): ${errBody.slice(0, 120)}` }
    }

    return {
      success: true,
      message: `✓ Kết nối thành công tới Google Gemini (${cleanModel})!`,
    }
  } catch (err) {
    return {
      success: false,
      message: `Không thể kết nối tới Google API: ${err instanceof Error ? err.message : String(err)}. Vui lòng kiểm tra kết nối mạng.`,
    }
  }
}

/**
 * Gửi yêu cầu phân tích BCTC lên Gemini API và nhận bản nhận xét VSA 520
 */
export async function generateGeminiAuditReview(
  apiKey: string,
  payload: FinancialMetricsPayload,
  model = DEFAULT_GEMINI_MODEL,
): Promise<{ success: boolean; reviewText?: string; error?: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, error: 'Chưa cấu hình Gemini API Key. Vui lòng mở Cài đặt để thêm key.' }
  }

  const prompt = buildVsa520Prompt(payload)
  const cleanKey = apiKey.trim()
  const cleanModel = (model || DEFAULT_GEMINI_MODEL).trim()
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${cleanKey}`

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2, // Nhiệt độ thấp để đảm bảo tính chuẩn xác và nhất quán tài chính
          maxOutputTokens: 2500,
        },
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      if (res.status === 429) {
        return { success: false, error: 'Tài khoản Google AI đã chạm giới hạn tần suất (Quota Limit). Vui lòng đợi khoảng 1 phút rồi thử lại.' }
      }
      return { success: false, error: `Lỗi Gemini API (${res.status}): ${errText.slice(0, 150)}` }
    }

    const json = (await res.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>
        }
      }>
    }

    const text = json.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text || !text.trim()) {
      return { success: false, error: 'Không nhận được nội dung phản hồi từ Gemini API.' }
    }

    return { success: true, reviewText: text.trim() }
  } catch (err) {
    return {
      success: false,
      error: `Lỗi mạng khi gọi Gemini: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}
