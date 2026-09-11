# Phase 2: Triển khai logic điền D 341 (AJE) và D 390 (Đối ứng TK 131 & REF)

## Mục tiêu
1. **Sheet `D 341` (Bút toán điều chỉnh AJE)**:
   - Lọc các bút toán từ `ctx.adjustingEntries` có `tkNo.startsWith('131')` hoặc `tkCo.startsWith('131')`.
   - Bắt đầu từ hàng 14:
     - Cột A (1): STT (1, 2, ...)
     - Cột B (2): Giấy LV Ref (ví dụ `D341.1`)
     - Cột C (3): Nội dung bút toán điều chỉnh
     - Cột D (4): TK Nợ
     - Cột E (5): TK Có
     - Cột F (6): Số tiền phát sinh
     - Cột G (7): Chỉ tiêu CĐKT "Phải thu khách hàng"
   - Nếu không có bút toán nào: điền dòng 14 với nội dung "Không phát sinh bút toán điều chỉnh".
2. **Sheet `D 390` (Phân tích đối ứng TK 131 & Tham chiếu REF)**:
   - Quét NKC:
     - Nợ 131 / Có 511 (Doanh thu) $\rightarrow$ Cột C16, Ref A16 = `G 100`
     - Nợ 131 / Có 33311 (Thuế GTGT) $\rightarrow$ Cột C17, Ref A17 = `E 300`
     - Nợ 131 / Có Khác $\rightarrow$ Cột C18, Ref A18 = `Khác`
     - Nợ 111 / Có 131 (Thu tiền mặt) $\rightarrow$ Cột G16, Ref E16 = `D 100`
     - Nợ 112 / Có 131 (Thu TGNH) $\rightarrow$ Cột G17, Ref E17 = `D 100`
     - Nợ Khác / Có 131 $\rightarrow$ Cột G18, Ref E18 = `Khác`
   - Bảo toàn tuyệt đối hàng 23 công thức `SUM`.

## File tác động
- `src/domain/workingpaper/fillers/D300_ReceivableFiller.ts`
