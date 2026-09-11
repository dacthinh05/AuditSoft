# Nhật Ký Kỹ Thuật: Hoàn Thành Lưu Trữ Kết Quả GLV & Nâng Cấp Số Liệu Ma Trận Sắc Nét

- **Ngày thực hiện:** 2026-09-11
- **Phân hệ:** Working Paper State Persistence & Matrix Typography / Contrast
- **Vấn đề giải quyết:**
  1. Khi xuất xong GLV, KTV bấm sang phân hệ khác rồi quay lại thì danh sách kết quả bị biến mất do state chỉ nằm ở component cục bộ.
  2. Phông chữ số liệu trên bảng Ma trận 12M bị mờ, mảnh nét do dùng font monospace mặc định (Courier New).

## 1. Kết Quả Triển Khai
1. **Lưu Trữ Kết Quả Xuất GLV Toàn Cục (`reconcileSlice.ts`):**
   - Thêm `workingPaperGenResult` và `setWorkingPaperGenResult()` vào Zustand global store.
   - `WorkingPaperPage.tsx` đọc trực tiếp từ store. Khi KTV chuyển sang Analytics, Bốc mẫu, B410 rồi quay lại tab Giấy Làm Việc, kết quả danh sách 15 file xuất thành công vẫn giữ nguyên 100%, không bị reset.
2. **Nâng Cấp Typography Ma Trận Sắc Nét (High-Contrast Tabular Sans):**
   - Thay thế toàn bộ font monospace mảnh mờ bằng:
     * `font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
     * `font-variant-numeric: tabular-nums` (đảm bảo các chữ số thẳng hàng dọc như Excel).
     * Màu chữ đen than đậm `#0f172a`, tăng độ đậm `font-weight: 600` (dày gấp đôi, siêu nét).
     * Kẻ lưới `#e2e8f0` sắc sảo, xen kẽ dòng chẵn/lẻ nhẹ (Zebra striping `#fafbfc` vs `#ffffff`).
   - Áp dụng đồng bộ trên:
     * Ma Trận Chi Phí Cấu Thành Giá Vốn 12M (`CogsMatrix12MTable`).
     * Ma Trận Chi Phí Theo Yếu Tố 12M (`ExpenseByNatureTable`).
     * Bảng Cân Đối Thuyết Minh BCTC (`recon-table`).

## 2. Kiểm Thử & Nghiệm Thu
- `npm run typecheck`: 0 lỗi trên cả 3 tsconfig (`web`, `node`, `tests`).
- `tests/workingpaper.test.ts`: Pass 100%.
