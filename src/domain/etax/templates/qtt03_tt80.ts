/**
 * Template mẫu chuẩn Tờ khai Quyết toán thuế TNDN (03/TNDN) theo Thông tư 80/2021/TT-BTC
 * Cập nhật cấu trúc mới nhất của HTKK 5.7.6 / XML Schema 2.9.4
 */
export function getQtt03TT80BlankTemplate(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<HSoThueDTu xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://kekhaithue.gdt.gov.vn/TKhaiThue">
  <HSoKhaiThue id="ID_1">
    <TTinChung>
      <TTinDVu>
        <maDVu>HTKK</maDVu>
        <tenDVu>HỖ TRỢ KÊ KHAI THUẾ</tenDVu>
        <pbanDVu>5.7.6</pbanDVu>
        <ttinNhaCCapDVu>8CAA73E25E2E77BCFCBB40B6028B22F7</ttinNhaCCapDVu>
      </TTinDVu>
      <TTinTKhaiThue>
        <TKhaiThue>
          <maTKhai>892</maTKhai>
          <tenTKhai>TỜ KHAI QUYẾT TOÁN THUẾ THU NHẬP DOANH NGHIỆP (Mẫu số 03/TNDN)</tenTKhai>
          <moTaBMau>(Ban hành kèm theo Thông tư số 80/2021/TT-BTC ngày 29 tháng 9 năm 2021 của Bộ trưởng Bộ Tài chính)</moTaBMau>
          <pbanTKhaiXML>2.9.4</pbanTKhaiXML>
          <loaiTKhai>C</loaiTKhai>
          <soLan>0</soLan>
          <KyKKhaiThue>
            <kieuKy>Y</kieuKy>
            <kyKKhai>2025</kyKKhai>
            <kyKKhaiTuNgay>01/01/2025</kyKKhaiTuNgay>
            <kyKKhaiDenNgay>31/12/2025</kyKKhaiDenNgay>
            <kyKKhaiTuThang />
            <kyKKhaiDenThang />
          </KyKKhaiThue>
          <maCQTNoiNop>71300</maCQTNoiNop>
          <tenCQTNoiNop>Thuế Tỉnh Đồng Nai</tenCQTNoiNop>
          <ngayLapTKhai>2026-03-18</ngayLapTKhai>
          <GiaHan>
            <maLyDoGiaHan />
            <lyDoGiaHan />
          </GiaHan>
          <nguoiKy />
          <ngayKy>2026-03-18</ngayKy>
          <nganhNgheKD />
        </TKhaiThue>
        <NNT>
          <mst>0100000000</mst>
          <tenNNT>DOANH NGHIỆP KÊ KHAI</tenNNT>
          <dchiNNT>Việt Nam</dchiNNT>
          <phuongXa />
          <maHuyenNNT />
          <tenHuyenNNT />
          <maTinhNNT />
          <tenTinhNNT />
          <dthoaiNNT />
          <faxNNT />
          <emailNNT />
        </NNT>
      </TTinTKhaiThue>
    </TTinChung>
    <CTieuTKhaiChinh>
      <Header>
        <kyTaiChinh_Tu>01/01</kyTaiChinh_Tu>
        <kyTaiChinh_Den>31/12</kyTaiChinh_Den>
        <ma_THQuyetToan>01</ma_THQuyetToan>
        <ten_THQuyetToan>QT định kỳ</ten_THQuyetToan>
        <ct04_ma>G46</ct04_ma>
        <ct04_ten>G46 - Bán buôn</ct04_ten>
        <ct05>100.00</ct05>
      </Header>
      <ctA1>0</ctA1>
      <ctB1>0</ctB1>
      <ctB2>0</ctB2>
      <ctB3>0</ctB3>
      <ctB4>0</ctB4>
      <ctB5>0</ctB5>
      <ctB6>0</ctB6>
      <ctB7>0</ctB7>
      <ctB8>0</ctB8>
      <ctB9>0</ctB9>
      <ctB10>0</ctB10>
      <ctB11>0</ctB11>
      <ctB12>0</ctB12>
      <ctB13>0</ctB13>
      <ctB14>0</ctB14>
      <ctB15>0</ctB15>
      <ctC1>0</ctC1>
      <ctC2>0</ctC2>
      <dsThMienThue>
        <thMienThue id="ID_1">
          <ma_loaiMien />
          <ten_loaiMien />
          <ctC2_soThuNhap>0</ctC2_soThuNhap>
        </thMienThue>
      </dsThMienThue>
      <ctC3>0</ctC3>
      <ctC3a>0</ctC3a>
      <ctC3b>0</ctC3b>
      <ctC4>0</ctC4>
      <ctC5>0</ctC5>
      <ctC6>0</ctC6>
      <ctC7_thuNhap>0</ctC7_thuNhap>
      <ctC7_tenThueSuat>+ Thu nhập tính thuế áp dụng thuế suất 20%</ctC7_tenThueSuat>
      <ctC7_thueSuat>20</ctC7_thueSuat>
      <ctC8>0</ctC8>
      <ctC8a>0</ctC8a>
      <ctC9>0</ctC9>
      <ctC10>0</ctC10>
      <ctC11>0</ctC11>
      <ctC12>0</ctC12>
      <ctC13>0</ctC13>
      <ctC14>0</ctC14>
      <ctC15>0</ctC15>
      <ctC16>0</ctC16>
      <ctC17>0</ctC17>
      <ctD1>0</ctD1>
      <ctD2>0</ctD2>
      <ctD3>0</ctD3>
      <ctD4>0</ctD4>
      <ctD5>0</ctD5>
      <ctD6>0</ctD6>
      <ctD7>0</ctD7>
      <ctD8>0</ctD8>
      <ctE>0</ctE>
      <ctE1>0</ctE1>
      <ctE2>0</ctE2>
      <ctE3>0</ctE3>
      <ctE4>0</ctE4>
      <ctE5>0</ctE5>
      <ctE6>0</ctE6>
      <ctG>0</ctG>
      <thueTNDN_tamnop_sxkd>0</thueTNDN_tamnop_sxkd>
      <thueTNDN_tamnop_bds>0</thueTNDN_tamnop_bds>
      <ctG1>0</ctG1>
      <ctG2>0</ctG2>
      <ctG3>0</ctG3>
      <ctG4>0</ctG4>
      <ctG5>0</ctG5>
      <ctH>0</ctH>
      <ctI>0</ctI>
    </CTieuTKhaiChinh>
    <PLuc>
      <PL03_1A_TNDN>
        <ct01>0</ct01>
        <ct02>0</ct02>
        <ct03>0</ct03>
        <ct04>0</ct04>
        <ct05>0</ct05>
        <ct06>0</ct06>
        <ct07>0</ct07>
        <ct08>0</ct08>
        <ct09>0</ct09>
        <ct10>0</ct10>
        <ct11>0</ct11>
        <ct12>0</ct12>
        <ct13>0</ct13>
        <ct14>0</ct14>
        <ct15>0</ct15>
        <ct16>0</ct16>
        <ct17>0</ct17>
        <ct18>0</ct18>
        <ct19>0</ct19>
      </PL03_1A_TNDN>
    </PLuc>
  </HSoKhaiThue>
</HSoThueDTu>`
}
