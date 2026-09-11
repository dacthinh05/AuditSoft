---
title: "Sửa Chuẩn Logic Đối Chiếu Thuế GTGT/TNCN & Hoàn Thiện Biểu Mẫu Kiểm Toán E380, G150"
date: "2026-09-10"
status: "completed"
mode: "standard"
tags:
  - tax
  - reconciliation
  - vsa520
  - working-papers
  - e380
  - g100
  - pit
  - vat
---

# Kế Hoạch Triển Khai: Sửa Chuẩn Logic Đối Chiếu Thuế & Mẫu Giấy Làm Việc E380, G150

## 1. Bối cảnh & Mục tiêu (Outcome)

Qua kiểm tra đối chiếu thực tế dữ liệu của người dùng, phát hiện 3 vấn đề nghiệp vụ kế toán - kiểm toán nghiêm trọng cần được chuẩn hóa:

1. **Lỗi Logic Đối Chiếu Thuế TNCN (Bảng TNCN)**:
   - Hiện tại: Code lấy `Nợ 334` (bút toán chi trả/thanh toán lương) đem so với `[21]` (Tổng TNCT trên tờ khai 05) $\rightarrow$ số liệu bị sai lệch âm hàng tỷ đồng mỗi tháng.
   - Chuẩn nghiệp vụ: 
     * Quỹ lương tính vào chi phí phải lấy **`Ghi CÓ TK 334`** (đối ứng Nợ 641, 642, 622, 154).
     * Thuế TNCN đã khấu trừ `[29]` phải đối chiếu với **`Phát sinh CÓ TK 3335`** (đặc biệt là bút toán khấu trừ lương `Nợ 334 / Có 3335`).

2. **Bảng Thống Kê Thuế GTGT chưa đúng mẫu kiểm toán chuẩn E380 (Ảnh 2)**:
   - Hiện tại: Bảng 11 cột đơn điệu, gộp chung số liệu thuế và sổ sách.
   - Chuẩn nghiệp vụ Mẫu E380 (B.1): Phải chia làm **2 KHỐI SONG SONG**:
     * Khối 1 (Kê khai thuế GTGT): Tháng, VAT đầu vào [25], VAT đầu ra [35], Điều chỉnh Giảm [37], Tăng [38], Xin hoàn [42], Phải nộp [40], Số dư [43].
     * Khối 2 (Sổ kế toán): PS Nợ 133*, Chênh lệch đầu vào, PS Có 33311, Chênh lệch đầu ra, PS Nợ 33311 (nộp thuế).

3. **Lỗi `#DIV/0!` và điền sai cột trên Giấy làm việc Doanh thu G100 (Sheet `G 150` - Ảnh 3)**:
   - Hiện tại: `G100_RevenueFiller` ghi đè tổng doanh thu NKC vào cột B (thuế suất 0%) và cột G (Có 511), bỏ trống cột C (5%) và D (10%), làm hỏng công thức tổng và công thức tỷ lệ dòng 28-29 dẫn tới lỗi `#DIV/0!`.
   - Chuẩn nghiệp vụ:
     * Khối Tờ khai thuế GTGT: Điền đúng B (0%), C (5%), D (10%), bảo toàn công thức cột E `=SUM(B:D)`.
     * Khối Sổ kế toán: Điền đúng G (Có 511), H (Nợ 521), I (Có 711), J (Có 3387), bảo toàn công thức chênh lệch cột K `=+E-G-I-J+H`.

---

## 2. Ràng buộc & Tiêu chí nghiệm thu (Constraints & Acceptance Criteria)

### Constraints:
- Không làm gãy các test case hiện có của hệ thống.
- Sử dụng `Money` / `bigint` an toàn, không gây sai lệch số học.
- Đảm bảo tương thích khi người dùng chưa nạp tờ khai thuế (hiển thị graceful fallback thay vì crash).

### Acceptance Criteria:
1. `TaxCrossReconciler.ts`:
   - Bóc tách `Có 334` cho chi phí lương và `Có 3335` (cùng `Nợ 334 / Có 3335`) cho thuế TNCN khấu trừ.
   - So sánh chuẩn: `[21]` vs `Có 334`, và `[29]` vs `Có 3335`.
2. UI `TaxAnalyticsTab.tsx` & `TaxReconExporter.ts`:
   - Hiển thị đầy đủ 2 khối song song theo mẫu E380 (Ảnh 2).
   - Xuất Excel bảng đối chiếu thuế GTGT theo đúng 2 khối chuẩn mực.
3. `G100_RevenueFiller.ts`:
   - Sheet `G 150` được điền đúng cả 2 khối Thuế (B, C, D) và Sổ sách (G, H, I, J).
   - Giữ nguyên công thức tại cột E, K và dòng 28-29, triệt tiêu 100% lỗi `#DIV/0!`.
4. 100% test suite, typecheck, linting và build production đều pass.

---

## 3. Các giai đoạn thực hiện (Phased Execution)

* **Phase 1: Chuẩn hóa Logic Đối Chiếu Thuế TNCN & GTGT (`TaxCrossReconciler.ts`)**
* **Phase 2: Thiết kế lại UI Bảng Thuế & Exporter theo Mẫu E380 (`TaxAnalyticsTab.tsx`, `TaxReconExporter.ts`)**
* **Phase 3: Sửa chuẩn Filler Giấy làm việc Doanh thu G100 (`G100_RevenueFiller.ts`)**
* **Phase 4: Kiểm thử, Tự động hóa & Xác nhận (Testing & Verification)**
