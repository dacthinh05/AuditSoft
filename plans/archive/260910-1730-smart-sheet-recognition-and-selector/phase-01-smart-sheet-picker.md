# Phase 01: Thuật Toán Nhận Diện Thông Minh Sheet Sổ NKC (`pickBestNkcSheet`)

## Mục Tiêu
Thay thế logic chọn cứng `const first = meta.sheets[0]` trong `src/renderer/state/slices/reconcileSlice.ts` bằng thuật toán nhận diện sheet thông minh `pickBestNkcSheet`.

## Chi Tiết Công Việc

1. **Viết hàm `pickBestNkcSheet(sheets: SheetMeta[]): SheetMeta | undefined`**:
   - Bước 1: Ưu tiên sheet có tên bắt đầu bằng `NKC` (ví dụ: `NKC`, `NKC_TrcDC`, `NKCSAUDC`, `NKC-2025`...).
   - Bước 2: Ưu tiên sheet có tên chứa `NHATKYCHUNG`, `SO_NKC`, `SO_CAI` hoặc `GL`.
   - Bước 3: Ưu tiên sheet có độ khớp nhận diện TT200 (`confidence >= 70`) và có nhiều dòng nhất.
   - Bước 4: Lọc sheet có nhiều dòng dữ liệu nhất (loại bỏ các sheet chỉ có 1-5 dòng như trang bìa).
   - Fallback: Sheet đầu tiên nếu không có tiêu chí nào khớp.

2. **Cập nhật hàm `setMeta` trong `reconcileSlice.ts`**:
   - Sử dụng `const selectedSheet = pickBestNkcSheet(meta.sheets) || meta.sheets[0]`.
   - Gán `sheetName`, `headerRow`, và `mapping` tương ứng của `selectedSheet`.

## Tiêu Chí Nghiệm Thu
- Khi nạp file Excel có Sheet 1 là `TrangBia` (2 dòng) và Sheet 2 là `NKC 2025` (10.000 dòng), hệ thống tự động chọn `NKC 2025`.
- `npm run typecheck` pass.
