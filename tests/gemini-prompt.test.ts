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

  it('sinh đầy đủ 5 bảng Markdown đối chiếu khi có đủ payload chuyên sâu', () => {
    const payload: FinancialMetricsPayload = {
      clientName: 'Công ty Cổ phần May Xuất khẩu ABC',
      fiscalYear: '2025',
      businessType: 'MANUFACTURING',
      auditorContextNote: 'Đơn vị mở rộng phân xưởng trong Quý 3, chi phí nhân công tăng',
      ebitda: {
        revenue: 120_000_000_000,
        cogs: 90_000_000_000,
        grossProfit: 30_000_000_000,
        ebitda: 15_000_000_000,
        operatingProfit: 12_000_000_000,
        ebitdaMarginPct: 12.5,
      },
      kqkdYoY: [
        { chiTieu: 'Doanh thu thuần (511)', current: 120_000_000_000, prior: 100_000_000_000, pct: 20.0 },
        { chiTieu: 'Giá vốn hàng bán (632)', current: 90_000_000_000, prior: 70_000_000_000, pct: 28.6 },
      ],
      monthlyBreakdown: [
        { month: 1, revenue: 10_000_000_000, cogs632: 7_500_000_000, grossMarginPct: 25.0, productionCost: 7_200_000_000, prodCostToRevPct: 72.0 },
        { month: 12, revenue: 15_000_000_000, cogs632: 25_000_000_000, grossMarginPct: -66.7, productionCost: 8_000_000_000, prodCostToRevPct: 53.3, isLumpSumYearEnd: true },
      ],
      opex: {
        sellingExpense: 6_000_000_000,
        adminExpense: 8_000_000_000,
        opexRatioPct: 11.7,
        anomalousMonths: [12],
        topSubaccounts: [
          { code: '6421', name: 'Chi phí nhân viên quản lý', amount: 4_500_000_000 },
        ],
      },
      cashTaxRisk: {
        totalCashOverThreshold: 850_000_000,
        countCashOverThreshold: 12,
        thresholdUsed: 20_000_000,
        penalty811Amount: 45_000_000,
        estimatedB4Amount: 895_000_000,
        estimatedTaxIncrease: 179_000_000,
        auditWarnings: ['Chi tiền mặt trên 20tr không qua ngân hàng.'],
      },
      relatedParties: [
        { name: 'Công ty TNHH Thành Viên XYZ', relationship: 'Công ty con', amount: 5_000_000_000, accounts: ['1388'], riskType: 'Cho vay 0% lãi' },
      ],
      pareto: {
        topCustomerName: 'Tập đoàn Khách Hàng Big Corp',
        topCustomerPct: 35.5,
        top5CustomersPct: 78.2,
        topSupplierName: 'Công ty Cung Ứng Vải May',
        topSupplierPct: 42.0,
        top5SuppliersPct: 85.0,
      },
    }

    const prompt = buildVsa520Prompt(payload)

    // Bảng 1: KQKD YoY
    expect(prompt).toContain('BẢNG 1: KẾT QUẢ KINH DOANH SO SÁNH NIÊN ĐỘ (YOY B02)')
    expect(prompt).toContain('| Doanh thu thuần (511) | 100.000.000.000 đ | 120.000.000.000 đ |')
    expect(prompt).toContain('+20.0%')

    // Bảng 2: Ma trận 12 tháng
    expect(prompt).toContain('BẢNG 2: MA TRẬN 12 THÁNG')
    expect(prompt).toContain('Tháng 01')
    expect(prompt).toContain('Tháng 12')
    expect(prompt).toContain('Dồn giá vốn cuối năm')

    // Bảng 3: OPEX
    expect(prompt).toContain('BẢNG 3: CHI PHÍ HOẠT ĐỘNG (OPEX)')
    expect(prompt).toContain('6421')
    expect(prompt).toContain('Chi phí nhân viên quản lý')

    // Bảng 4: Rủi ro thuế & B4
    expect(prompt).toContain('BẢNG 4: CẢNH BÁO RỦI RO THUẾ TNDN')
    expect(prompt).toContain('850.000.000 đ')
    expect(prompt).toContain('895.000.000 đ')
    expect(prompt).toContain('179.000.000 đ')
    expect(prompt).toContain('Chỉ tiêu B4')

    // Bảng 5: Bên liên quan & Pareto
    expect(prompt).toContain('BẢNG 5: GIAO DỊCH BÊN LIÊN QUAN & RỦI RO TẬP TRUNG (PARETO)')
    expect(prompt).toContain('BEN_LIEN_QUAN_01')
    expect(prompt).not.toContain('Công ty TNHH Thành Viên XYZ')
    expect(prompt).toContain('35.5%')
    expect(prompt).toContain('78.2%')

    // Bối cảnh KTV & Loại hình kinh doanh
    expect(prompt).toContain('Sản xuất / Chế tạo')
    expect(prompt).toContain('Đơn vị mở rộng phân xưởng trong Quý 3')

    // Các phân đoạn giấy làm việc (A710, G353, E300)
    expect(prompt).toContain('GIẤY LÀM VIỆC A710')
    expect(prompt).toContain('GIẤY LÀM VIỆC G353')
    expect(prompt).toContain('GIẤY LÀM VIỆC E300')
    expect(prompt).toContain('AUDIT GROUNDING DIRECTIVES')
    expect(prompt).toContain('CẤM tự bịa đặt hoặc giả định các con số')
  })
})
