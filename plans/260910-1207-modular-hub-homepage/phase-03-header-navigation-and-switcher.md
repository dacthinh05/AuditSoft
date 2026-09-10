---
title: "Phase 3: Header Navigation & Quick Switcher Integration"
description: "Tái cấu trúc khu vực trung tâm thanh Header trong App.tsx: thay thế thanh ngang 4 nút bằng nút Trang Chủ và Quick Switcher linh hoạt."
status: completed
priority: P1
effort: "1.0h"
tags: ["header", "quick-switcher", "navigation", "breadcrumb", "ui-ux"]
created: 2026-09-10
---

# Phase 3: Header Navigation & Quick Switcher Integration

## Context & Objectives

Khi người dùng đang ở trong bất kỳ phân hệ làm việc nào (B410, NKC, VSA 530, eTax), thanh Header cần tinh gọn để không chiếm diện tích ngang, đồng thời cung cấp 2 khả năng điều hướng quan trọng:
1. **Quay về Trang Chủ**: Nút bấm `[🏠 Trang Chủ]` rõ ràng.
2. **Chuyển nhanh phân hệ khác (Quick Switcher)**: Một menu dropdown nhỏ gọn cho phép chuyển thẳng sang phân hệ khác mà không bắt buộc phải quay lại trang chủ trước.

## Detailed Implementation

### 1. Component `src/renderer/components/HeaderNavigation.tsx`

Tạo component điều hướng cho `header-center`:
- **Khi `view === 'hub'`**:
  - Hiển thị nhãn chào hoặc thanh tìm kiếm nhanh / chỉ báo: `"Hệ thống Trợ lý Kiểm toán Toàn diện"`.
- **Khi `view !== 'hub'`**:
  - **Nút Home**: `<button className="btn-header-home" onClick={() => setView('hub')}>`
    - Icon ngôi nhà (`IconHome` hoặc tương đương) + chữ `"Trang Chủ"`.
  - **Ký tự phân cách Breadcrumb**: `<span className="nav-separator">/</span>`
  - **Bộ Quick Switcher (`.header-module-switcher`)**:
    - Nút hiển thị phân hệ hiện tại: Mã số + Tên phân hệ (Ví dụ: `01 • Tổng Hợp B410 ▾`).
    - Khi click: Mở danh sách popover dropdown nhỏ gọn liệt kê tất cả các module đang hoạt động.
    - Click vào module khác: Đổi `view` tức thì và tự động đóng dropdown.
    - Click ra ngoài (Outside click): Tự động đóng dropdown.

### 2. Cập nhật `src/renderer/App.tsx`
- Thay thế toàn bộ khối `<div className="segmented-nav">` bằng `<HeaderNavigation />`.
- Thêm màn hình render trong `<main className="app-main">`:
  ```tsx
  {view === 'hub' && <HubPage />}
  ```
- Duy trì xử lý đặc thù của `view === 'results'` (khi có kết quả đối chiếu NKC) trong luồng làm việc của module NKC.

### 3. Styling trong `src/renderer/styles.css`
- `.btn-header-home`: Phong cách nút phẳng tinh tế, hover nền sáng mềm mại.
- `.header-module-switcher`: Nền bo góc 6px, có hiệu ứng mũi tên quay khi mở menu.
- `.switcher-dropdown`: Popover nổi, bóng mờ `0 10px 25px -5px rgba(0, 0, 0, 0.15)`, có phân cách danh mục rõ ràng.

## Verification & Checks
- Khi ở Trang Chủ: Header không bị rườm rà.
- Khi bấm vào phân hệ bất kỳ: Header lập tức cập nhật Breadcrumb `Trang Chủ / [Tên Phân Hệ]`.
- Bấm nút "Trang Chủ" quay lại HubPage thành công.
- Bấm dropdown chuyển trực tiếp từ B410 sang VSA 530 hoặc eTax thành công.
