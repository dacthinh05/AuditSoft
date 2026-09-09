---
phase: 4
title: "UI DropZone, Visual Diff Table & XML Exporter"
status: pending
priority: P1
effort: "5h"
dependencies: [1, 2, 3]
---

# Phase 4: UI DropZone, Visual Diff Table & XML Exporter

## Overview
Xây dựng giao diện người dùng trực quan, hiện đại, tích hợp trực tiếp vào thanh điều hướng của AuditSoft, hỗ trợ kế toán thao tác chuyển đổi tờ khai Quyết toán thuế TNDN (`03/TNDN`) trước Thông tư 80 sang Thông tư 80/2021/TT-BTC. Giao diện cung cấp vùng kéo thả file thông minh (hỗ trợ cả chế độ 1 file tự động và 2 file kèm mẫu), hiển thị các thẻ KPI tài chính quan trọng, bảng đối chiếu số liệu phân nhóm rõ ràng (Tờ khai chính, Phụ lục 03-1A, Phụ lục 03-2A) và nút tải file XML chuẩn eTax chỉ với 1 cú click.

## Requirements
- Functional:
  - Tích hợp thêm Tab **"Chuyển Đổi QTT TNDN"** trên thanh Navigation của AuditSoft.
  - Vùng kéo thả tệp thông minh (DropZone):
    - *Chế độ 1 (Mặc định - Khuyên dùng):* Kéo thả duy nhất 1 file XML 03/TNDN cũ (TT151). Hệ thống tự nhận diện MST, Tên công ty, Năm quyết toán và tự động nạp template chuẩn TT80.
    - *Chế độ 2 (Kèm file mẫu tùy chọn):* Cung cấp 2 ô kéo thả cạnh nhau (File Cũ + File Mẫu Mới) cho trường hợp người dùng muốn áp dụng một file mẫu cụ thể.
  - Khối thẻ KPI tóm tắt tài chính (Executive Summary Cards):
    - Card 1: Tổng doanh thu ([01] Phụ lục 03-1A).
    - Card 2: Lợi nhuận kế toán trước thuế ([A1] Tờ khai chính / [19] Phụ lục 03-1A).
    - Card 3: Thu nhập tính thuế ([C4]).
    - Card 4: Thuế TNDN phải nộp ([C10] hoặc [C16]).
    - Card 5: Tổng sai lệch ròng (**Net Variance = 0 VNĐ** với badge xanh lá bảo đảm).
  - Bảng đối chiếu số liệu trực quan (Reconciliation View) chia làm 3 Sub-Tabs:
    - *Sub-Tab 1 - Tờ khai chính 03/TNDN:* Hiển thị cây chỉ tiêu [A1]..[G2], cột Cũ, Mới, Lệch và Trạng thái khớp.
    - *Sub-Tab 2 - Phụ lục 03-1A/TNDN (KQKD):* Hiển thị bảng 19 chỉ tiêu kết quả kinh doanh so sánh đối chiếu giữa 2 bản khai.
    - *Sub-Tab 3 - Phụ lục 03-2A/TNDN (Chuyển lỗ):* Hiển thị danh sách các năm chuyển lỗ và số lỗ đã chuyển / chuyển kỳ này.
  - Bộ lọc và tìm kiếm:
    - Ô tìm kiếm theo mã chỉ tiêu (ví dụ gõ "B4", "C4", "19") hoặc tên chỉ tiêu.
    - Nút lọc "Chỉ xem các chỉ tiêu có số tiền phát sinh" giúp bảng gọn gàng.
  - Xuất file XML chuẩn eTax:
    - Nút "Xuất File XML TT80 (Chuẩn eTax)": Lưu file về máy tính với tên gợi ý thông minh `03_TNDN_[Nam]_[MST]_TT80.xml`.
    - Modal thông báo thành công hiển thị hướng dẫn mở kiểm tra trên iTaxViewer hoặc nộp trực tiếp lên cổng thuế `thuedientu.gdt.gov.vn`.
- Non-functional:
  - Giao diện nhất quán với thiết kế chung của AuditSoft (Gam màu slate/indigo cao cấp, hỗ trợ Dark/Light mode, font chữ chuẩn kế toán, không giật lag khi chuyển tab).

## Architecture
```text
[AuditSoft Navigation Header] ──> Tab: "Chuyển Đổi QTT TNDN"
                                       │
                                       ▼
                       [Qtt03ConverterPage.tsx]
                       ├── [ModeToggle]: Tự động (1 file) vs Kèm mẫu (2 files)
                       ├── [Qtt03DropZone]: Tiếp nhận file XML cũ / mới
                       ├── [KpiSummaryCards]: Doanh thu, LNTT, Thuế TNDN, Variance = 0
                       │
                       ├── [ReconciliationTabs]
                       │     ├── [Tab 1]: Tờ khai chính ([A1]..[G2])
                       │     ├── [Tab 2]: Phụ lục 03-1A KQKD ([01]..[19])
                       │     └── [Tab 3]: Phụ lục 03-2A Chuyển lỗ
                       │
                       └── [Qtt03ExportSection]
                             └── Nút "Xuất XML TT80" + Modal hướng dẫn iTaxViewer
```

## Related Code Files
- Create: `src/renderer/components/EtaxConverter/Qtt03ConverterPage.tsx` (Trang chính của module)
- Create: `src/renderer/components/EtaxConverter/Qtt03DropZone.tsx` (Vùng kéo thả 1 file hoặc 2 file)
- Create: `src/renderer/components/EtaxConverter/Qtt03KpiCards.tsx` (Khối hiển thị KPI tóm tắt số liệu)
- Create: `src/renderer/components/EtaxConverter/Qtt03ReconcileTabs.tsx` (Bảng đối chiếu 3 sub-tabs)
- Create: `src/renderer/components/EtaxConverter/Qtt03ExportModal.tsx` (Hộp thoại xuất file XML)
- Modify: `src/renderer/App.tsx` (Thêm Tab vào thanh điều hướng chính)

## Implementation Steps
1. Xây dựng `Qtt03DropZone.tsx`:
   - Hỗ trợ kéo thả file XML hoặc nút bấm chọn file.
   - Kiểm tra mã tờ khai trong file có đúng là tờ khai quyết toán TNDN (`03/TNDN`) hay không.
2. Xây dựng `Qtt03KpiCards.tsx`:
   - Trích xuất nhanh các chỉ tiêu cốt lõi và hiển thị dạng Card số liệu định dạng VNĐ (`###.###.### đ`).
   - Hiển thị badge bảo chứng "Không sai lệch số liệu: 0 VNĐ" màu xanh lá.
3. Xây dựng `Qtt03ReconcileTabs.tsx`:
   - Cung cấp 3 tab: Tờ khai chính, Phụ lục 03-1A, Phụ lục 03-2A.
   - Thêm bộ lọc "Chỉ xem chỉ tiêu có số tiền".
4. Xây dựng `Qtt03ExportModal.tsx`:
   - Kích hoạt lưu file XML UTF-8 không BOM thông qua Electron save dialog hoặc trình duyệt download.
5. Gắn vào `src/renderer/App.tsx`:
   - Thêm nút chuyển tab trên thanh Header cạnh các chức năng hiện tại.

## Success Criteria
- [x] Kéo thả file XML 03/TNDN cũ vào, trong vòng 0.5s hiển thị toàn bộ KPI và bảng đối chiếu 3 tab.
- [x] Giao diện trực quan, rõ ràng, giúp kế toán đối chiếu từng chỉ tiêu tờ khai chính và phụ lục trong vài giây.
- [x] Thao tác bấm nút xuất XML sinh ra đúng file `.xml` trên máy tính với định dạng UTF-8 No BOM.

## Risk Assessment
- **Rủi ro:** Một số file tờ khai cũ có kích thước lớn do có nhiều phụ lục.
- **Biện pháp:** Giao diện tối ưu hóa render (virtualization / lightweight rows) để bảng cuộn mượt mà ngay cả khi có hàng trăm chỉ tiêu.
