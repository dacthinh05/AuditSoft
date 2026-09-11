# Phase 02: Tích Hợp Vào Các File GLV Trọng Tâm

## Mục tiêu
Đưa các câu kết luận và tickmarks vào chân các sheet kiểm toán cụ thể trong 15 file GLV khi hệ thống tự động sinh giấy làm việc.

## File tác động
- `src/domain/workingpaper/fillers/D100_CashFiller.ts`
- `src/domain/workingpaper/fillers/D300_ReceivableFiller.ts`
- `src/domain/workingpaper/fillers/D500_InventoryFiller.ts`
- `src/domain/workingpaper/fillers/E100_BorrowingFiller.ts`
- `src/domain/workingpaper/fillers/E200_PayableFiller.ts`
- `src/domain/workingpaper/fillers/G100_RevenueFiller.ts`

## Chi tiết thực hiện
- Điền kết luận Lead Schedule vào chân bảng `D 110`, `D 310`, `D 510`, `E 110`, `E 210`, `G 110`.
- Điền kết luận Cut-off và tickmarks vào chân bảng `D 195TM`, `D 195TGNH`, `D 354`, `D 595`.
- Điền kết luận chọn mẫu vào chân bảng `D 191.1`, `D 391`, `D 591`, `G 191`.
