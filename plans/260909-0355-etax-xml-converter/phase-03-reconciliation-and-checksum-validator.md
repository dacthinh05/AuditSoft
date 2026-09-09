---
phase: 3
title: "Financial Integrity & Appendix Variance Reconciler"
status: pending
priority: P1
effort: "4h"
dependencies: [2]
---

# Phase 3: Financial Integrity & Appendix Variance Reconciler

## Overview
Xây dựng bộ kiểm soát đối chiếu và xác thực tính toán vẹn số liệu (Financial Integrity Gate) chuyên sâu cho tờ khai Quyết toán thuế TNDN (`03/TNDN`). Module thực hiện đối chiếu chéo số liệu giữa file Cũ (nguồn) và file Mới (sau chuyển đổi) trên cả **Tờ khai chính** và **Từng phụ lục liên quan** (`03-1A`, `03-2A`), tính toán độ lệch từng dòng số liệu (Variance = 0 VNĐ) và xác thực các mối quan hệ liên kết nghiệp vụ bắt buộc giữa tờ khai chính và phụ lục.

## Requirements
- Functional:
  - Kiểm tra đối chiếu Tờ khai chính 03/TNDN:
    - Đảm bảo 100% các chỉ tiêu tài chính [A1], [B1]–[B14], [C1]–[C16], [D1]–[D8], [E1]–[E4], [G1]–[G2] có số tiền ở tờ khai cũ đều được chuyển sang tờ khai mới với `Variance === 0 VNĐ`.
  - Kiểm tra đối chiếu Phụ lục 03-1A/TNDN:
    - Đối chiếu toàn bộ 19 chỉ tiêu kết quả kinh doanh [01]..[19] giữa 2 phiên bản.
    - Kiểm tra mối quan hệ liên kết sống còn: Lợi nhuận trước thuế trên phụ lục 03-1A (chỉ tiêu [19]) bắt buộc phải bằng đúng chỉ tiêu [A1] trên tờ khai chính.
  - Kiểm tra đối chiếu Phụ lục 03-2A/TNDN:
    - Đối chiếu tổng số lỗ chuyển trong kỳ giữa bảng chuyển lỗ và chỉ tiêu chuyển lỗ trên tờ khai chính (chỉ tiêu [C3a]).
  - Kiểm tra tính nhất quán toán học (Mathematical Consistency Checks):
    - Đẳng thức điều chỉnh lợi nhuận: Tổng điều chỉnh tăng [B1] = [B2] + ... + [B7]; Tổng điều chỉnh giảm [B8] = [B9] + ... + [B14].
    - Đẳng thức xác định thuế: Thu nhập tính thuế [C4] = Thu nhập chịu thuế [C1] - Thu nhập miễn thuế [C2] - Chuyển lỗ [C3]; Thuế TNDN phát sinh [C10] = Thu nhập tính thuế * Thuế suất.
  - Tạo cấu trúc báo cáo đối chiếu đa bảng (Multi-Table Reconciliation Report):
    - `mainFormDiff`: Danh sách chỉ tiêu tờ khai chính (Cũ, Mới, Lệch, Trạng thái).
    - `pl03_1aDiff`: Danh sách 19 chỉ tiêu kết quả kinh doanh.
    - `pl03_2aDiff`: Danh sách dòng chuyển lỗ.
    - `crossChecks`: Kết quả kiểm tra chéo giữa Tờ khai chính và Phụ lục.
    - `isAllPassed`: boolean (true khi toàn bộ variance = 0 và mọi đẳng thức đều đúng).
- Non-functional:
  - Thời gian đối chiếu toàn bộ tờ khai chính và các phụ lục dưới 80ms.

## Architecture
```text
[Old Qtt03 Document]         [Migrated Qtt03 Document]
         │                               │
         └───────────────┬───────────────┘
                         ▼
             [Qtt03Validator Engine]
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
[Main Form Diff]   [PL 03-1A Diff]  [PL 03-2A Diff]
 Variance = 0       Variance = 0     Variance = 0
        │                │                │
        └────────────────┼────────────────┘
                         ▼
              [Cross-Table Validation]
                ├── [A1] === PL 03-1A [19]
                └── [C3a] === PL 03-2A Tổng lỗ chuyển
                         │
                         ▼
              [Qtt03ReconcileSummary]
```

## Related Code Files
- Create: `src/domain/etax/Qtt03Validator.ts` (Lớp kiểm tra tính toán vẹn và đối chiếu đa bảng)
- Create: `tests/qtt03-validator.test.ts` (Unit test cho toàn bộ logic đối chiếu và công thức toán học)

## Implementation Steps
1. Định nghĩa cấu trúc `Qtt03ReconcileSummary`:
   - `summary`: Tổng doanh thu, Tổng chi phí, Lợi nhuận trước thuế, Thuế TNDN phải nộp, Tổng chênh lệch ròng (`netVariance = 0`).
   - `mainFormItems`: Array `{ code, name, oldValue, newValue, variance, status }`.
   - `pl03_1aItems`: Array `{ code, name, oldValue, newValue, variance, status }`.
   - `pl03_2aItems`: Array `{ namPS, soLoPSOld, soLoPSNew, soLoChuyenOld, soLoChuyenNew, variance }`.
   - `invariants`: Danh sách kết quả kiểm tra công thức và liên kết chéo.
2. Cài đặt `Qtt03Validator.ts`:
   - Hàm `validate(oldDoc: Qtt03Document, newDoc: Qtt03Document): Qtt03ReconcileSummary`.
   - Thuật toán so khớp từng chỉ tiêu và tính chênh lệch.
   - Kiểm tra tính tương đương [A1] == [19].
3. Viết unit test trong `tests/qtt03-validator.test.ts`:
   - Test trường hợp chuyển đổi chuẩn: toàn bộ variance = 0, `isAllPassed = true`.
   - Test trường hợp cố tình tạo sai lệch số liệu: validator bắt đúng chỉ tiêu bị lệch và đánh dấu cảnh báo đỏ.
   - Test trường hợp lệch giữa [A1] và phụ lục 03-1A: validator phát hiện ngay lập tức.

## Success Criteria
- [x] Báo cáo chênh lệch phản ánh chính xác từng đồng số liệu giữa tờ khai cũ và mới trên cả tờ khai chính và các phụ lục.
- [x] Đảm bảo 100% mối liên kết giữa chỉ tiêu [A1] và phụ lục 03-1A được kiểm tra chặt chẽ.
- [x] Cung cấp dữ liệu chi tiết, phân nhóm rõ ràng để UI hiển thị dạng tab/accordion.

## Risk Assessment
- **Rủi ro:** Ở một số năm cũ, doanh nghiệp có thể có sai lệch sẵn giữa tờ khai chính và phụ lục kết quả kinh doanh do lỗi gõ tay của kế toán.
- **Biện pháp:** Validator cảnh báo rõ nguồn gốc của sai lệch (là sai lệch sẵn có từ file cũ hay phát sinh trong quá trình convert), giúp kế toán chủ động rà soát.
