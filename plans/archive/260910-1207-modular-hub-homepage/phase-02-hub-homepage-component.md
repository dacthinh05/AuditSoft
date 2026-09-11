---
title: "Phase 2: Hub Homepage Component & Scalable Grid"
description: "Xây dựng component HubPage.tsx hiển thị Trang Chủ Tổng Quan với Hero Header, thanh tìm kiếm nhanh và lưới thẻ module có khả năng co giãn mở rộng không giới hạn."
status: completed
priority: P1
effort: "1.0h"
tags: ["react", "component", "hub-page", "card-grid", "search-filter", "ui-layout"]
created: 2026-09-10
---

# Phase 2: Hub Homepage Component & Scalable Grid

## Context & Objectives

Xây dựng trang chủ trung tâm `HubPage.tsx` đóng vai trò là "Bảng điều khiển công cụ" của AuditSoft.
Khi người dùng mở phần mềm, trang này sẽ chào đón KTV với giao diện tinh tế, sang trọng, mang phong cách kiểm toán - tài chính doanh nghiệp cao cấp (Clean Enterprise UI).

## Component Structure & Layout

### 1. File mới: `src/renderer/pages/HubPage.tsx`

Cấu trúc các khối:

#### A. Hero Banner Section (`.hub-hero`)
- **Title**: `"Trung Tâm Điều Khiển Công Cụ Kiểm Toán"`
- **Subtitle**: `"Hệ sinh thái hỗ trợ kiểm toán viên độc lập — Tối ưu năng suất trong mùa kiểm toán"`
- **Quick Search Bar (`.hub-search-input`)**:
  - Input tìm kiếm với icon kính lúp: `"Tìm kiếm công cụ (ví dụ: B410, NKC, VSA 530, eTax...)"`.
  - Hỗ trợ lọc tức thì (Instant Filter) theo tiêu đề, mã số hoặc từ khóa năng lực.
- **Pills Filter**: Lọc theo nhóm: `Tất cả` | `Đối Chiếu & Báo Cáo` | `Chuẩn Mực & Bốc Mẫu` | `Hỗ Trợ Thuế` | `Lộ Trình Mới`.

#### B. Scalable Module Cards Grid (`.hub-modules-grid`)
- Bố cục lưới tự co giãn: `grid-template-columns: repeat(auto-fill, minmax(340px, 1fr))`, khoảng cách `gap: 20px`.
- Mỗi thẻ (`.hub-module-card`):
  - **Top Bar**: Mã số phân hệ dạng huy hiệu nổi bật (ví dụ: `#01`, `#02`) + Badge nhóm chuyên môn (`BÁO CÁO TỔNG HỢP`, `VSA 530`, v.v.).
  - **Icon & Title Box**: Icon lớn với vòng tròn màu nhận diện độc bản + Tiêu đề phân hệ rõ ràng.
  - **Description**: Đoạn tóm tắt công dụng nghiệp vụ (1-2 dòng).
  - **Key Capabilities Checklist**: 2-3 gạch đầu dòng với dấu checkmark xanh/cam.
  - **Bottom Action Area**:
    - Với module `active`: Nút **`[Vào Phân Hệ →]`** có hiệu ứng hover mượt mà, chuyển thẳng `view`.
    - Với module `coming_soon`: Nút **`[Đang phát triển]`** (disabled hoặc tooltip thông tin lộ trình).

#### C. Footer System Status Bar (`.hub-status-bar`)
- Hiển thị tóm tắt: Phiên bản ứng dụng hiện tại, trạng thái bản quyền / số lượt dùng thử, trạng thái kết nối offline an toàn.

### 2. Styling trong `src/renderer/styles.css`
- Thiết kế thẻ module với hiệu ứng:
  - `transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);`
  - Hover: đổ bóng nổi `box-shadow: 0 16px 32px -8px rgba(15, 23, 42, 0.12); transform: translateY(-2px);`
  - Viền phát sáng nhẹ theo màu nhận diện (`accentColor`).
- Responsive: Tự động xếp 1 cột trên màn hình nhỏ, 2 cột trên laptop 13-14 inch, 3-4 cột trên màn hình desktop lớn 24-27 inch.

## Verification & Checks
- Thử nghiệm tìm kiếm bằng từ khóa: danh sách thẻ lọc chính xác và có trạng thái Empty State nếu không tìm thấy.
- Bấm vào nút "Vào Phân Hệ →" chuyển thành công vào các module `b410`, `setup`, `sampling`, `qtt03`.
