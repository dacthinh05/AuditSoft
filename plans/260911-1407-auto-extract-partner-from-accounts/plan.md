---
title: "Kế Hoạch Tự Động Bóc Tách Mã & Tên Đối Tượng Từ Tài Khoản Kế Toán (3311ABC, 1311XYZ)"
description: "Tự động nhận diện và trích xuất mã đối tác từ đuôi tài khoản công nợ (131, 331, 141, 1388) và tra cứu tên đối tác từ CDFS / Diễn giải phục vụ phân tích Pareto, Rủi ro thuế B4 và Giấy làm việc"
status: "completed"
priority: "high"
author: "Antigravity Assistant"
created: "2026-09-11"
phases:
  - id: "phase-01"
    name: "Xây dựng thuật toán bóc tách đối tượng PartnerExtractor"
    file: "phase-01-partner-extractor-engine.md"
    status: "completed"
  - id: "phase-02"
    name: "Tích hợp vào Pipeline chuẩn hóa dữ liệu (Standardize & Normalizer)"
    file: "phase-02-integrate-pipeline.md"
    status: "completed"
  - id: "phase-03"
    name: "Cập nhật phân hệ Phân tích Pareto và Quét rủi ro thuế NĐ 181"
    file: "phase-03-update-analytics-and-taxrisk.md"
    status: "completed"
  - id: "phase-04"
    name: "Kiểm thử end-to-end với các mẫu tài khoản thực tế và build hệ thống"
    file: "phase-04-verification.md"
    status: "completed"
---

# KẾ HOẠCH BÓC TÁCH MÃ & TÊN ĐỐI TƯỢNG TỰ ĐỘNG TỪ TÀI KHOẢN KẾ TOÁN

## 1. Bối Cảnh & Vấn Đề Thực Tế
Trong thực tế kế toán doanh nghiệp tại Việt Nam:
- Rất nhiều doanh nghiệp **không theo dõi cột "Mã đối tượng" riêng** trong Sổ Nhật Ký Chung (cột Mã KH/Mã NCC bị để trống hoặc không tồn tại trong file Excel).
- Thay vào đó, kế toán gắn trực tiếp mã định danh đối tác vào đuôi của tài khoản công nợ:
  * Ví dụ: `3311ABC` (NCC ABC), `3311DBL` (Công ty Đông Bảo Lực), `3311HTK` (Hưng Thịnh Khang)...
  * Ví dụ: `1311SH` (Khách hàng Sheng Huei), `1311HLVT` (Thực Nghiệp HL-VT), `1311DBL`...
  * Ví dụ: `1411NGUYEN_A`, `1388_CTYB`...
- Hậu quả trước đây: Các phân hệ **Phân tích Pareto (Top KH & Top NCC)**, **Rà soát chi tiền mặt chia nhỏ cùng ngày cùng NCC (NĐ 181)** và **Giấy làm việc công nợ D351/E250** không nhận diện được đối tượng, dẫn đến bị dồn chung vào nhãn *"Khách hàng vãng lai"* hoặc *"Nhà cung cấp khác"*.

## 2. Kiến Trúc Giải Pháp 3 Tầng Nhận Diện
```mermaid
flowchart TD
    ENTRY[Bút toán NKC: Debit, Credit, Desc, PartnerCode, PartnerName] --> EXT[PartnerExtractor Engine]
    CDFS[Bảng CDFS: Tra cứu Tên TK / Tên Đối Tượng] --> EXT
    
    EXT --> S1{Có cột PartnerCode riêng?}
    S1 -->|Có| RES1[Lấy mã & tên từ cột đối tượng]
    S1 -->|Trống/Không có| S2{TK 131, 331, 141, 1388 có đuôi chữ cái/ký tự?}
    
    S2 -->|Có: 3311ABC, 1311SH| RES2[Tách mã đối tác = ABC, SH]
    S2 -->|Chỉ có số chuẩn: 331, 131| S3[Quét từ khóa Tên công ty trong Diễn giải]
    
    RES2 --> LOOKUP{Có trong CDFS không?}
    LOOKUP -->|Có: 3311ABC = Cty TNHH ABC| FULLNAME[Lấy tên công ty đầy đủ từ CDFS]
    LOOKUP -->|Không| DESC_NAME[Lấy tên từ diễn giải hoặc dùng mã đối tác]
    
    S3 --> FULLNAME
    RES1 --> OUTPUT[Entry với PartnerCode & PartnerName Chuẩn Xác]
    FULLNAME --> OUTPUT
    DESC_NAME --> OUTPUT
```

## 3. Danh Sách Các Pha Thực Hiện
- **[Pha 1: Thuật toán PartnerExtractor](phase-01-partner-extractor-engine.md)**: Xây dựng hàm `extractPartnerFromAccount` và `extractPartnerNameFromCdfsOrDesc`.
- **[Pha 2: Tích hợp Pipeline](phase-02-integrate-pipeline.md)**: Nối vào `standardizeSource` (Frontend/Clipboard) và `JournalNormalizer` (Backend/Main Process).
- **[Pha 3: Nâng cấp Analytics & Tax Risk](phase-03-update-analytics-and-taxrisk.md)**: Cập nhật `ConcentrationAnalyzer` (Pareto) và `CashTaxRiskScanner` (NĐ 181) để tận dụng mã đối tác mới bóc tách.
- **[Pha 4: Kiểm thử & Nghiệm thu](phase-04-verification.md)**: Viết script test với các mẫu tài khoản `3311ABC`, `1311XYZ`, `1411NAM` và chạy `npm run build`.
