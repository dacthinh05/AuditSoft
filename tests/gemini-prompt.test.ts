import { describe, expect, it } from 'vitest'
import { buildVsa520Prompt, type FinancialMetricsPayload } from '../src/main/services/GeminiService'

describe('buildVsa520Prompt — Xây dựng prompt kiểm toán VSA 520 chuẩn xác cho Gemini', () => {
  it('không bao giờ chứa giá trị NaN đ hoặc undefined trong toàn bộ prompt', () => {
    const payload: FinancialMetricsPayload = {
      clientName: 'Công ty May Mặc Test 2025',
      fiscalYear: '2025',
      ebitda: {
        revenue: 45_000_000_000,
        cogs: 32_000_000_000,
        grossProfit: 13_000_000_000,
        ebitda: 6_500_000_000,
        operatingProfit: 5_200_000_000,
        ebitdaMarginPct: 14.4,
        netInterest: 1_100_000_000,
        depreciation: 200_000_000,
        interestToEbitdaRatio: 16.9,
        isOverCap: false,
      },
      trend12m: {
        totalRevenue: 45_000_000_000,
        totalCogs: 32_000_000_000,
        revenueByMonth: [3_000_000_000, 4_000_000_000],
        cogsByMonth: [2_000_000_000, 3_000_000_000],
        grossMarginByMonth: [33.3, 25.0],
        anomalousMonths: [12],
      },
      opex: {
        sellingExpense: 2_000_000_000,
        adminExpense: 3_000_000_000,
        opexRatioPct: 11.1,
        anomalousMonths: [12],
      },
      topRisks: ['Phát hiện 2 bên liên quan vay mượn 0% lãi.'],
    }

    const prompt = buildVsa520Prompt(payload)

    // Kiểm tra không có NaN hoặc undefined
    expect(prompt).not.toContain('NaN')
    expect(prompt).not.toContain('undefined')

    // Kiểm tra các con số thực tế được format chuẩn VND
    expect(prompt).toContain('45.000.000.000 đ')
    expect(prompt).toContain('32.000.000.000 đ')
    expect(prompt).toContain('13.000.000.000 đ')
    expect(prompt).toContain('6.500.000.000 đ')
    expect(prompt).toContain('14.4%')

    // Kiểm tra niên độ thực tế 2025
    expect(prompt).toContain('NIÊN ĐỘ 2025')

    // Kiểm tra chỉ thị chống placeholder
    expect(prompt).toContain('TUYỆT ĐỐI KHÔNG mở đầu bằng các placeholder')
  })

  it('xử lý an toàn khi các trường con của ebitda bị undefined (fallback về 0 đ thay vì crash)', () => {
    const payload: FinancialMetricsPayload = {
      fiscalYear: '2025',
      ebitda: {
        revenue: 0,
        cogs: 0,
        grossProfit: 0,
        ebitda: 0,
        operatingProfit: 0,
        ebitdaMarginPct: 0,
      },
    }

    const prompt = buildVsa520Prompt(payload)
    expect(prompt).not.toContain('NaN')
    expect(prompt).not.toContain('undefined')
    expect(prompt).toContain('NIÊN ĐỘ 2025')
  })

  it('chứa thông tin bóc tách Ma trận Giá vốn và cảnh báo dồn giá vốn cuối năm khi có cogsMatrix', () => {
    const payload: FinancialMetricsPayload = {
      fiscalYear: '2025',
      cogsMatrix: {
        isLumpSumYearEnd: true,
        totalProductionCost: 74_850_669_134,
        totalCogs632: 75_020_122_637,
        monthlyProductionCost: [1_570_275_956, 1_331_636_949],
        monthlyCogs632: [282_871_597, 0],
        prodCostToRevenuePctByMonth: [25.5, 21.5],
        summaryWarnings: ['Tháng 12 ghi nhận đột biến 100% tổng giá vốn cả năm.'],
      },
    }

    const prompt = buildVsa520Prompt(payload)
    expect(prompt).toContain('MA TRẬN CHI PHÍ GIÁ VỐN 12M & BÓC TÁCH CHI PHÍ THỰC TẾ')
    expect(prompt).toContain('74.850.669.134 đ')
    expect(prompt).toContain('75.020.122.637 đ')
    expect(prompt).toContain('DỒN GIÁ VỐN VÀO THÁNG 12')
    expect(prompt).toContain('Matching concept')
    expect(prompt).toContain('Cutoff')
    expect(prompt).toContain('Tháng 12 ghi nhận đột biến 100%')
  })
})
