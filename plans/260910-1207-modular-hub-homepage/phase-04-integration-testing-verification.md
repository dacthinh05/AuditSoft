---
title: "Phase 4: Integration, Testing & Verification"
description: "Xây dựng bộ kiểm thử tự động, chạy typecheck TypeScript, kiểm tra production build và xác thực tính năng điều hướng toàn diện."
status: completed
priority: P1
effort: "0.5h"
tags: ["testing", "vitest", "typecheck", "verification", "build"]
created: 2026-09-10
---

# Phase 4: Integration, Testing & Verification

## Context & Objectives

Xác thực tính toàn vẹn của hệ sinh thái sau khi chuyển sang mô hình Hub & Spoke:
- Không làm gãy bất kỳ luồng nghiệp vụ hiện có của 4 module.
- Kiểm thử unit test cho `modulesRegistry` và trạng thái chuyển đổi `view`.
- Đảm bảo 100% typecheck và đóng gói ứng dụng `npm run build` thành công.

## Tasks & Scenarios

### 1. Viết Unit Test: `tests/hub-navigation.test.ts`
- Xác thực `modulesRegistry`:
  - Có đầy đủ các module cốt lõi (B410, NKC, VSA 530, eTax).
  - Có các module tương lai (Working Papers, Tax Risk).
  - Kiểm tra các hàm truy vấn module theo `viewKey` hoạt động chính xác.
- Xác thực `store.ts`:
  - Khởi tạo mặc định là `view === 'hub'`.
  - Chuyển `setView('sampling')`, `setView('b410')`, `setView('hub')` cập nhật đúng state.
  - Hàm `resetAll()` đưa về `view === 'hub'`.

### 2. TypeScript Typecheck
- Chạy:
  ```bash
  npm run typecheck
  ```
- Đảm bảo không có lỗi type ở tất cả các tsconfig.

### 3. Production Build Smoke Test
- Chạy:
  ```bash
  npm run build
  ```
- Xác nhận Vite đóng gói thành công assets HTML/CSS/JS.

## Acceptance Checklist
- [ ] Mở app vào Trang Chủ (`view: 'hub'`).
- [ ] Chọn module bất kỳ mở đúng màn hình tương ứng.
- [ ] Nút [🏠 Trang Chủ] và Dropdown Quick Switcher hoạt động mượt mà.
- [ ] 100% kiểm thử Vitest và Typecheck vượt qua.
