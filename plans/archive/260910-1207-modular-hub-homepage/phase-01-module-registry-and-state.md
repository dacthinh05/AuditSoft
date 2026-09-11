---
title: "Phase 1: Module Registry & State Architecture"
description: "Xây dựng cấu hình modulesRegistry.ts khai báo metadata cho toàn bộ phân hệ và cập nhật AppStore trong store.ts để hỗ trợ view 'hub'."
status: completed
priority: P1
effort: "0.5h"
tags: ["registry", "architecture", "state", "typescript", "store"]
created: 2026-09-10
---

# Phase 1: Module Registry & State Architecture

## Context & Objectives

Hiện tại các module trong AuditSoft bị hardcode rải rác trong `App.tsx` (qua các thẻ `<button className="segmented-btn">`). Không có một nơi trung tâm định nghĩa danh mục, mã phân hệ, mô tả nghiệp vụ, biểu tượng và trạng thái phát triển.

Phase 1 sẽ tạo ra:
1. **Module Registry (`src/renderer/config/modulesRegistry.ts`)**: Cấu trúc khai báo (Declarative Registry) duy nhất để quản lý tất cả các công cụ hiện tại và tương lai.
2. **Cập nhật State (`src/renderer/state/store.ts`)**: Mở rộng kiểu dữ liệu `view` bao gồm `'hub'`, và đổi giá trị khởi tạo mặc định thành `'hub'`.

## Detailed Specifications

### 1. File cấu hình `src/renderer/config/modulesRegistry.ts`

```ts
export type ModuleGroup = 
  | 'reconcile_report'    // Đối chiếu & Báo cáo
  | 'standards_sampling'   // Chuẩn mực & Bốc mẫu
  | 'tax_compliance'      // Thuế & Hóa đơn điện tử
  | 'upcoming'            // Lộ trình phát triển

export type ModuleStatus = 'active' | 'beta' | 'coming_soon'

export interface ModuleDefinition {
  id: string
  code: string            // Ví dụ: '01', '02', '03'...
  title: string           // Tên đầy đủ: 'Tổng Hợp B410 — Bảng Sai Sót Kiểm Toán'
  shortTitle: string      // Tên rút gọn trên Header: 'Tổng Hợp B410'
  group: ModuleGroup
  groupName: string       // Tên nhóm hiển thị: 'Đối Chiếu & Báo Cáo'
  description: string     // Mô tả ngắn 1-2 câu
  capabilities: string[]  // 2-3 điểm nổi bật
  status: ModuleStatus
  badgeText?: string      // 'PHỔ BIẾN', 'CHUẨN MỰC VSA', 'MỚI', 'SẮP RA MẮT'
  viewKey?: 'b410' | 'setup' | 'sampling' | 'qtt03'
  accentColor: string     // Màu nhận diện (hex hoặc css variable)
}
```

Danh sách phân hệ đăng ký mẫu:
- **01: Tổng Hợp B410 (Consolidation)**: Group `reconcile_report`, status `active`, viewKey `b410`.
- **02: Đối Chiếu 2 Sổ NKC (Journal Reconciler)**: Group `reconcile_report`, status `active`, viewKey `setup`.
- **03: Chọn Mẫu VSA 530 (Audit Sampling)**: Group `standards_sampling`, status `active`, viewKey `sampling`.
- **04: Chuyển Đổi Tờ Khai eTax (eTax QTT03)**: Group `tax_compliance`, status `active`, viewKey `qtt03`.
- **05: Lập 12 Giấy Làm Việc Tự Động (Working Papers)**: Group `upcoming`, status `coming_soon`.
- **06: Rà Soát Chi Phí Rủi Ro Thuế & B4 (Tax Risk Scanner)**: Group `upcoming`, status `coming_soon`.

### 2. Cập nhật `src/renderer/state/store.ts`

- Kiểu `view`:
  ```ts
  view: 'hub' | 'b410' | 'workingpaper' | 'sampling' | 'setup' | 'results' | 'qtt03'
  ```
- Khởi tạo mặc định:
  ```ts
  view: 'hub',
  ```
- Hàm `resetAll()`: vẫn giữ trạng thái an toàn, chuyển `view: 'hub'`.

## Verification & Checks
- Kiểm tra `modulesRegistry.ts` export đầy đủ danh sách và hàm tiện ích `getActiveModules()`, `getModuleByView()`.
- Chạy `npm run typecheck` xác nhận không có xung đột kiểu dữ liệu.
