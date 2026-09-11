---
phase: 1
title: "AJE Derivation Engine"
status: in_progress
effort: "1.5h"
files:
  - src/domain/workingpaper/AjeDerivationEngine.ts
  - src/domain/workingpaper/types.ts
---

# Phase 1: AJE Derivation Engine

## Mục tiêu
Xây dựng engine chuyển đổi thông minh từ danh sách các dòng chênh lệch đối chiếu (`DiffRow[]`) thành các bút toán điều chỉnh kiểm toán (`AdjustingEntry[]`) chuẩn mực theo chuẩn mực kiểm toán Việt Nam (VSA 450 và VSA 500).

## Chi tiết công việc
1. Tạo file `src/domain/workingpaper/AjeDerivationEngine.ts`:
   - Hàm `resolveGlvRefForAccounts(tkNo: string, tkCo: string): string`:
     * TK 111, 112 ➔ `D141` (Điều chỉnh tiền)
     * TK 131, 2293 ➔ `D341` (Điều chỉnh công nợ phải thu)
     * TK 152, 153, 155, 156, 157, 2294 ➔ `D541` (Điều chỉnh hàng tồn kho)
     * TK 211, 214 ➔ `D741` (Điều chỉnh tài sản cố định)
     * TK 242 ➔ `D641` (Điều chỉnh chi phí trả trước)
     * TK 341 ➔ `E141` (Điều chỉnh vay)
     * TK 331 ➔ `E241` (Điều chỉnh công nợ phải trả)
     * TK 333, 133 ➔ `E341` (Điều chỉnh thuế)
     * TK 334, 338 ➔ `E441` (Điều chỉnh lương & bảo hiểm)
     * TK 411, 421 ➔ `F141` (Điều chỉnh vốn chủ sở hữu)
     * TK 511, 515, 711 ➔ `G141` (Điều chỉnh doanh thu)
     * TK 632, 641, 642, 811 ➔ `G241` (Điều chỉnh chi phí)
     * Fallback ➔ `B140` (Bút toán tổng hợp khác)
   - Hàm `deriveAdjustingEntriesFromDiffRows`:
     * Xử lý `ADDED_AFTER`: Doanh nghiệp ghi thêm sau ĐC ➔ Bút toán điều chỉnh giữ nguyên chiều Nợ/Có, số tiền = chênh lệch dương.
     * Xử lý `REMOVED_AFTER`: Doanh nghiệp hủy bỏ sau ĐC ➔ Bút toán điều chỉnh đảo chiều hạch toán (Nợ thành Có, Có thành Nợ) với số tiền ban đầu.
     * Xử lý `AMOUNT_CHANGED`: Nếu số tiền sau lớn hơn số tiền trước ➔ Điều chỉnh tăng (giữ nguyên chiều). Nếu số tiền sau nhỏ hơn ➔ Điều chỉnh giảm (đảo chiều).
2. Viết hàm lọc ngưỡng trọng yếu (Materiality Gate):
   - Loại bỏ các chênh lệch làm tròn nhỏ hơn ngưỡng sai sót có thể bỏ qua (De Minimis / CTT) nếu có cấu hình.
