---
title: "Phase 1: Header Update Badge & Pulse Effect"
description: "Cải tiến nút btn-update-header trong App.tsx và styles.css: thêm hiệu ứng nhịp đập pulse dot, viền phát sáng amber/orange, nhãn phiên bản mới tương phản cao khi có bản cập nhật."
status: completed
priority: P1
effort: "0.5h"
tags: ["header", "pulse-dot", "ui-styles", "badge"]
created: 2026-09-10
---

# Phase 1: Header Update Badge & Pulse Effect

## Context & Problem

Nút phiên bản hiện tại trên Header:
```tsx
<button
  type="button"
  className={`btn-update-header ${updateInfo?.hasUpdate ? 'has-update' : ''}`}
  onClick={() => setUpdateModalOpen(true)}
>
  <IconRefresh size={13} style={{ color: updateInfo?.hasUpdate ? '#0284c7' : '#64748b' }} />
  <span>v{updateInfo?.currentVersion || '0.1.0'}</span>
  {updateInfo?.hasUpdate && (
    <span className="update-pill-badge">Bản mới</span>
  )}
</button>
```
Khi `hasUpdate: true`:
- Lớp CSS `.btn-update-header.has-update` chỉ đổi màu sang nền xanh nhạt `#eff6ff`, viền `#93c5fd`, chữ `#1d4ed8`.
- Nút này đặt cạnh nút License và nút chạy, màu xanh pastel hòa lẫn vào thanh Header, không tạo được lực kéo thị giác (visual gravity) cần thiết đối với một bản phát hành mới.

## Proposed Changes

### 1. Cập nhật `src/renderer/App.tsx`
- Khi `updateInfo?.hasUpdate === true`:
  - Thêm một thẻ `<span className="update-pulse-dot" />` nhấp nháy liên tục cạnh icon xoay.
  - Hiển thị văn bản trực quan: `v{currentVersion}` kèm badge nổi bật `Có bản v{latestVersion}!` thay vì chỉ ghi chung chung "Bản mới".
  - Icon xoay khi có bản mới đổi sang màu hổ phách/cam ấm `#d97706` hoặc xanh dương công nghệ tương phản cao.

### 2. Cập nhật `src/renderer/styles.css`
- Thêm animation và styling cho `.btn-update-header.has-update`:
  - Nền: `linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)` (tone Amber sang trọng, ấm áp, cảnh báo thân thiện).
  - Viền: `1px solid #f59e0b`.
  - Hiệu ứng phát sáng nhẹ: `box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2), 0 2px 5px rgba(217, 119, 6, 0.15)`.
  - Màu chữ: `#92400e`, `font-weight: 600`.
- Thêm animation `@keyframes update-pulse`:
  - Chấm tròn `.update-pulse-dot`: kích thước 7x7px, màu `#f59e0b`, viền trắng, có hiệu ứng `box-shadow` lan tỏa tạo nhịp đập liên tục.
- Cập nhật `.update-pill-badge`:
  - Nền: `#d97706` hoặc `#dc2626` với chữ trắng đậm, bo góc tròn viên thuốc (pill), hiển thị rõ phiên bản mới.

## Verification & Checks
- Kiểm tra trạng thái bình thường (`hasUpdate: false`): nút giữ nguyên thiết kế chuẩn `[🔄 v1.1.6]` tối giản.
- Kiểm tra trạng thái có bản mới (`hasUpdate: true`): nút phát sáng, nhịp đập pulse mượt mà, không giật layout.
