import { describe, expect, it } from 'vitest'
import { classifyAccount, computeRow, suggestWorkingPaper } from '../src/domain/bctc/classify'
import { analyzeDiffRows, buildBctc } from '../src/domain/bctc/aggregate'
import type { DiffRow } from '../src/domain/types'

function diffRow(partial: Partial<DiffRow>): DiffRow {
  return {
    stt: 1,
    kind: 'AMOUNT_CHANGED',
    key: 'k',
    dateISO: null,
    dateDisplay: '',
    loiNgay: false,
    loiNgayText: '',
    voucher: 'V',
    description: 'D',
    debit: '',
    credit: '',
    amountAfter: '0|0',
    amountBefore: '0|0',
    difference: '0|0',
    note: '',
    priority: '',
    ...partial,
  }
}

describe('classifyAccount — LEFT3 + ngoại lệ giá vốn', () => {
  it('6428 → KQKD/CP Chi phí quản lý doanh nghiệp', () => {
    expect(classifyAccount('6428')).toEqual({ nhom: 'CP', baoCao: 'KQKD', chiTieu: 'Chi phí quản lý doanh nghiệp' })
  })
  it('3335 → CDKT/NV Thuế và các khoản phải nộp Nhà nước', () => {
    expect(classifyAccount('3335')?.chiTieu).toBe('Thuế và các khoản phải nộp Nhà nước')
  })
  it('TK hậu tố 131T28 tra theo 3 số đầu', () => {
    expect(classifyAccount('131T28')?.chiTieu).toBe('Phải thu khách hàng')
  })
  it('611/621/622/623/627/631/632 ép "Giá vốn hàng bán"', () => {
    for (const t of ['6111', '6211', '6322', '6271', '631']) {
      expect(classifyAccount(t)?.chiTieu).toBe('Giá vốn hàng bán')
    }
  })
  it('Chưa khai báo → null', () => {
    expect(classifyAccount('9999')).toBeNull()
  })
})

describe('computeRow — CASE BẮT BUỘC: Nợ 6428, Có 3335, 425', () => {
  const r = computeRow({ tkNo: '6428', tkCo: '3335', soPS: 425 })

  it('X = −425 · Y = 0', () => {
    expect(r.x).toBe(-425)
    expect(r.y).toBe(0)
  })
  it('Z trước cộng lợi nhuận = +425; sau điều chỉnh lợi nhuận Z = 0', () => {
    expect(r.zBeforeProfit).toBe(425)
    expect(r.z).toBe(0)
  })
  it('AA = Y − Z = 0 → CÂN', () => {
    expect(r.aa).toBe(0)
    expect(r.ab).toBe('CÂN')
  })
})

describe('computeRow — các trường hợp đặc biệt', () => {
  it('Chưa map một/cả hai TK → CHƯA KIỂM TRA CÂN', () => {
    expect(computeRow({ tkNo: '9999', tkCo: '112', soPS: 10 }).ab).toBe('CHƯA KIỂM TRA CÂN')
    expect(computeRow({ tkNo: '9998', tkCo: '9999', soPS: 10 }).ab).toBe('CHƯA KIỂM TRA CÂN')
  })

  it('Chạm 421 trực tiếp: KHÔNG cộng lợi nhuận hai lần', () => {
    // Nợ 4211, Có 3335: NV trước = +500 −500 = 0; có 421 nên không cộng X (X vốn = 0)
    const r = computeRow({ tkNo: '4211', tkCo: '3335', soPS: 500 })
    expect(r.involves421).toBe(true)
    expect(r.zBeforeProfit).toBe(0)
    expect(r.z).toBe(0)
    expect(r.aa).toBe(0)

    // Nợ 112, Có 421: TS +700, NV +700, không thêm X (X=0 vì không có TK KQKD)
    const r2 = computeRow({ tkNo: '1121', tkCo: '4211', soPS: 700 })
    expect(r2.y).toBe(700)
    expect(r2.z).toBe(700)
    expect(r2.ab).toBe('CÂN')
  })

  it('Bút toán KQKD thuần: Nợ 511, Có 632 → X = 0 (chuyển nội bộ)', () => {
    const r = computeRow({ tkNo: '5111', tkCo: '6321', soPS: 1000 })
    expect(r.x).toBe(0)
  })
})

describe('suggestWorkingPaper — đúng thứ tự ưu tiên, khớp có/không dấu', () => {
  it('PHÂN BỔ/PHAN BO thắng mọi từ khóa khác → D600', () => {
    expect(suggestWorkingPaper({ noiDung: 'THUẾ PHÂN BỔ', tkNo: '', tkCo: '' })).toBe('D600')
    expect(suggestWorkingPaper({ noiDung: 'phan bo luong', tkNo: '', tkCo: '' })).toBe('D600')
  })
  it('LƯƠNG/LUONG hoặc TK 334 → E400', () => {
    expect(suggestWorkingPaper({ noiDung: 'Chi lương tháng 1', tkNo: '', tkCo: '' })).toBe('E400')
    expect(suggestWorkingPaper({ noiDung: 'Hạch toán nội bộ', tkNo: '3341', tkCo: '1121' })).toBe('E400')
  })
  it('THUẾ/THUE hoặc 333/133/821 → E300', () => {
    expect(suggestWorkingPaper({ noiDung: 'Nộp thue GTGT', tkNo: '', tkCo: '' })).toBe('E300')
    expect(suggestWorkingPaper({ noiDung: 'Điều chỉnh', tkNo: '1331', tkCo: '' })).toBe('E300')
  })
  it('VAY→E100 · KHO/NVL/THÀNH PHẨM→D500 · PHẢI TRẢ→E200 · TÀI SẢN→D700 · VỐN→F100', () => {
    expect(suggestWorkingPaper({ noiDung: 'Trả nợ vay', tkNo: '', tkCo: '' })).toBe('E100')
    expect(suggestWorkingPaper({ noiDung: 'Nhập kho NVL', tkNo: '', tkCo: '' })).toBe('D500')
    expect(suggestWorkingPaper({ noiDung: 'Thanh pham nhap kho', tkNo: '', tkCo: '' })).toBe('D500')
    expect(suggestWorkingPaper({ noiDung: '153 tăng', tkNo: '1531', tkCo: '' })).toBe('D500')
    expect(suggestWorkingPaper({ noiDung: 'Phai tra NCC', tkNo: '', tkCo: '' })).toBe('E200')
    expect(suggestWorkingPaper({ noiDung: 'Mua tai san cố định', tkNo: '', tkCo: '' })).toBe('D700')
    expect(suggestWorkingPaper({ noiDung: 'Góp von liên doanh', tkNo: '', tkCo: '' })).toBe('F100')
  })
  it('D300/D100 theo TK; không khớp → Cần bổ sung quy tắc', () => {
    expect(suggestWorkingPaper({ noiDung: 'Điều chỉnh công nợ', tkNo: '1411', tkCo: '' })).toBe('D300')
    expect(suggestWorkingPaper({ noiDung: 'Tiền mặt', tkNo: '1111', tkCo: '' })).toBe('D100')
    expect(suggestWorkingPaper({ noiDung: 'Nghiệp vụ khác', tkNo: '6868', tkCo: '6869' })).toBe('Cần bổ sung quy tắc')
  })
})

describe('buildBctc — tổng hợp THEO NHÓM LOẠI BÚT TOÁN (đầu vào nhóm LEFT4)', () => {
  const analyses = analyzeDiffRows([
    diffRow({ stt: 1, voucher: 'G1', description: 'DOANH THU', debit: '1121', credit: '5111',
      amountAfter: '0|1000', difference: '0|1000' }),
    diffRow({ stt: 2, voucher: 'G2', description: 'CHI PHI QLDN', debit: '6421', credit: '3335',
      amountAfter: '0|425', difference: '0|425' }),
    diffRow({ stt: 3, voucher: 'G3', description: 'CHUYEN LN THANH VON', debit: '4211', credit: '4111',
      amountAfter: '0|250', difference: '0|250' }),
    diffRow({ stt: 4, voucher: 'G4', description: 'TY GIA', debit: '1121', credit: '4131',
      amountAfter: '0|300', difference: '0|300' }),
  ])
  const out = buildBctc(analyses)

  it('Tổng kiểm tra cân đối toàn bảng = 0 (CÂN)', () => {
    expect(out.totals.chenhLechCanDoi).toBe(0)
    expect(out.totals.canDoiToanBang).toBe(true)
    expect(out.totals.tongTaiSanTang).toBe(1300)
    expect(out.totals.anhHuongLoiNhuanThuan).toBe(575) // 1000 − 425 (bỏ nhóm chạm 421)
  })

  it('LNST chưa phân phối = 325 (1000 − 425 − 250 chuyển sang vốn) · xếp cuối; FX riêng áp chót', () => {
    const names = out.cdktRows.map((r) => r.chiTieu)
    expect(names[names.length - 1]).toBe('Lợi nhuận sau thuế chưa phân phối')
    expect(names[names.length - 2]).toBe('Chênh lệch tỷ giá hối đoái')
    const lnst = out.cdktRows.find((r) => r.chiTieu === 'Lợi nhuận sau thuế chưa phân phối')!
    expect(lnst.nvTang).toBe(325)
  })

  it('Ảnh hưởng BCTC khớp theo tên chứa (SUMIFS) — KHÔNG double-count vào dòng tiêu đề mục', () => {
    const f111 = out.financialCdkt.find((r) => r.maSo === '111')!
    expect(f111.tsTang).toBe(1300) // 1000 (G1) + 300 (nhóm tỷ giá cũng Nợ 1121 → cùng chỉ tiêu Tiền)
    const f110Header = out.financialCdkt.find((r) => r.maSo === '110')!
    expect(f110Header.tsTang).toBe(0) // dòng mục không được nuốt chỉ tiêu con
    const fx = out.financialCdkt.find((r) => r.maSo === '413')!
    expect(fx.nvTang).toBe(300)
    const lnst = out.financialCdkt.find((r) => r.maSo === '421')!
    expect(lnst.nvTang).toBe(325)
  })

  it('KQKD: dòng cuối là Ảnh hưởng lợi nhuận thuần; CP QLDN quy về giảm lợi nhuận', () => {
    const last = out.kqkdRows[out.kqkdRows.length - 1]!
    expect(last.chiTieu).toBe('Ảnh hưởng lợi nhuận thuần')
    expect(last.tang).toBe(575)
    const qldn = out.kqkdRows.find((r) => r.chiTieu === 'Chi phí quản lý doanh nghiệp')!
    expect(qldn.giam).toBe(425)
    const f26 = out.financialKqkd.find((r) => r.maSo === '26')!
    expect(f26.giam).toBe(425)
  })

  it('dòng chưa map được đếm trong totals.soDongChuaMap', () => {
    const mixed = buildBctc(
      analyzeDiffRows([
        ...[
          diffRow({ stt: 1, debit: '1121', credit: '5111', amountAfter: '0|100', difference: '0|100' }),
        ],
        diffRow({ stt: 2, debit: '6868', credit: '1122', amountAfter: '0|50', difference: '0|50' }),
      ]),
    )
    expect(mixed.totals.soDongChuaMap).toBe(1)
    expect(mixed.totals.canDoiToanBang).toBe(false)
  })

  it('khi TK 413 hoặc 421 bù trừ về 0 đồng thì KHÔNG tạo dòng trống trên bảng CĐKT', () => {
    const analyses = analyzeDiffRows([
      diffRow({ stt: 1, debit: '1122', credit: '413', amountAfter: '0|300', difference: '0|300' }),
      diffRow({ stt: 2, debit: '413', credit: '3312', amountAfter: '0|300', difference: '0|300' }),
    ])
    const out = buildBctc(analyses)
    const fxRow = out.cdktRows.find((r) => r.chiTieu === 'Chênh lệch tỷ giá hối đoái')
    expect(fxRow).toBeUndefined()
  })
})

describe('generateWorkingPaperLines — format bảng kiểm toán làm việc mẫu (B360 / But toan dieu chinh)', () => {
  it('bút toán chi tiết bên trái (1 dòng/bút toán), chỉ tiêu CĐKT & KQKD cộng gộp bên phải', () => {
    const analyses = analyzeDiffRows([
      diffRow({
        stt: 1,
        voucher: 'E300',
        description: 'TRÍCH THUẾ TNCN THÁNG 12',
        debit: '6428',
        credit: '3335',
        amountBefore: '0|0',
        amountAfter: '0|425',
        difference: '0|425',
      }),
    ])
    const out = buildBctc(analyses)
    const lines = out.workingPaperLines
    expect(lines.length).toBeGreaterThanOrEqual(1)

    // Dòng 1: Chi tiết bút toán bên trái + chỉ tiêu CĐKT/KQKD tương ứng bên phải
    const l1 = lines[0]!
    expect(l1.stt).toBe(1)
    expect(l1.glv).toBe('E300')
    expect(l1.noiDung).toBe('TRÍCH THUẾ TNCN THÁNG 12')
    expect(l1.tkNo).toBe('6428')
    expect(l1.tkCo).toBe('3335')
    expect(l1.soPS).toBe(425)
    expect(l1.cdktChiTieu).toBe('Thuế và các khoản phải nộp Nhà nước')
    expect(l1.nvTang).toBe(425)
    expect(l1.kqkdChiTieu).toBe('Chi phí quản lý doanh nghiệp')
    expect(l1.kqkdGiam).toBe(425) // Chi phí QLDN tăng -> Giảm lợi nhuận 425
    expect(l1.kiemTra).toBe('642')
  })
})
