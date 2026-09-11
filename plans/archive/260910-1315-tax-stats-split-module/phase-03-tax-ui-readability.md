# Phase 3: UI Thuế Dễ Xem Chuẩn SaaS

## Goal
Bảng thuế hết rối mắt: cùng ngôn ngữ thị giác với bảng GL đã tối ưu (sticky, `-`, monospace đậm, zero emoji).

## Changes (`TaxAnalyticsTab.tsx`, `TaxDropZone.tsx`)
1. Dải tóm tắt `Đã nạp...` → hàng 4 KPI cards (Số tệp XML, Tờ khai GTGT, Tờ khai TNCN, Tệp bỏ qua): card trắng, viền trên accent, số monospace 20px.
2. Cả 2 bảng: sticky cột đầu (Kỳ Khai, `position: sticky; left: 0`), header sticky? (giữ nguyên scroll dọc đơn giản — chỉ sticky cột ngang).
3. Ô giá trị `0n`/rỗng → `-` màu `#94a3b8`; số phát sinh monospace đậm `#0f172a`; cột GL nền `#eff6ff`; lệch đỏ `#b91c1c` bold / khớp xanh `#047857`.
4. Xóa emoji `⏳ ⚠️ ✓ 📄 📥 📑`; badge trạng thái dạng text (`Có chênh lệch` / `Khớp hoàn toàn`); loading/dropzone dùng text + màu, không icon emoji.
5. Empty-state khi chưa có tờ khai: 1 kiểu duy nhất, tiêu đề + mô tả + nút CTA về DropZone (bỏ emoji `📄`).
6. `TaxDropZone.tsx`: bỏ emoji `📥`, giữ dashed border + nút duyệt tệp; text hướng dẫn gọn.

## Non-goals
Không thêm biểu đồ thuế; không đổi cột/chỉ tiêu; không sửa `TaxCrossReconciler`.

## Acceptance
- Không còn ký tự emoji nào trong 2 file (grep `📥|⏳|⚠️|✓|📄|📑` trả về rỗng, ngoại trừ dấu `✓`? — thay hết bằng text).
- Bảng cuộn ngang giữ được cột Kỳ Khai; ô 0 hiện `-`.

## Verify
`npm run typecheck && npm run lint`
