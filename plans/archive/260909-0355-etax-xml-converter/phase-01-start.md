---
phase: 1
title: "Core XML Parser, DOM Dictionary & QTT 03 Data Model"
status: pending
priority: P1
effort: "5h"
dependencies: []
---

# Phase 1: Core XML Parser, DOM Dictionary & QTT 03 Data Model

## Overview
Xây dựng lớp nền tảng xử lý XML chuyên sâu cho tờ khai Quyết toán thuế TNDN (`03/TNDN`). Module chịu trách nhiệm phân tích cú pháp (parse) file XML tờ khai 03 cũ (theo Thông tư 151/2014 và Thông tư 156/2013) thành mô hình dữ liệu tường minh (Tax Data Model), bóc tách toàn diện phần Header (`TTinChung`), Tờ khai chính (`CTietTKhaiChinh`), và các Phụ lục đính kèm (`03-1A`, `03-2A`, `03-3A`), đồng thời cung cấp bộ Serializer xuất ngược lại file XML chuẩn UTF-8 không BOM tương thích với iTaxViewer/HTKK.

## Requirements
- Functional:
  - Đọc file XML hoặc chuỗi XML, bóc tách an toàn các thực thể XML và bảo toàn encoding tiếng Việt có dấu.
  - Bóc tách Thông tin chung (`TTinChung`): MST, Tên NNT, Năm quyết toán, Ngày lập, Mã cơ quan thuế quản lý, Tờ khai chính thức / Bổ sung.
  - Xây dựng từ điển chỉ tiêu Tờ khai chính `03/TNDN`:
    - Chỉ tiêu `[A1]`: Tổng lợi nhuận kế toán trước thuế.
    - Khối `[B1]`–`[B14]`: Các khoản điều chỉnh tăng/giảm LNTT (chi phí không được trừ, thu nhập miễn thuế, cổ tức...).
    - Khối `[C1]`–`[C16]`: Thu nhập chịu thuế, thu nhập tính thuế, thuế suất, thuế TNDN phát sinh từ HĐ SXKD thông thường.
    - Khối `[D1]`–`[D8]`: Thuế TNDN từ chuyển nhượng BĐS.
    - Khối `[E1]`–`[E4]`: Thuế TNDN tạm nộp các quý trong năm.
    - Khối `[G1]`–`[G2]`: Số thuế TNDN nộp thừa / còn phải nộp sau quyết toán.
  - Bóc tách Phụ lục Kết quả kinh doanh `03-1A/TNDN`:
    - Trích xuất toàn bộ 19 chỉ tiêu kinh doanh: Doanh thu bán hàng [01], Các khoản giảm trừ [02], Doanh thu thuần [03], Giá vốn hàng bán [04], Lợi nhuận gộp [05], Doanh thu tài chính [06], Chi phí tài chính [07], Chi phí lãi vay [08], Chi phí bán hàng [09], Chi phí QLDN [10], Lợi nhuận thuần [11], Thu nhập khác [12], Chi phí khác [13], Lợi nhuận khác [14], Tổng LNTT [15] (= [A1]).
  - Bóc tách Phụ lục Chuyển lỗ `03-2A/TNDN`:
    - Trích xuất mảng các dòng chuyển lỗ qua các năm tài chính (Năm phát sinh, Số lỗ phát sinh, Số lỗ đã chuyển các năm trước, Số lỗ chuyển kỳ này, Số lỗ còn lại được chuyển).
  - Bộ Serializer: Xuất ngược cây DOM thành chuỗi XML hợp lệ với iTaxViewer (UTF-8 No BOM, format indent rõ ràng, đóng thẻ chuẩn).
- Non-functional:
  - Tốc độ parse file XML 03/TNDN kèm đầy đủ phụ lục dưới 150ms.
  - Hoạt động ổn định trên cả Electron Main/Worker process và Browser Renderer.

## Architecture
```text
Raw XML 03/TNDN File
         │
         ▼
[EtaxXmlParser]
  ├── parseTTinChung()      ──> TaxGeneralInfo (MST, Tên NNT, Năm QTT, CQT)
  ├── parse03MainForm()      ──> Qtt03MainIndicators ([A1], [B1-B14], [C1-C16], [D], [E], [G])
  ├── parsePL03_1A()         ──> QttPL03_1AData (Chỉ tiêu [01] đến [19])
  └── parsePL03_2A()         ──> QttPL03_2ARow[] (Bảng ma trận chuyển lỗ)
         │
         ▼
[Qtt03Document Model]
         │
         ▼
[EtaxXmlSerializer] ──> UTF-8 No BOM XML String
```

## Related Code Files
- Create: `src/domain/etax/types.ts` (Interface Qtt03Document, Qtt03MainIndicators, PL03_1AData, PL03_2ARow)
- Create: `src/domain/etax/EtaxXmlParser.ts` (Lớp đọc XML và trích xuất dữ liệu)
- Create: `src/domain/etax/EtaxXmlSerializer.ts` (Lớp xuất XML chuẩn định dạng Tổng cục Thuế)
- Create: `tests/etax-parser.test.ts` (Unit test cho parser và serializer 03/TNDN)

## Implementation Steps
1. Khai báo types trong `src/domain/etax/types.ts`:
   - `Qtt03MainForm`: các trường `ctA1`, `ctB1`..`ctB14`, `ctC1`..`ctC16`, `ctD1`..`ctD8`, `ctE1`..`ctE4`, `ctG1`..`ctG2`.
   - `QttPL03_1A`: các trường `ct01`..`ct19`.
   - `QttPL03_2A`: mảng dòng `{ namPhatSinh, soLoPhatSinh, soLoDaChuyen, soLoChuyenKyNay, soLoConLai }`.
   - `Qtt03Document`: bao gồm header, main form, phụ lục 1A, 2A, 3A và raw DOM document.
2. Cài đặt `EtaxXmlParser.ts`:
   - Dùng DOMParser chuẩn web/node.
   - Viết các hàm bóc tách thẻ thông minh: hỗ trợ cả thẻ dạng phẳng TT 151 (`<ctA1>`, `<ctB1>`, `<ct01>`) và thẻ phân cấp TT 80.
   - Trích xuất dữ liệu dạng bảng của phụ lục chuyển lỗ 03-2A từ các thẻ lặp `<chiTietChuyenLo>` hoặc `<Dong>`.
3. Cài đặt `EtaxXmlSerializer.ts`:
   - XML declaration `<?xml version="1.0" encoding="UTF-8"?>`.
   - Đảm bảo tuyệt đối không có 3 byte BOM đầu file.
   - Giữ nguyên cấu trúc thẻ và namespace của Tổng cục Thuế.
4. Viết unit test trong `tests/etax-parser.test.ts`:
   - Parse mẫu XML 03/TNDN cũ theo TT 151.
   - Kiểm tra trích xuất đầy đủ 100% các giá trị số học và phụ lục 03-1A.

## Success Criteria
- [x] Parse thành công file XML 03/TNDN mẫu cũ, trích xuất chính xác 100% các chỉ tiêu [A1]..[G2].
- [x] Trích xuất đầy đủ 19 chỉ tiêu của Phụ lục 03-1A/TNDN.
- [x] Trích xuất danh sách dòng chuyển lỗ của Phụ lục 03-2A/TNDN (nếu có).
- [x] Serializer xuất ra file XML hợp lệ không chứa ký tự BOM.

## Risk Assessment
- **Rủi ro:** Một số phần mềm kế toán cũ (FAST, MISA, Bravo) kết xuất thẻ con với tiền tố namespace (ví dụ `<ns:ctA1>`) hoặc viết hoa thường lẫn lộn.
- **Biện pháp:** Parser sử dụng `localName` khi duyệt các phần tử XML để triệt tiêu ảnh hưởng của namespace prefix và hoa/thường.
