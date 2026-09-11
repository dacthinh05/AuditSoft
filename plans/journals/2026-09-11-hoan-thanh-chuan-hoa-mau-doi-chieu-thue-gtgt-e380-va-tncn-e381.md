# Nhật Ký: Hoàn Thành Chuẩn Hóa 2 Mẫu Đối Chiếu Thuế GTGT (Mẫu E380) & TNCN (Mẫu E381)

**Ngày thực hiện:** 2026-09-11  
**Mục tiêu:** Loại bỏ hoàn toàn việc đối chiếu quỹ lương 334 ra khỏi bảng thuế TNCN; tái cấu trúc chuẩn 100% theo 2 mẫu thực tế kiểm toán: Mẫu E380 (Ảnh 2) và Mẫu E381 (Ảnh 3).

## Tóm Tắt Các Thay Đổi Đã Thực Hiện

1. **Chuẩn hóa Bảng Thuế TNCN (Mẫu E381 - Ảnh 3)**:
   - Loại bỏ các cột không thuộc bảng thuế TNCN: Quỹ lương Có 334, CL Quỹ Lương, Số LĐ [16], Tổng TNCT [21].
   - Tái cấu trúc theo đúng 8 cột chuẩn của Mẫu E381:
     - `T (Kỳ khai)`: Dòng `Đk`, các tháng/quý `1..12`, dòng `TỔNG CỘNG (TC)`.
     - Nhóm `TỜ KHAI (05/KK-TNCN)`: Khấu trừ cư trú, Khấu trừ không cư trú, Tổng khấu trừ (1).
     - Nhóm `SỔ SÁCH`: Thuế TNCN khấu trừ (2) [Có 3335].
     - `Chênh lệch (1)-(2)`.
     - `Đã nộp (Nợ 3335)`: Thuế TNCN đã nộp vào NSNN.
     - `Còn phải nộp`: Lũy kế số dư Có 3335 (Dư đầu kỳ + Khấu trừ Có 3335 - Đã nộp Nợ 3335).

2. **Chuẩn hóa Bảng Thuế GTGT (Mẫu E380 - Ảnh 2)**:
   - Sắp xếp lại thứ tự cột điều chỉnh: `Đ/c Tăng [38]` trước, `Đ/c Giảm [37]` sau.
   - Giữ nguyên các cột đối chiếu trực tiếp với Sổ kế toán: `PS Nợ 133*`, `CL`, `PS Có 33311`, `CL`, `Đã nộp`.

3. **Engine & Parser (`TaxCrossReconciler.ts` & `PitXmlParser.ts`)**:
   - `PitXmlParser`: Tự động bóc tách chỉ tiêu khấu trừ cá nhân cư trú và không cư trú từ tờ khai 05/KK-TNCN.
   - `TaxCrossReconciler`: Bóc tách phát sinh Nợ TK 3335 (Đã nộp), tính lũy kế nghĩa vụ thuế TNCN `closingRemainingPayable`, giữ alias trường cũ cho tương thích ngược.

4. **Xuất Excel & Điền Giấy Làm Việc (`TaxReconExporter.ts` & `E300_TaxFiller.ts`)**:
   - `TaxReconExporter`: Xuất 2 sheet `E380_GTGT` và `E381_TNCN` chuẩn bảng biểu kiểm toán.
   - `E300_TaxFiller`: Tự động điền dữ liệu tờ khai thuế TNCN và phát sinh Nợ/Có TK 3335 vào Sheet `E 381` trong bộ Giấy làm việc `E300 - Thue`.
   - `WorkingPaperPage.tsx`: Truyền dữ liệu tờ khai thuế GTGT và TNCN vào pipeline sinh file GLV.

5. **Kết quả kiểm thử**:
   - `npm run typecheck`: Exit code 0 (100% Clean).
   - `npx vitest run`: 86/86 test files passed, 393/393 tests passed.
