---
id: "phase-01"
name: "Sửa triệt để hàm cốt lõi fillSampleRow và định dạng ngày/tiền tệ"
plan: "plans/260911-1120-fix-sample-column-mapping-and-d692-d792-matrix/plan.md"
status: "pending"
priority: "P1"
effort: "30m"
files:
  - "src/domain/workingpaper/openxml/OpenXmlPackageEditor.ts"
  - "src/domain/workingpaper/fillers/D600_PrepaidFiller.ts"
  - "src/domain/workingpaper/fillers/D300_ReceivableFiller.ts"
  - "src/domain/workingpaper/fillers/E200_PayableFiller.ts"
  - "src/domain/workingpaper/fillers/D100_CashFiller.ts"
  - "src/domain/workingpaper/fillers/E400_PayrollFiller.ts"
---

# Pha 1: Sửa Triệt Để Hàm Cốt Lõi `fillSampleRow` & Định Dạng Cột

## 1. Bối Cảnh & Nguyên Nhân Gốc Rễ
Trên các sheet kiểm tra chọn mẫu chứng từ phát sinh (như `D 690`, `D 391`, `E 291`, `D 195TM`, `D 195TGNH`, `D595`...):
- Cấu trúc cột chuẩn mực VACPA:
  - Cột 1 (`offset`): `Ngày`
  - Cột 2 (`offset + 1`): `Số CT` / `Chứng từ`
  - Cột 3 (`offset + 2`): `Nội dung` / `Diễn giải`
  - Cột 4 (`offset + 3`): `TK NỢ`
  - Cột 5 (`offset + 4`): `TK CÓ`
  - Cột 6 (`offset + 5`): `SỐ TIỀN` / `Số PS`
- **Lỗi hiện tại trong `OpenXmlPackageEditor.fillSampleRow`:**
  - Cột 4 đang điền `item.amount` $\rightarrow$ Nhảy số tiền vào cột `TK NỢ`.
  - Cột 5 đang điền `item.debit` $\rightarrow$ Nhảy TK Nợ vào cột `TK CÓ`.
  - Cột 6 đang điền `item.credit` $\rightarrow$ Nhảy TK Có vào cột `Số PS`.
  - Cột Ngày tháng bị cắt cụt ký tự năm (`29/04/202`) do độ rộng cột A hẹp khi lưu dạng inline text.

## 2. Giải Pháp Kỹ Thuật

1. **Sửa thứ tự cột trong `fillSampleRow`:**
   ```typescript
   public fillSampleRow(
     sheetName: string,
     rowNum: number,
     item: {
       date?: unknown
       docNo?: string
       desc?: string
       amount?: number
       debit?: string
       credit?: string
       colOffset?: number
     },
   ): void {
     const offset = item.colOffset ?? 1
     if (item.date !== undefined) {
       this.updateCell(sheetName, `${indexToColLetter(offset)}${rowNum}`, { date: item.date })
     }
     if (item.docNo !== undefined) {
       this.updateCell(sheetName, `${indexToColLetter(offset + 1)}${rowNum}`, { text: item.docNo })
     }
     if (item.desc !== undefined) {
       this.updateCell(sheetName, `${indexToColLetter(offset + 2)}${rowNum}`, { text: item.desc })
     }
     // ĐÚNG CHUẨN: Cột 4 là TK Nợ, Cột 5 là TK Có, Cột 6 là Số tiền
     if (item.debit !== undefined) {
       this.updateCell(sheetName, `${indexToColLetter(offset + 3)}${rowNum}`, { text: item.debit })
     }
     if (item.credit !== undefined) {
       this.updateCell(sheetName, `${indexToColLetter(offset + 4)}${rowNum}`, { text: item.credit })
     }
     if (item.amount !== undefined) {
       this.updateCell(sheetName, `${indexToColLetter(offset + 5)}${rowNum}`, { number: item.amount })
     }
   }
   ```

2. **Đảm bảo độ rộng cột Ngày tháng (Cột A):**
   - Bổ sung helper `ensureColumnWidth(sheetName: string, colIndex: number, minWidth: number)` trong `OpenXmlPackageEditor.ts` để bảo đảm Cột A có độ rộng tối thiểu `12.5` ký tự, không bao giờ bị cắt cụt ngày tháng trên bất kỳ màn hình nào.

3. **Cập nhật các điểm gọi `fillSampleRow`:**
   - Rà soát các bộ filler (`D600_PrepaidFiller.ts`, `D300_ReceivableFiller.ts`, `E200_PayableFiller.ts`, `D100_CashFiller.ts`, `D500_InventoryFiller.ts`, `D700_FixedAssetFiller.ts`, `E400_PayrollFiller.ts`) để đảm bảo không bị ghi đè cột `Chk` hay các cột tỷ giá phía sau.

## 3. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] Sheet `D 690` (Rows 32-40):
  - Cột D hiển thị đúng TK Nợ (`2422`, `2423`...).
  - Cột E hiển thị đúng TK Có (`331104`, `2414`...).
  - Cột F hiển thị đúng Số tiền với định dạng tiền tệ có dấu phẩy (`8,323,425,000`).
  - Cột A hiển thị đầy đủ ngày tháng `dd/mm/yyyy` (ví dụ `29/04/2024`).
- [ ] Tất cả các sheet chọn mẫu khác (`D 391`, `E 291`, `D 195TM`, `D 195TGNH`) đều khớp đúng 100% cột.
