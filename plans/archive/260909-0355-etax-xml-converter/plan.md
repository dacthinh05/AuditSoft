---
title: "Module Chuyển Đổi Tờ Khai Quyết Toán Thuế TNDN (03/TNDN) Trước TT80 Sang TT80/2021 Kèm Toàn Bộ Phụ Lục"
description: "Hệ thống tự động chuyển đổi tờ khai Quyết toán thuế TNDN (03/TNDN) từ cấu trúc cũ (Thông tư 151/2014, TT 156/2013) sang cấu trúc mới nhất của Thông tư 80/2021/TT-BTC, bao gồm Tờ khai chính và các Phụ lục liên quan (03-1A/TNDN Kết quả SXKD, 03-2A/TNDN Chuyển lỗ, 03-3A/TNDN Ưu đãi, 03-8A/TNDN Phân bổ), bảo toàn 100% số liệu tính thuế và hợp lệ iTaxViewer/HTKK."
status: completed
priority: P1
effort: "4d"
tags: ["etax", "xml", "03-tndn", "tt80", "tt151", "phu-luc", "converter", "reconciliation"]
created: 2026-09-09
---

# Module Chuyển Đổi Tờ Khai Quyết Toán Thuế TNDN (03/TNDN) Trước TT80 Sang TT80/2021 Kèm Toàn Bộ Phụ Lục

## Overview

Trước Thông tư 80/2021/TT-BTC, các doanh nghiệp kê khai Quyết toán thuế Thu nhập doanh nghiệp (mẫu biểu `03/TNDN`) theo Thông tư 151/2014/TT-BTC và Thông tư 156/2013/TT-BTC. Khi Tổng cục Thuế triển khai Thông tư 80/2021/TT-BTC trên hệ thống Thuế điện tử (`thuedientu.gdt.gov.vn`) và phần mềm HTKK (các bản 5.x), cấu trúc XML của tờ khai 03/TNDN đã thay đổi toàn diện:
1. Cấu trúc cây XSD đổi từ dạng phẳng sang phân cấp đa tầng (phân tách rõ ràng giữa hoạt động SXKD thông thường, chuyển nhượng BĐS, cơ sở sản xuất phân bổ khác tỉnh).
2. Quy định bắt buộc về các khối thẻ kỹ thuật (`pbanXml` 2.1.4/2.2.0, namespace mới, quy chuẩn thẻ con).
3. Các phụ lục đính kèm (`03-1A/TNDN`, `03-2A/TNDN`, `03-3A/TNDN`, `03-8A/TNDN`) thay đổi mã định danh bảng biểu và mã chỉ tiêu con.

Khi kế toán cần nộp lại tờ khai, nộp tờ khai bổ sung cho các năm cũ, hoặc chuyển dữ liệu lịch sử vào hệ thống mới, việc gõ lại bằng tay rất dễ sai lệch số tiền và mất nhiều giờ đối chiếu.

Module này thực hiện **chuyển đổi tự động từ file XML cũ (TT151) sang file XML mới chuẩn Thông tư 80/2021**, chuyển đổi đồng thời cả **Tờ khai chính 03/TNDN** và **Toàn bộ các phụ lục liên quan**, bảo toàn từng đồng số liệu (`Variance = 0 VNĐ`).

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Xây dựng bộ Parser & Serializer XML chuyên biệt cho tờ khai 03/TNDN (nhận diện đúng cấu trúc cũ TT 151/156 và cấu trúc mới TT 80/2021, xuất XML UTF-8 không BOM) | P1 |
| 2 | Ánh xạ toàn bộ chỉ tiêu Tờ khai chính 03/TNDN: [A1] LNTT, [B1]–[B14] Điều chỉnh tăng giảm LN, [C1]–[C16] Thu nhập tính thuế & Thuế phải nộp, [D1]–[D8] Thuế BĐS, [E1]–[E4] Thuế tạm nộp, [G1]–[G2] Chênh lệch | P1 |
| 3 | Chuyển đổi trọn vẹn Phụ lục 03-1A/TNDN (Kết quả hoạt động SXKD từ [01] đến [19]), đảm bảo [19] khớp [A1] trên tờ khai chính | P1 |
| 4 | Chuyển đổi Phụ lục 03-2A/TNDN (Bảng chuyển lỗ đa kỳ: số lỗ phát sinh, số lỗ đã chuyển, số lỗ chuyển kỳ này, số lỗ còn lại) | P1 |
| 5 | Tự động khởi tạo Phụ lục 03-8A/TNDN (Phân bổ thuế cho cơ sở khác tỉnh theo TT 80, mặc định 100% trụ sở chính nếu cũ không có chi nhánh) để vượt qua bộ lọc XSD của HTKK | P1 |
| 6 | Bảng kiểm soát đối chiếu số liệu (Zero-Variance Reconciler) hiển thị trực quan sai lệch giữa 2 bản khai, phát hiện và cảnh báo mọi chênh lệch | P1 |
| 7 | Giao diện DropZone tiện ích trong AuditSoft: Kéo 1 file cũ (chuyển tự động) hoặc 2 file (kèm template tùy chọn), xem trước diff và tải file XML | P1 |

## Phases

| # | Phase | Status | Priority | Effort |
|---|-------|--------|----------|--------|
| 1 | [Phase 1: Core XML Parser, DOM Dictionary & QTT 03 Data Model](./phase-01-start.md) | Pending | P1 | 5h |
| 2 | [Phase 2: 03/TNDN Main Form & Appendices Migration Engine](./phase-02-builtin-templates-and-migration-engine.md) | Pending | P1 | 8h |
| 3 | [Phase 3: Financial Integrity & Appendix Variance Reconciler](./phase-03-reconciliation-and-checksum-validator.md) | Pending | P1 | 4h |
| 4 | [Phase 4: UI DropZone, Visual Diff Table & XML Exporter](./phase-04-ui-converter-and-export-workflow.md) | Pending | P1 | 5h |
| 5 | [Phase 5: End-to-End Test Suite & iTaxViewer/HTKK Verification](./phase-05-integration-and-itaxviewer-verification.md) | Pending | P1 | 4h |

## Architecture & Data Flow

```mermaid
flowchart TD
    subgraph InputFiles [Đầu Vào]
        OldFile[File XML 03/TNDN Cũ: TT 151 / TT 156]
        TargetTemplate[Template Chuẩn TT 80: Tích hợp sẵn hoặc File mẫu mới]
    end

    subgraph Extraction [Bóc Tách Dữ Liệu]
        Parser[EtaxXmlParser]
        HeaderData[Thông tin chung: MST, Tên NNT, Năm QTT, CQT]
        MainData[Từ điển Tờ khai chính: A1, B1-B14, C1-C16, D, E, G]
        PL1A[Phụ lục 03-1A: Doanh thu, Chi phí, LN [01]-[19]]
        PL2A[Phụ lục 03-2A: Chi tiết chuyển lỗ các năm]
        PL3A[Phụ lục 03-3A: Ưu đãi thuế nếu có]
    end

    OldFile --> Parser
    Parser --> HeaderData
    Parser --> MainData
    Parser --> PL1A
    Parser --> PL2A
    Parser --> PL3A

    subgraph Transformation [Lõi Chuyển Đổi TT80]
        Engine[Qtt03Migrator]
        TargetTemplate --> Engine
        HeaderData & MainData & PL1A & PL2A & PL3A --> Engine
        
        RuleMain[Ánh xạ thẻ chính sang phân cấp TT80]
        RulePL1A[Ánh xạ bảng 03-1A/TNDN chuẩn TT80]
        RulePL2A[Ánh xạ bảng ma trận chuyển lỗ 03-2A/TNDN]
        RulePL8A[Tự động tạo Phụ lục 03-8A: 100% Trụ sở chính]

        Engine --> RuleMain
        Engine --> RulePL1A
        Engine --> RulePL2A
        Engine --> RulePL8A
    end

    subgraph Validation [Kiểm Định Toàn Vẹn Số Liệu]
        Validator[Qtt03Validator]
        RuleMain & RulePL1A & RulePL2A & RulePL8A --> Validator
        DiffReport[Báo Cáo Đối Chiếu: Variance = 0 VNĐ]
        IntegrityGate{Khớp 100% & Hợp Lệ XSD?}
        Validator --> DiffReport
        Validator --> IntegrityGate
    end

    subgraph Output [Xuất File]
        Serializer[EtaxXmlSerializer: UTF-8 No BOM]
        IntegrityGate -- Hợp lệ --> Serializer
        Serializer --> ResultXml[File XML 03/TNDN TT 80 Hoàn Chỉnh]
        IntegrityGate -- Cảnh báo --> UIReview[Giao diện Diff Review & Manual Adjust]
    end
```

## Success Criteria

- [ ] Tự động chuyển đổi thành công tờ khai 03/TNDN cũ từ TT 151 sang TT 80 mà không cần gõ lại bất kỳ số liệu nào.
- [ ] Chuyển đổi trọn vẹn Phụ lục 03-1A/TNDN (Kết quả SXKD), chỉ tiêu [19] trên phụ lục khớp 100% với [A1] trên tờ khai chính.
- [ ] Chuyển đổi trọn vẹn Phụ lục 03-2A/TNDN (Chuyển lỗ) và khởi tạo hợp lệ Phụ lục phân bổ 03-8A/TNDN.
- [ ] Tổng sai lệch tài chính (Variance) trên toàn bộ các chỉ tiêu [A1] đến [G2] = `0 VNĐ`.
- [ ] File XML kết quả mở được trên **iTaxViewer** và import thành công vào **HTKK 5.2.x** không báo lỗi cấu trúc tệp.
