import { describe, it, expect, beforeEach } from 'vitest'
import {
  DEFAULT_GEMINI_MODEL,
  anonymizePayload,
  buildVsa520Prompt,
  testGeminiConnection,
  generateGeminiAuditReview,
  type FinancialMetricsPayload,
} from '../src/main/services/GeminiService'
import { useApp } from '../src/renderer/state/store'

describe('GeminiService & Prompt Engineering', () => {
  it('mặc định sử dụng model gemini-2.5-flash', () => {
    expect(DEFAULT_GEMINI_MODEL).toBe('gemini-2.5-flash')
  })

  it('khử định danh thông tin doanh nghiệp (Anonymizer)', () => {
    const rawPayload: FinancialMetricsPayload = {
      clientName: 'Công ty Cổ phần May Mặc ABC',
      fiscalYear: '2025',
      ebitda: {
        revenue: 100_000_000_000,
        cogs: 70_000_000_000,
        grossProfit: 30_000_000_000,
        ebitda: 15_000_000_000,
        operatingProfit: 12_000_000_000,
        ebitdaMarginPct: 15.0,
      },
    }

    const safe = anonymizePayload(rawPayload)
    expect(safe.clientName).toBe('DOANH_NGHIEP_KIEM_TOAN_A')
    expect(safe.clientName).not.toContain('ABC')
    expect(safe.ebitda?.revenue).toBe(100_000_000_000)
  })

  it('xây dựng prompt chuẩn mực VSA 520 với đủ 4 phần trọng tâm', () => {
    const payload: FinancialMetricsPayload = {
      clientName: 'Công ty Bí Mật',
      fiscalYear: '2025',
      ebitda: {
        revenue: 50_000_000_000,
        cogs: 35_000_000_000,
        grossProfit: 15_000_000_000,
        ebitda: 8_000_000_000,
        operatingProfit: 6_000_000_000,
        ebitdaMarginPct: 16.0,
      },
      trend12m: {
        totalRevenue: 50_000_000_000,
        totalCogs: 35_000_000_000,
        revenueByMonth: [4_000_000_000],
        cogsByMonth: [2_800_000_000],
        grossMarginByMonth: [30.0],
        anomalousMonths: [4, 11],
      },
      opex: {
        sellingExpense: 4_000_000_000,
        adminExpense: 3_000_000_000,
        opexRatioPct: 14.0,
        anomalousMonths: [12],
      },
      topRisks: ['Biên lãi gộp âm tại Tháng 4', 'Chi phí bán hàng tăng 120% tại Tháng 12'],
    }

    const prompt = buildVsa520Prompt(payload)

    // Khử định danh
    expect(prompt).not.toContain('Công ty Bí Mật')
    expect(prompt).toContain('DOANH_NGHIEP_KIEM_TOAN_A')

    // Chuẩn mực và cấu trúc
    expect(prompt).toContain('VSA 520')
    expect(prompt).toContain('### I. ĐÁNH GIÁ TỔNG QUAN')
    expect(prompt).toContain('### II. PHÂN TÍCH BIẾN ĐỘNG BẤT THƯỜNG TRỌNG YẾU')
    expect(prompt).toContain('### III. ĐÁNH GIÁ RỦI RO TUÂN THỦ THUẾ')
    expect(prompt).toContain('### IV. THỦ TỤC KIỂM TOÁN CƠ BẢN CẦN BỔ SUNG')

    // Dữ liệu cảnh báo
    expect(prompt).toContain('Tháng 4, 11')
    expect(prompt).toContain('Tháng 12')
  })

  it('báo lỗi rõ ràng khi không có API key trong testGeminiConnection và generateGeminiAuditReview', async () => {
    const resTest = await testGeminiConnection('')
    expect(resTest.success).toBe(false)
    expect(resTest.message).toContain('Vui lòng nhập API Key')

    const resGen = await generateGeminiAuditReview('', {})
    expect(resGen.success).toBe(false)
    expect(resGen.error).toContain('Chưa cấu hình Gemini API Key')
  })
})

describe('AiSlice Zustand State Management', () => {
  beforeEach(() => {
    useApp.getState().resetAll()
  })

  it('khởi tạo với model mặc định là gemini-2.5-flash', () => {
    const state = useApp.getState()
    expect(state.selectedModel).toBe('gemini-2.5-flash')
    expect(state.isAiConfigModalOpen).toBe(false)
  })

  it('cho phép lưu, cập nhật và xóa API Key', () => {
    useApp.getState().setApiKey('AIzaSyFakeKeyTest12345')
    expect(useApp.getState().apiKey).toBe('AIzaSyFakeKeyTest12345')

    useApp.getState().setSelectedModel('gemini-2.5-pro')
    expect(useApp.getState().selectedModel).toBe('gemini-2.5-pro')

    useApp.getState().clearApiKey()
    expect(useApp.getState().apiKey).toBe('')
  })

  it('quản lý trạng thái mở/đóng modal và cache kết quả phân tích', () => {
    useApp.getState().setAiConfigModalOpen(true)
    expect(useApp.getState().isAiConfigModalOpen).toBe(true)

    useApp.getState().setCachedReview('Nhận xét kiểm toán mẫu...')
    expect(useApp.getState().cachedReview).toBe('Nhận xét kiểm toán mẫu...')
  })
})
