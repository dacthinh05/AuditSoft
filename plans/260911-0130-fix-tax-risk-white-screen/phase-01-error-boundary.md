# Phase 1: Xây dựng Component ErrorBoundary.tsx & Tích hợp vào App.tsx

## Mục tiêu
Loại bỏ vĩnh viễn hiện tượng sập màn hình trắng khi bất kỳ module React nào gặp ngoại lệ runtime:
1. Tạo file `src/renderer/components/ErrorBoundary.tsx`:
   - Bắt mọi lỗi render và lifecycle qua `getDerivedStateFromError` và `componentDidCatch`.
   - Hiển thị giao diện thông báo lỗi chuẩn mực: Tên lỗi, nút "Thử lại phân hệ" và nút "Quay về Trang Chủ".
2. Cập nhật `src/renderer/App.tsx`:
   - Bọc `<ErrorBoundary>` bên ngoài thẻ `<main className="app-main">` và `<Suspense>`.

## File tác động
- `src/renderer/components/ErrorBoundary.tsx` (mới)
- `src/renderer/App.tsx`
