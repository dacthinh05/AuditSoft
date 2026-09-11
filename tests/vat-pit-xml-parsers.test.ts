import { describe, expect, it } from 'vitest'
import { VatXmlParser } from '../src/domain/etax/parsers/VatXmlParser'
import { PitXmlParser } from '../src/domain/etax/parsers/PitXmlParser'

describe('VatXmlParser', () => {
  const sampleVatXml = `<?xml version="1.0" encoding="UTF-8"?>
<HSoThueDTu xmlns="http://kekhaithue.gdt.gov.vn/TKhaiThue">
  <HSoKhaiThue>
    <TTinChung>
      <maTKhai>01/GTGT</maTKhai>
      <tenTKhai>Tờ khai thuế giá trị gia tăng</tenTKhai>
      <kyKKhai>Quý 1/2025</kyKKhai>
      <soLan>0</soLan>
      <mst>0314892001</mst>
      <tenNNT>CÔNG TY TNHH MINH PHÁT</tenNNT>
      <ngayNop>2025-04-18</ngayNop>
    </TTinChung>
    <CTietTKhaiChinh>
      <ct22>50000000</ct22>
      <ct23>1200000000</ct23>
      <ct24>120000000</ct24>
      <ct25>120000000</ct25>
      <ct26>0</ct26>
      <ct27>100000000</ct27>
      <ct28>0</ct28>
      <ct29>2500000000</ct29>
      <ct34>2600000000</ct34>
      <ct35>250000000</ct35>
      <ct36>130000000</ct36>
      <ct40>80000000</ct40>
      <ct43>0</ct43>
    </CTietTKhaiChinh>
  </HSoKhaiThue>
</HSoThueDTu>`

  it('phân tích chính xác tờ khai thuế GTGT 01/GTGT', () => {
    const result = VatXmlParser.parseVatXml(sampleVatXml)
    expect(result).not.toBeNull()
    expect(result?.taxpayerId).toBe('0314892001')
    expect(result?.taxpayerName).toBe('CÔNG TY TNHH MINH PHÁT')
    expect(result?.period.type).toBe('QUARTER')
    expect(result?.period.quarter).toBe(1)
    expect(result?.period.year).toBe(2025)
    expect(result?.declarationType).toBe('ORIGINAL')

    expect(result?.indicators['22'].numericValue).toBe(50000000n)
    expect(result?.indicators['25'].numericValue).toBe(120000000n)
    expect(result?.indicators['34'].numericValue).toBe(2600000000n)
    expect(result?.indicators['35'].numericValue).toBe(250000000n)
    expect(result?.indicators['40'].numericValue).toBe(80000000n)
  })

  it('nhận diện đúng tờ khai bổ sung lần 2', () => {
    const supplementalXml = sampleVatXml.replace('<soLan>0</soLan>', '<soLan>2</soLan>')
    const result = VatXmlParser.parseVatXml(supplementalXml)
    expect(result?.declarationType).toBe('SUPPLEMENTAL')
    expect(result?.supplementalNo).toBe(2)
  })

  it('chuẩn hóa chính xác các định dạng kỳ khai khác nhau', () => {
    expect(VatXmlParser.normalizePeriod('Tháng 03/2025').key).toBe('2025-M03')
    expect(VatXmlParser.normalizePeriod('Quý 2/2025').key).toBe('2025-Q2')
    expect(VatXmlParser.normalizePeriod('2025').key).toBe('2025-YEAR')
  })
})

describe('PitXmlParser', () => {
  const samplePitKkXml = `<?xml version="1.0" encoding="UTF-8"?>
<TKhaiThueTNCN>
  <maTKhai>05/KK-TNCN</maTKhai>
  <kyKKhai>Quý 2/2025</kyKKhai>
  <mst>0314892001</mst>
  <tenNNT>CÔNG TY TNHH MINH PHÁT</tenNNT>
  <ct16>45</ct16>
  <ct21>1250000000</ct21>
  <ct26>420000000</ct26>
  <ct29>38500000</ct29>
</TKhaiThueTNCN>`

  const samplePitQttXml = `<?xml version="1.0" encoding="UTF-8"?>
<TKhaiThueTNCN>
  <maTKhai>05/QTT-TNCN</maTKhai>
  <kyKKhai>Năm 2025</kyKKhai>
  <mst>0314892001</mst>
  <tenNNT>CÔNG TY TNHH MINH PHÁT</tenNNT>
  <ct16>52</ct16>
  <ct21>5710000000</ct21>
  <ct26>2020000000</ct26>
  <ct29>198000000</ct29>
  <ct31>198000000</ct31>
  <ct40>0</ct40>
</TKhaiThueTNCN>`

  it('phân tích chính xác tờ khai khấu trừ TNCN 05/KK-TNCN', () => {
    const result = PitXmlParser.parsePitXml(samplePitKkXml)
    expect(result).not.toBeNull()
    expect(result?.isFinalization).toBe(false)
    expect(result?.ct16_tongSoNguoiLaoDong).toBe(45n)
    expect(result?.ct21_tongThuNhapChiuThue).toBe(1250000000n)
    expect(result?.ct26_tongThuNhapChiuThueKhauTru).toBe(420000000n)
    expect(result?.ct29_tongThueTncnDaKhauTru).toBe(38500000n)
  })

  it('phân tích chính xác tờ khai quyết toán TNCN 05/QTT-TNCN', () => {
    const result = PitXmlParser.parsePitXml(samplePitQttXml)
    expect(result).not.toBeNull()
    expect(result?.isFinalization).toBe(true)
    expect(result?.ct16_tongSoNguoiLaoDong).toBe(52n)
    expect(result?.ct21_tongThuNhapChiuThue).toBe(5710000000n)
    expect(result?.ct31_qtt_tongThueDaKhauTruTrongNam).toBe(198000000n)
  })
})

describe('Phân loại GTGT vs TNCN trong envelope HTKK chung', () => {
  // File TNCN thật dùng envelope TKhaiThue chung + maTKhai 05/KK-TNCN
  const tncnInGenericEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<HSoThueDTu xmlns="http://kekhaithue.gdt.gov.vn/TKhaiThue">
  <HSoKhaiThue>
    <TTinChung>
      <maTKhai>05/KK-TNCN</maTKhai>
      <tenTKhai>Tờ khai khấu trừ thuế thu nhập cá nhân</tenTKhai>
      <kyKKhai>Quý 2/2025</kyKKhai>
      <soLan>0</soLan>
      <mst>0314892001</mst>
      <tenNNT>CÔNG TY TNHH MINH PHÁT</tenNNT>
    </TTinChung>
    <CTietTKhaiChinh>
      <ct16>45</ct16>
      <ct21>1250000000</ct21>
      <ct26>420000000</ct26>
      <ct29>38500000</ct29>
    </CTietTKhaiChinh>
  </HSoKhaiThue>
</HSoThueDTu>`

  it('VAT parser từ chối tờ khai TNCN trong envelope chung', () => {
    expect(VatXmlParser.parseVatXml(tncnInGenericEnvelope)).toBeNull()
  })

  it('PIT parser nhận đúng tờ khai TNCN trong envelope chung', () => {
    const result = PitXmlParser.parsePitXml(tncnInGenericEnvelope)
    expect(result).not.toBeNull()
    expect(result?.isFinalization).toBe(false)
    expect(result?.ct21_tongThuNhapChiuThue).toBe(1250000000n)
  })

  it('VAT parser từ chối tờ khai TNDN 03/TNDN', () => {
    const tndnXml = tncnInGenericEnvelope.replace('05/KK-TNCN', '03/TNDN')
    expect(VatXmlParser.parseVatXml(tndnXml)).toBeNull()
  })
})
