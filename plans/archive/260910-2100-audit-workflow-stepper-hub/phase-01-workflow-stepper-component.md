---
phase: 1
title: "Xây dựng Component AuditWorkflowStepper và tích hợp vào HubPage"
status: "pending"
files_modified:
  - "src/renderer/components/AuditWorkflowStepper.tsx"
  - "src/renderer/pages/HubPage.tsx"
---

# Phase 1: Xây dựng Component AuditWorkflowStepper và tích hợp vào HubPage

## Mục tiêu
Tạo component giao diện React `AuditWorkflowStepper.tsx` biểu diễn 4 giai đoạn chuẩn trong quy trình kiểm toán độc lập thực chiến và đưa vào vị trí trung tâm trên `HubPage.tsx`.

## Chi tiết các bước thực hiện:

1. **Thiết kế cấu trúc dữ liệu của Stepper**:
   Mỗi bước gồm:
   - `stepNumber`: Chuỗi số thứ tự (`"01"`, `"02"`, `"03"`, `"04"`).
   - `title`: Tên giai đoạn nghiệp vụ ngắn gọn, trọng tâm:
     - Bước 1: *Khởi tạo & Sổ sách* (Nạp NKC & CĐPS)
     - Bước 2: *Rà soát & Phân tích* (Biến động 12M, Chỉ số VSA 520, Thuế)
     - Bước 3: *Trọng yếu & Bốc mẫu* (Tính OM/PM/CTT & Bốc mẫu VSA 530)
     - Bước 4: *Lập hồ sơ & Báo cáo* (Sinh 12 GLV VACPA & Tổng hợp B410)
   - `description`: Diễn giải ngắn gọn hành động cần làm.
   - `primaryViewKey`: View tương ứng để chuyển trang khi người dùng bấm vào (`'setup'`, `'analytics'`, `'sampling'`, `'workingpaper'`).
   - `secondaryActions`: Các tùy chọn phụ (ví dụ Bước 2 có thể chọn xem Thống kê thuế `'taxstats'`, Bước 4 có thể chọn xem `'b410'`).
   - `isReady`: Trạng thái nhận diện thông minh từ Zustand store (ví dụ: đã nạp NKC ở Nguồn 1 thì Bước 1 sáng đèn xanh).

2. **Tích hợp vào `HubPage.tsx`**:
   - Import `AuditWorkflowStepper` vào `HubPage.tsx`.
   - Bố trí ngay bên dưới khối Hero Banner (`.hub-hero`) và phía trên danh mục tìm kiếm / lưới các phân hệ (`.hub-grid-section`).
   - Đảm bảo khi người dùng tương tác, `useApp.getState().setView(viewKey)` được kích hoạt mượt mà.
