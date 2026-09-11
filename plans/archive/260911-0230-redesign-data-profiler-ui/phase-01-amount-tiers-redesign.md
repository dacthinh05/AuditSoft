# Phase 01: Thiết kế lại Amount Tiers Panel (Phân tầng rủi ro giá trị)

## Mục tiêu
Nâng cấp giao diện 4 thẻ phân tầng giá trị từ các ô xám mờ nhạt thành 4 thẻ Fintech Card phân cấp rủi ro rõ rệt.

## File tác động
- `src/renderer/components/DataProfiler/AuditDataProfilerBar.tsx`
- `src/renderer/styles.css`

## Chi tiết thực hiện
1. Cập nhật `AuditDataProfilerBar.tsx`:
   - Bổ sung icon/badge nhận diện mức độ rủi ro kiểm toán cho từng tầng (`LOW`, `MEDIUM`, `HIGH`, `KEY_ITEM`).
   - Sắp xếp layout thẻ: Tên tầng + nhãn rủi ro ở dòng 1; Số tiền to nổi bật ở dòng 2; Số dòng + tỷ trọng % và thanh tiến độ ở dòng 3.
2. Cập nhật `styles.css`:
   - Class CSS phân loại màu nền và viền thẻ:
     - `.tier-low`: viền `#bbf7d0`, nền `#f0fdf4`, badge xanh lá `#15803d`.
     - `.tier-medium`: viền `#bfdbfe`, nền `#eff6ff`, badge xanh dương `#1d4ed8`.
     - `.tier-high`: viền `#fde68a`, nền `#fffbeb`, badge vàng hổ phách `#b45309`.
     - `.tier-key_item`: viền `#fecdd3`, nền `#fff1f2`, badge đỏ hồng `#be123c`, icon báo động.
   - Thẻ khi active (`.selected`): đường viền đậm 2px tương ứng, đổ bóng shadow nhẹ, làm nổi bật trạng thái đang lọc.
   - Thanh tiến độ `.tier-progress-bar`: nâng độ dày lên 5px, màu sắc đồng bộ với tông màu của tầng.

## Tiêu chí nghiệm thu (Acceptance Criteria)
- 4 thẻ hiển thị màu sắc tương phản, rõ rệt, số tiền dễ nhìn từ xa.
- Thao tác nhấp chuột kích hoạt trạng thái lọc mượt mà, phản hồi visual rõ ràng.
