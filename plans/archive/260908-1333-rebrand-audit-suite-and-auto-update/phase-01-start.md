---
phase: 1
title: "Re-brand UI & Labels"
status: pending
priority: P1
effort: "1h"
dependencies: []
---

# Phase 1: Re-brand UI & Labels

## Overview
Gỡ bỏ hoàn toàn định vị hạn hẹp "AuditSoft NKC", chuyển sang "AuditSoft — Hệ thống Trợ lý Kiểm toán Toàn diện" trên toàn bộ giao diện, logo, title bar và thông tin bản quyền.

## Requirements
- Functional:
  - Cập nhật Logo Brand: Thay thế pill badge `NKC` bằng `PRO` hoặc `AUDIT SUITE`.
  - Cập nhật Subtitle: Đổi thành `Hệ thống Trợ lý Kiểm toán Độc lập (Đối chiếu NKC · Mẫu VSA 530 · 12 GLV)`.
  - Cập nhật Title bar của Window: `AuditSoft — Hệ thống Trợ lý Kiểm toán Toàn diện`.
  - Cập nhật Title trong `index.html`: `AuditSoft — Hệ thống Trợ lý Kiểm toán Toàn diện`.
  - Cập nhật thông tin tiêu đề trong `LicenseModal.tsx`: `Bản Quyền & Kích Hoạt Phần Mềm — AuditSoft Audit Suite`.
  - Cập nhật `productName` trong `package.json` và cấu hình build.
- Non-functional:
  - Đảm bảo font chữ, độ co giãn (responsive), khoảng cách giữa các phần tử trên header giữ nguyên tính cân đối, thẩm mỹ chuẩn B2B SaaS.

## Architecture
- Không thay đổi luồng dữ liệu nghiệp vụ.
- Đồng bộ hóa các hằng số tên ứng dụng và nhãn text trong Renderer và Main process.

## Related Code Files
- Modify: `src/renderer/components/AppLogo.tsx`
- Modify: `src/renderer/styles.css`
- Modify: `src/renderer/index.html`
- Modify: `src/main/index.ts`
- Modify: `src/renderer/components/LicenseModal.tsx`
- Modify: `package.json`

## Implementation Steps
1. Mở `src/renderer/components/AppLogo.tsx`:
   - Thay `<span className="brand-badge-pill">NKC</span>` thành `<span className="brand-badge-pill">PRO</span>` (hoặc `SUITE`).
   - Cập nhật `app-brand-desc` thành: `Hệ thống Trợ lý Kiểm toán Độc lập (Đối chiếu NKC · Mẫu VSA 530 · 12 GLV)`.
2. Mở `src/renderer/styles.css`:
   - Tinh chỉnh style của `.brand-badge-pill` để phù hợp với nhãn mới (gradient nhẹ nhàng, padding cân đối).
3. Mở `src/main/index.ts` & `src/renderer/index.html`:
   - Đổi title cửa sổ thành: `AuditSoft — Hệ thống Trợ lý Kiểm toán Toàn diện`.
4. Mở `src/renderer/components/LicenseModal.tsx`:
   - Thay các dòng có `AuditSoft NKC` thành `AuditSoft — Bộ Trợ Lý Kiểm Toán Toàn Diện`.
5. Mở `package.json`:
   - Cập nhật `productName: "AuditSoft"`, `description: "Hệ thống Trợ lý Kiểm toán Toàn diện — Đối chiếu NKC, Bốc mẫu VSA 530 & 12 Giấy làm việc"`.

## Success Criteria
- [x] Giao diện ứng dụng không còn xuất hiện nhãn `AuditSoft NKC` làm người dùng hiểu lầm chỉ có tính năng NKC.
- [x] Logo hiển thị `Audit Soft [PRO]` sắc nét và đẳng cấp.
- [x] Subtitle giới thiệu trọn vẹn 3 trụ cột tính năng: Đối chiếu NKC, Bốc mẫu VSA 530, Lập 12 Giấy làm việc.
- [x] Cửa sổ Window và Web title hiển thị chuẩn `AuditSoft — Hệ thống Trợ lý Kiểm toán Toàn diện`.

## Risk Assessment
- Rủi ro: Tràn dòng hoặc lệch layout nếu subtitle quá dài trên màn hình nhỏ.
- Giảm thiểu: Kiểm tra CSS `white-space: nowrap` và căn chỉnh cỡ chữ 11px chuẩn SaaS.
