import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { EtaxXmlParser } from '../src/domain/etax/EtaxXmlParser'
import { EtaxXmlSerializer } from '../src/domain/etax/EtaxXmlSerializer'

describe('EtaxXmlParser & Serializer Phase 1', () => {
  const sampleXmlTT151 = `<?xml version="1.0" encoding="UTF-8"?>
<HSoThueDTu xmlns="http://kekhaithue.gdt.gov.vn/TKhaiThue">
  <TTinChung>
    <maTKhai>03/TNDN</maTKhai>
    <tenTKhai>Tờ khai quyết toán thuế thu nhập doanh nghiệp</tenTKhai>
    <pbanXml>2.0.8</pbanXml>
    <loaiTKhai>C</loaiTKhai>
    <mst>0101234567</mst>
    <tenNNT>CÔNG TY TNHH KIỂM TOÁN VÀ DỊCH VỤ AUDITSOFT</tenNNT>
    <cqtNoiNop>
      <maCQT>10500</maCQT>
      <tenCQT>Chi cục Thuế Quận Hoàn Kiếm</tenCQT>
    </cqtNoiNop>
    <kyKKhai>
      <kieuKy>N</kieuKy>
      <kyKKhaiTuNgay>01/01/2020</kyKKhaiTuNgay>
      <kyKKhaiDenNgay>31/12/2020</kyKKhaiDenNgay>
    </kyKKhai>
  </TTinChung>
  <CTietTKhaiChinh>
    <ctA1>1500000000</ctA1>
    <ctB1>100000000</ctB1>
    <ctB4>100000000</ctB4>
    <ctB8>0</ctB8>
    <ctC1>1600000000</ctC1>
    <ctC2>0</ctC2>
    <ctC3>100000000</ctC3>
    <ctC3a>100000000</ctC3a>
    <ctC4>1500000000</ctC4>
    <ctC10>300000000</ctC10>
    <ctC11>0</ctC11>
    <ctC13>300000000</ctC13>
    <ctE1>250000000</ctE1>
    <ctG2>50000000</ctG2>
  </CTietTKhaiChinh>
  <PLuc>
    <PL03_1A_TNDN>
      <ct01>10000000000</ct01>
      <ct03>0</ct03>
      <ct04>10000000000</ct04>
      <ct06>6000000000</ct06>
      <ct08>4000000000</ct08>
      <ct09>200000000</ct09>
      <ct10>500000000</ct10>
      <ct11>400000000</ct11>
      <ct13>1000000000</ct13>
      <ct14>1200000000</ct14>
      <ct15>1500000000</ct15>
      <ct16>0</ct16>
      <ct17>0</ct17>
      <ct18>0</ct18>
      <ct19>1500000000</ct19>
    </PL03_1A_TNDN>
    <PL03_2A_TNDN>
      <chiTietChuyenLo>
        <namPhatSinh>2018</namPhatSinh>
        <soLoPhatSinh>200000000</soLoPhatSinh>
        <soLoDaChuyen>100000000</soLoDaChuyen>
        <soLoChuyenKyNay>50000000</soLoChuyenKyNay>
        <soLoConLai>50000000</soLoConLai>
      </chiTietChuyenLo>
      <chiTietChuyenLo>
        <namPhatSinh>2019</namPhatSinh>
        <soLoPhatSinh>100000000</soLoPhatSinh>
        <soLoDaChuyen>0</soLoDaChuyen>
        <soLoChuyenKyNay>50000000</soLoChuyenKyNay>
        <soLoConLai>50000000</soLoConLai>
      </chiTietChuyenLo>
    </PL03_2A_TNDN>
  </PLuc>
</HSoThueDTu>`

  it('phân tích chính xác cấu trúc XML và thông tin chung TTinChung', () => {
    const doc = EtaxXmlParser.parseQtt03(sampleXmlTT151)
    expect(doc.version).toBe('TT151')
    expect(doc.generalInfo.mst).toBe('0101234567')
    expect(doc.generalInfo.tenNNT).toBe('CÔNG TY TNHH KIỂM TOÁN VÀ DỊCH VỤ AUDITSOFT')
    expect(doc.generalInfo.cqtNoiNop?.tenCQT).toBe('Chi cục Thuế Quận Hoàn Kiếm')
    expect(doc.generalInfo.kyKKhai.kyKKhaiTuNgay).toBe('01/01/2020')
  })

  it('trích xuất đầy đủ các chỉ tiêu Tờ khai chính 03/TNDN', () => {
    const doc = EtaxXmlParser.parseQtt03(sampleXmlTT151)
    expect(doc.mainForm.ctA1).toBe(1500000000)
    expect(doc.mainForm.ctB1).toBe(100000000)
    expect(doc.mainForm.ctB4).toBe(100000000)
    expect(doc.mainForm.ctC1).toBe(1600000000)
    expect(doc.mainForm.ctC4).toBe(1500000000)
    expect(doc.mainForm.ctC10).toBe(300000000)
    expect(doc.mainForm.ctE1).toBe(250000000)
    expect(doc.mainForm.ctG2).toBe(50000000)
  })

  it('trích xuất đầy đủ 19 chỉ tiêu của Phụ lục 03-1A/TNDN', () => {
    const doc = EtaxXmlParser.parseQtt03(sampleXmlTT151)
    expect(doc.pl03_1a).toBeDefined()
    expect(doc.pl03_1a?.ct01).toBe(10000000000)
    expect(doc.pl03_1a?.ct04).toBe(10000000000)
    expect(doc.pl03_1a?.ct06).toBe(6000000000)
    expect(doc.pl03_1a?.ct14).toBe(1200000000)
    expect(doc.pl03_1a?.ct19).toBe(1500000000)
    expect(doc.pl03_1a?.ct19).toBe(doc.mainForm.ctA1) // Kiểm tra tính liên kết [19] == [A1]
  })

  it('trích xuất các dòng chuyển lỗ trong Phụ lục 03-2A/TNDN', () => {
    const doc = EtaxXmlParser.parseQtt03(sampleXmlTT151)
    expect(doc.pl03_2a).toBeDefined()
    expect(doc.pl03_2a?.length).toBe(2)
    expect(doc.pl03_2a?.[0].namPhatSinh).toBe(2018)
    expect(doc.pl03_2a?.[0].soLoChuyenKyNay).toBe(50000000)
    expect(doc.pl03_2a?.[1].namPhatSinh).toBe(2019)
    expect(doc.pl03_2a?.[1].soLoChuyenKyNay).toBe(50000000)
  })

  it('tuần tự hóa XML và kiểm tra byte UTF-8 không chứa BOM', () => {
    const doc = EtaxXmlParser.parseQtt03(sampleXmlTT151)
    const xmlOut = EtaxXmlSerializer.serialize(doc.rawXmlTree)
    expect(xmlOut).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xmlOut).toContain('<ctA1>1500000000</ctA1>')

    const bytes = EtaxXmlSerializer.toCleanUtf8Bytes(xmlOut)
    expect(bytes[0]).toBe(0x3c)
    expect(bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf).toBe(false)
  })

  it('phân tích file thực tế do người dùng cung cấp', () => {
    const realOldPath = 'D:/Desktop/thư mục/3700426920000-03_TNDN_TT80-Y2025-L00 (cũ).xml'
    const realNewPath = 'D:/Desktop/thư mục/gemini-code-1788835615512 (mới).xml'

    if (fs.existsSync(realOldPath) && fs.existsSync(realNewPath)) {
      const oldXml = fs.readFileSync(realOldPath, 'utf8')
      const newXml = fs.readFileSync(realNewPath, 'utf8')

      const oldDoc = EtaxXmlParser.parseQtt03(oldXml)
      const newDoc = EtaxXmlParser.parseQtt03(newXml)

      expect(oldDoc.generalInfo.mst).toBe('3700426920')
      expect(oldDoc.generalInfo.tenNNT).toBe('CÔNG TY TNHH CÔNG NGHIỆP KIẾN ĐẠT')
      expect(oldDoc.mainForm.ctA1).toBe(31615542690)
      expect(oldDoc.mainForm.ctB1).toBe(460361745)
      expect(oldDoc.mainForm.ctC1).toBe(32075904435)
      expect(oldDoc.mainForm.ctC9).toBe(6415180887)

      // Đối chiếu số liệu giữa 2 file thực tế: phải khớp 100%
      expect(newDoc.mainForm.ctA1).toBe(oldDoc.mainForm.ctA1)
      expect(newDoc.mainForm.ctB1).toBe(oldDoc.mainForm.ctB1)
      expect(newDoc.mainForm.ctC1).toBe(oldDoc.mainForm.ctC1)
      expect(newDoc.mainForm.ctC9).toBe(oldDoc.mainForm.ctC9)
    }
  })
})
