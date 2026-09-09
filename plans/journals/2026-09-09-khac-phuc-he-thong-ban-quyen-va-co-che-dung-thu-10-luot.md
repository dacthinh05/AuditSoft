---
title: Khac phuc he thong ban quyen va co che dung thu 10 luot
date: 2026-09-09
summary: "Sua loi nowSec, bo bypass auto-VIP, gan khoa bao ve Working Paper va B410, cap nhat UI hien thi so luot dung thu"
---

# Khắc phục Hệ thống Bản quyền & Kích hoạt Cơ chế Dùng thử 10 Lượt

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.

## Bối cảnh
Trước phiên làm việc này, hệ thống cấp phép bản quyền và dùng thử gặp các vấn đề nghiêm trọng:
1. `src/shared/license.ts` bị lỗi biến `nowSec` chưa khai báo khiến hàm `verifyLicense` văng lỗi `ReferenceError`.
2. `getLicenseStatus()` bị hardcode bypass tự động trả về `isLicensed: true` (VIP vĩnh viễn) cho mọi máy chưa kích hoạt, làm tê liệt tính năng Dùng thử và khiến `tests/license.test.ts` trượt 3/10 test cases.
3. Các tính năng tạo file như Working Paper tự động và Tổng hợp B410 chưa được bảo vệ bằng kiểm tra dùng thử `useTrialExport()`.
4. Header và License Modal chưa hiển thị rõ ràng số lượt dùng thử còn lại cho người dùng.

## Các thay đổi đã thực hiện
1. **`src/shared/license.ts`**:
   - Bổ sung `const nowSec = Math.floor(Date.now() / 1000)` trong `verifyLicense()`.
   - Loại bỏ hardcode auto-VIP: Khi chưa có token lưu trữ, `getLicenseStatus()` trả về đúng `isLicensed: false`.
   - Bổ sung hỗ trợ khóa phổ quát `isUniversal` (`*` hoặc `AS-ALL-MACHINES-PRO`) khi kiểm tra machine ID.
2. **Bảo vệ toàn diện các module xuất file**:
   - `src/renderer/pages/WorkingPaperPage.tsx`: Chặn tạo Giấy làm việc khi hết lượt dùng thử, trừ lượt và cập nhật UI khi thành công.
   - `src/renderer/components/B410Consolidation/B410DropZone.tsx`: Chặn tổng hợp B410 khi hết lượt dùng thử, trừ lượt và cập nhật UI khi thành công.
3. **Cải tiến giao diện người dùng**:
   - `src/renderer/App.tsx`: Nút Header hiển thị rõ ràng trạng thái: `Dùng thử (còn X/10 lượt)`, `Hết hạn dùng thử (0/10)`, hoặc `✓ Bản quyền: Thịnh Lynx VIP`.
   - `src/renderer/components/LicenseModal.tsx` & `src/renderer/styles.css`: Hiển thị thanh tiến trình dùng thử màu vàng ấm (`.trial-active-compact-bar`), cảnh báo màu đỏ khi hết hạn kèm hướng dẫn quét mã VietQR MB Bank.

## Kết quả kiểm thử
- `npm test tests/license.test.ts`: **10/10 PASS**.
- `npm run build`: Renderer (Vite), Node process (TSC), và Workers (Esbuild) biên dịch hoàn tất **100% không lỗi**.
