---
phase: 2
title: "03/TNDN Main Form & Appendices Migration Engine"
status: pending
priority: P1
effort: "8h"
dependencies: [1]
---

# Phase 2: 03/TNDN Main Form & Appendices Migration Engine

## Overview
Hiện thực hóa lõi chuyển đổi (Migration Engine) trung tâm cho tờ khai Quyết toán thuế TNDN (`03/TNDN`) từ Thông tư 151 sang Thông tư 80/2021/TT-BTC. Giai đoạn này đảm nhiệm việc xây dựng Template mẫu chuẩn TT 80 tích hợp sẵn (Built-in Template), logic ánh xạ chi tiết cho toàn bộ các chỉ tiêu của **Tờ khai chính** và **Các phụ lục liên quan** (`03-1A/TNDN` Kết quả SXKD, `03-2A/TNDN` Chuyển lỗ, và tự động tạo cấu trúc `03-8A/TNDN` Phân bổ trụ sở chính), đảm bảo file đầu ra tuân thủ tuyệt đối chuẩn XSD mới nhất của eTax/HTKK.

## Requirements
- Functional:
  - Xây dựng Template XML chuẩn Thông tư 80/2021 cho tờ khai `03/TNDN`:
    - Header chuẩn: `pbanXml` mới nhất (2.1.4 / 2.2.0), `maTKhai="03/TNDN"`, đúng định dạng ngày tháng và mã cơ quan thuế.
    - Cấu trúc thân phân cấp theo nhóm hoạt động: SXKD thông thường, Bất động sản, Phân bổ.
    - Cấu trúc cây phụ lục: `<PLuc>` chứa `03-1A/TNDN`, `03-2A/TNDN`, `03-8A/TNDN`.
  - Ánh xạ chi tiết Tờ khai chính 03/TNDN:
    - Đồng bộ Header: MST, Tên người nộp thuế, Năm quyết toán, Cơ quan thuế từ file cũ sang mẫu TT80.
    - Ánh xạ chỉ tiêu `[A1]`: Lợi nhuận trước thuế.
    - Ánh xạ khối `[B1]`–`[B14]`: Toàn bộ các chỉ tiêu điều chỉnh tăng/giảm lợi nhuận kế toán (chi phí không được trừ, thu nhập chịu thuế khác, doanh thu điều chỉnh...).
    - Ánh xạ khối `[C1]`–`[C16]`: Thu nhập chịu thuế, thu nhập tính thuế, thuế suất áp dụng (20% hoặc ưu đãi), số thuế TNDN phát sinh từ SXKD.
    - Ánh xạ khối `[D1]`–`[D8]`: Thuế TNDN từ hoạt động chuyển nhượng bất động sản.
    - Ánh xạ khối `[E1]`–`[E4]`: Số thuế TNDN đã tạm nộp các quý trong năm.
    - Ánh xạ khối `[G1]`–`[G2]`: Chênh lệch thừa / thiếu sau quyết toán.
  - Chuyển đổi Phụ lục `03-1A/TNDN` (Kết quả hoạt động SXKD):
    - Ánh xạ tuần tự 19 chỉ tiêu [01] đến [19] vào cây thẻ phụ lục chuẩn TT 80.
    - Tự động gán mã ngành kinh tế mặc định nếu mẫu cũ chưa có.
    - Đảm bảo chỉ tiêu [19] trên 03-1A luôn bằng đúng chỉ tiêu [A1] trên tờ khai chính.
  - Chuyển đổi Phụ lục `03-2A/TNDN` (Bảng chuyển lỗ đa kỳ):
    - Đọc mảng các dòng chuyển lỗ từ mẫu cũ, tạo các thẻ con tương ứng trong bảng `<PL03_2A_TNDN>` của TT 80.
    - Điền đầy đủ: Năm phát sinh lỗ, Số lỗ phát sinh, Số lỗ đã chuyển các kỳ trước, Số lỗ chuyển kỳ này, Số lỗ còn lại.
  - Tự động sinh Phụ lục `03-8A/TNDN` (Phân bổ thuế cho cơ sở khác tỉnh):
    - TT 80 yêu cầu nghiêm ngặt về phân bổ thuế. Nếu doanh nghiệp ở mẫu cũ không có chi nhánh khác tỉnh, hệ thống tự động sinh cấu trúc phân bổ 100% tại trụ sở chính (Tỷ lệ phân bổ = 1, Số thuế phân bổ = Tổng thuế phát sinh) để tránh lỗi từ chối XSD khi import vào HTKK 5.2.x.
  - Hỗ trợ cả 2 chế độ:
    - *Chế độ 1:* Tự động hoàn toàn bằng Built-in Template của ứng dụng.
    - *Chế độ 2:* Cho phép nạp 1 file mẫu mới bất kỳ do người dùng tự xuất từ HTKK mới nhất để làm khuôn.
- Non-functional:
  - Thời gian xử lý toàn bộ tờ khai chính + 3 phụ lục dưới 400ms.

## Architecture
```text
[Old 03/TNDN Document] ──────┐
                             ▼
[Target TT80 Template] ──> [Qtt03Migrator]
                             ├── 1. Sync Header (MST, Tên NNT, Năm QTT)
                             ├── 2. Map Main Form ([A1], [B1-B14], [C1-C16], [D], [E], [G])
                             ├── 3. Map PL 03-1A/TNDN ([01] to [19])
                             ├── 4. Map PL 03-2A/TNDN (Loss Carryforward Rows)
                             └── 5. Auto-Generate PL 03-8A/TNDN (100% Head Office)
                             │
                             ▼
             [Migrated TT80 03/TNDN Document]
```

## Related Code Files
- Create: `src/domain/etax/templates/qtt03_tt80.ts` (Khung XML mẫu chuẩn TT80 cho 03/TNDN kèm 03-1A, 03-2A, 03-8A)
- Create: `src/domain/etax/Qtt03Migrator.ts` (Class điều phối việc map tờ khai chính và các phụ lục)
- Create: `src/domain/etax/Qtt03IndicatorMap.ts` (Bảng tra cứu quy tắc ánh xạ thẻ TT151 -> TT80)
- Create: `tests/qtt03-migrator.test.ts` (Unit test cho chuyển đổi tờ khai chính và từng phụ lục)

## Implementation Steps
1. Xây dựng template chuẩn `qtt03_tt80.ts`:
   - Soạn thảo cấu trúc XML chuẩn TT80 của 03/TNDN có đầy đủ khối `<TTinChung>`, `<CTietTKhaiChinh>`, và các thẻ `<PLuc>`.
2. Xây dựng bảng quy tắc `Qtt03IndicatorMap.ts`:
   - Định nghĩa quy tắc chuyển đổi thẻ: ví dụ `ctA1` -> `<ctA1>`, `ctB1` -> `<ctB1>`, v.v.
   - Định nghĩa ánh xạ các trường của Phụ lục 03-1A và 03-2A.
3. Hiện thực `Qtt03Migrator.ts`:
   - Hàm `migrate(oldDoc: Qtt03Document, customTemplate?: Document): Promise<Qtt03Document>`.
   - Bơm dữ liệu vào Tờ khai chính.
   - Xóa các dòng mẫu trong phụ lục 03-1A, 03-2A và bơm dữ liệu thực tế vào.
   - Bổ sung phụ lục 03-8A nếu chưa có.
4. Viết unit test trong `tests/qtt03-migrator.test.ts`:
   - Test ánh xạ đúng 100% số liệu tờ khai chính.
   - Test ánh xạ đúng phụ lục 03-1A (kiểm tra [19] == [A1]).
   - Test tạo đúng số dòng trong phụ lục 03-2A.

## Success Criteria
- [x] Chuyển đổi thành công toàn bộ số liệu tờ khai chính [A1] đến [G2] sang cây thẻ TT 80.
- [x] Chuyển đổi thành công toàn bộ 19 chỉ tiêu của phụ lục 03-1A/TNDN.
- [x] Chuyển đổi chính xác bảng chuyển lỗ 03-2A/TNDN theo từng năm phát sinh.
- [x] Tự động tạo phụ lục 03-8A/TNDN hợp lệ theo quy định TT 80.

## Risk Assessment
- **Rủi ro:** Khi doanh nghiệp cũ có chuyển lỗ ở nhiều năm khác nhau, số lượng thẻ `<Dong>` trong phụ lục 03-2A thay đổi linh hoạt.
- **Biện pháp:** Migrator tạo động (dynamic node cloning) các phần tử XML tương ứng với số lượng dòng thực tế phát sinh, tự động đánh số thứ tự `stt`.
