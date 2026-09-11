---
title: "Hoàn Thiện Bộ Giấy Làm Việc Hàng Tồn Kho (D500): Sửa Cut-off D595, Tự Động Hóa D553 & Bút Toán AJE D541"
description: "Khắc phục triệt để lỗi chọn nhầm bút toán kết chuyển KC vào bảng Cut-off D595; xây dựng cơ chế tự động đổ số liệu phát sinh 12 tháng vào sheet D553 (Đối chiếu XNT); và kết nối dữ liệu Nguồn ② để tự động tính Cột 5 (Điều chỉnh AJE) trên Leadsheet D 510 cùng bảng bút toán điều chỉnh D541."
status: in_progress
priority: P1
effort: "2h"
tags: ["working-paper", "d500-inventory", "d595-cutoff", "d553-reconciliation", "d541-aje", "vsa-500"]
created: 2026-09-11
---

# Kế Hoạch: Hoàn Thiện Bộ Giấy Làm Việc Hàng Tồn Kho (D500)

## 1. Bối Cảnh & Vấn Đề Nghiệp Vụ
1. **Lỗi Cut-off `D595` lấy nhầm bút toán kết chuyển:**
   - Bộ lọc hiện tại lấy các bút toán có số tiền lớn nhất liên quan đến TK 15x, dẫn đến việc lấy các bút toán kết chuyển giá thành (`154/62x`), giá vốn (`632/155`) và nhập kho thành phẩm (`155/154`) ngày 31/12 với số chứng từ `KC`.
   - Trong kiểm toán VSA 500, thủ tục chia cắt niên độ phải lấy các **phiếu nhập kho mua hàng từ nhà cung cấp** (`Nợ 152, 156 / Có 331, 111, 112`) và **phiếu xuất kho thực tế** (`Có 152, 155, 156 / Nợ 621, 627, 641, 632`) phát sinh sát ngày 31/12 nhất.
2. **Sheet `D553` bị bỏ trống (toàn số 0):**
   - Sheet `D553` ("Đối chiếu giá trị ghi sổ mua hàng với nhập kho trên bảng XNT") có sẵn công thức tại Cột B và G link sang Cột K (`NỢ`) và L (`CÓ`) của bảng Pivot bên phải.
   - Do Cột K và L đang để trống nên Cột B và G bằng 0. Cần đổ tự động số phát sinh 12 tháng vào Cột K & L cho cả NVL (152) và Thành phẩm (155).
3. **Leadsheet `D 510` không nhận diện số Sau điều chỉnh & Sheet `D541` để trống:**
   - Khi KTV đã nạp/paste Nguồn ② (Sau điều chỉnh) ở Bước 1, dữ liệu chênh lệch `diffRows` chưa được truyền vào `generateWorkingPapers`.
   - `D500_InventoryFiller.ts` chưa có code điền sheet `D541` và chưa tính số điều chỉnh thuần vào Cột 5 của `D 510`.

---

## 2. Thiết Kế Kỹ Thuật

```mermaid
flowchart TD
    subgraph Input [Dữ Liệu Đầu Vào]
        NKC[Sổ NKC Cả Năm]
        AJE[Bút toán AJE từ DiffRow Nguồn 1 vs Nguồn 2]
    end

    subgraph Fillers [D500_InventoryFiller - Direct OpenXML]
        NKC -->|Lọc PNK/PXK sát 31/12| F1[Sheet D595: Cut-off Nhập/Xuất kho]
        NKC -->|Phát sinh Nợ/Có 152 & 155 theo 12 tháng| F2[Sheet D553: Đối chiếu XNT]
        AJE -->|Bút toán điều chỉnh TK 15x| F3[Sheet D541: Bút toán AJE HTK]
        AJE -->|Tính điều chỉnh thuần theo từng TK 151..156| F4[Sheet D510: Leadsheet Cột 5 & 6]
    end

    subgraph Output [File Excel Hoàn Chỉnh]
        F1 & F2 & F3 & F4 --> OUT[D500 - HTK - [Client] [Year].xlsx]
    end
```

---

## 3. Các Giai Đoạn Triển Khai

| Phase | Trọng Tâm | Files Tác Động |
|---|---|---|
| **Phase 1** | Sửa `D595`: loại bỏ `KC`, lọc đúng phiếu nhập kho/xuất kho sát 31/12 | `src/domain/workingpaper/fillers/D500_InventoryFiller.ts` |
| **Phase 2** | Điền `D553`: phát sinh 12 tháng Nợ/Có 152 & 155 vào Cột K & L | `src/domain/workingpaper/fillers/D500_InventoryFiller.ts` |
| **Phase 3** | Kết nối AJE từ Nguồn ②: điền `D541` và Cột 5/6 trên Leadsheet `D 510` | `src/domain/workingpaper/fillers/D500_InventoryFiller.ts`<br>`src/domain/workingpaper/WorkingPaperGenerator.ts`<br>`src/renderer/pages/WorkingPaperPage.tsx`<br>`src/shared/ipc.ts`<br>`src/main/index.ts` |
| **Phase 4** | Kiểm thử tự động mở file bằng Microsoft Excel COM & Vitest | `scripts/test-d500-enhanced-com.ts`<br>`tests/workingpaper.test.ts` |
