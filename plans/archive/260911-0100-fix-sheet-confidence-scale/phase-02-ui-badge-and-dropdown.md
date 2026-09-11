# Phase 2: Nâng cấp hiển thị Badges & Dropdown Options trên SetupPage.tsx

## Mục tiêu
Loại bỏ hoàn toàn chuỗi số thập phân dài và hiển thị chỉ báo độ khớp rõ ràng, tinh tế:
1. Format số phần trăm: `const conf = Math.min(100, Math.round(sheet.confidence <= 1 ? sheet.confidence * 100 : sheet.confidence))`.
2. Phân cấp 3 trạng thái nhận diện:
   - `conf >= 80`: `✓ Chuẩn cấu trúc TT200 (${conf}%)` (background: `#ecfdf5`, border: `#a7f3d0`, text: `#059669`)
   - `conf >= 50`: `⚡ Khớp cơ bản (${conf}%) — Cần rà soát cột` (background: `#fffbeb`, border: `#fde68a`, text: `#b45309`)
   - `conf < 50`: `⚠ Cần kiểm tra cấu trúc (${conf}%)` (background: `#fef2f2`, border: `#fecaca`, text: `#b91c1c`)
3. Dropdown `<select>`:
   - `{s.name} ({s.totalRows.toLocaleString('vi-VN')} dòng — {conf >= 50 ? `${conf}% TT200` : 'chưa khớp'})`.

## File tác động
- `src/renderer/pages/SetupPage.tsx`
