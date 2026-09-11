---
id: "phase-02"
name: "Xây dựng fillAjeSheet trong OpenXmlPackageEditor và đổ AJE vào D341, E241, E341, E441"
plan: "plans/260911-1045-wp-counterparts-and-all-ajes/plan.md"
status: "pending"
priority: "P1"
effort: "45m"
files:
  - "src/domain/workingpaper/openxml/OpenXmlPackageEditor.ts"
  - "src/domain/workingpaper/fillers/D300_ReceivableFiller.ts"
  - "src/domain/workingpaper/fillers/E200_PayableFiller.ts"
  - "src/domain/workingpaper/fillers/E300_TaxFiller.ts"
  - "src/domain/workingpaper/fillers/E400_PayrollFiller.ts"
  - "src/domain/workingpaper/types.ts"
---

# Pha 2: Xây Dựng `fillAjeSheet` Trong OpenXmlPackageEditor & Đổ AJE Vào D341, E241, E341, E441

## 1. Mục Tiêu
Cung cấp giải pháp chuẩn hóa để tự động điền các bút toán điều chỉnh kiểm toán (AJE - Audit Adjustment Entries) vào các sheet `x41` của từng phần hành:
- `D 341` trong file `D300` (Phải thu - TK 131, 2293).
- `E241` trong file `E200` (Phải trả - TK 331, 338, 352).
- `E 341` trong file `E300` (Thuế - TK 133, 333).
- `E 441` trong file `E400` (Lương & các khoản trích theo lương - TK 334, 338).

Khi không có bút toán điều chỉnh (thực tế đa số cuộc kiểm toán sơ bộ hoặc doanh nghiệp chuẩn chỉ), sheet phải ghi nhận dòng chữ `"Không phát sinh."` tại đúng vị trí quy định của hồ sơ mẫu VACPA để tránh để trống giấy tờ làm việc.

## 2. Thiết Kế Phương Thức Dùng Chung: `OpenXmlPackageEditor.fillAjeSheet`

### 2.1. Cấu Trúc Dữ Liệu AJE
Bổ sung interface `AuditAdjustmentEntry` trong `src/domain/workingpaper/types.ts`:
```typescript
export interface AuditAdjustmentEntry {
  stt: number
  ref: string // Ký hiệu W/P, ví dụ: 'D351.1', 'E250.1'
  description: string // Diễn giải lý do điều chỉnh
  debitAccount: string // TK Nợ (vd: '131', '642')
  creditAccount: string // TK Có (vd: '511', '331')
  amount: number // Số tiền phát sinh
  cdktTarget?: string // Chỉ tiêu Bảng CĐKT ảnh hưởng
  tsTang?: number // Tài sản tăng
  tsGiam?: number // Tài sản giảm
  nvTang?: number // Nguồn vốn tăng
  nvGiam?: number // Nguồn vốn giảm
  kqkdTarget?: string // Chỉ tiêu KQKD ảnh hưởng
  kqkdTang?: number
  kqkdGiam?: number
}
```

### 2.2. Đặc Tả Tọa Độ Điền Trên Các Sheet `x41`
- Dòng thông tin người thực hiện: Dòng 13 (`C13: Người thực hiện: <Tên KTV>`).
- Vị trí bắt đầu bảng số liệu: Dòng 15 trở đi.
  - Cột A: STT (`1, 2, 3...`)
  - Cột B: Giấy LV / W/P Ref
  - Cột C: NỘI DUNG / Diễn giải
  - Cột D: TK NỢ
  - Cột E: TK CÓ
  - Cột F: SỐ PS (Số tiền điều chỉnh)
  - Cột G: Chỉ tiêu CĐKT
  - Cột H: Tài sản Tăng
  - Cột I: Tài sản Giảm
  - Cột J: Nguồn vốn Tăng
  - Cột K: Nguồn vốn Giảm
  - Cột L: Chỉ tiêu KQKD
  - Cột M: KQKD Tăng
  - Cột N: KQKD Giảm
- Trường hợp danh sách AJE rỗng:
  - Ghi `"Không phát sinh."` vào ô `C15`.
  - Các ô số tiền gán `0` hoặc để trống sạch sẽ.

## 3. Các Bước Triển Khai

1. **Bổ sung kiểu và trích xuất AJE từ Context:**
   - Trong `WorkingPaperFillContext`, bổ sung thuộc tính tùy chọn:
     ```typescript
     adjustments?: AuditAdjustmentEntry[]
     ```
   - Lọc AJE cho từng phần hành theo mã tài khoản (`debitAccount` hoặc `creditAccount`).

2. **Cập nhật `OpenXmlPackageEditor`:**
   - Thêm phương thức `fillAjeSheet(sheetName: string, entries: AuditAdjustmentEntry[], auditorName: string): number`.
   - Đảm bảo ghi trực tiếp XML bảo tồn toàn bộ style, border, format số tiền `#,##0` và không làm vỡ các dòng merge.

3. **Tích hợp vào 4 bộ Filler:**
   - `D300_ReceivableFiller.ts`: Gọi `editor.fillAjeSheet('D 341', ajeList, ctx.engagement.auditorName)`.
   - `E200_PayableFiller.ts`: Gọi `editor.fillAjeSheet('E241', ajeList, ctx.engagement.auditorName)`.
   - `E300_TaxFiller.ts`: Gọi `editor.fillAjeSheet('E 341', ajeList, ctx.engagement.auditorName)`.
   - `E400_PayrollFiller.ts`: Gọi `editor.fillAjeSheet('E 441', ajeList, ctx.engagement.auditorName)`.

## 4. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] Khi có AJE, các sheet `D341`, `E241`, `E341`, `E441` hiển thị đầy đủ chi tiết bút toán, tài khoản Nợ/Có, số tiền và W/P Ref.
- [ ] Khi không có AJE, các sheet ghi rõ `"Không phát sinh."` tại ô `C15`, người thực hiện tại `C13`.
- [ ] Toàn bộ 4 file `D300`, `E200`, `E300`, `E400` mở trên Microsoft Excel không có lỗi repair.
