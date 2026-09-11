---
phase: 1
title: "Tự Động Nhận Diện File NKC Trước Điều Chỉnh Từ Store"
status: ready
priority: P1
effort: "25m"
files:
  - "src/renderer/pages/WorkingPaperPage.tsx"
---

# Phase 01: Tự Động Nhận Diện File NKC Trước Điều Chỉnh Từ Store

## 1. Mục Tiêu
Khi kiểm toán viên đã nạp file Sổ Nhật Ký Chung ở màn hình Nhập liệu (Nguồn ①), khi truy cập vào phân hệ **#07 Lập 15 Giấy Làm Việc**, hệ thống phải **ngay lập tức tự động nhận diện file này** vào BƯỚC 1 mà không đòi hỏi thao tác nạp lại thủ công.

---

## 2. Chi Tiết Thực Hiện

### 2.1. Đọc State từ Zustand Store trong `WorkingPaperPage.tsx`
```tsx
const storeSourcePath = useApp((s) => s.workingPaperSourcePath)
const beforeFilePath = useApp((s) => s.before.meta?.filePath || s.before.cfg?.filePath || null)
```

### 2.2. Cơ chế nạp tự động (Auto Fallback)
Cập nhật `useEffect` lắng nghe:
```tsx
useEffect(() => {
  // Ưu tiên đường dẫn được truyền trực tiếp qua storeSourcePath (nếu có),
  // tiếp theo là file NKC Trước điều chỉnh đã nạp ở Nguồn ①
  const candidatePath = storeSourcePath || beforeFilePath
  if (candidatePath && !sourcePath) {
    handleLoadPath(candidatePath)
  }
}, [storeSourcePath, beforeFilePath, sourcePath])
```

### 2.3. Cập nhật giao diện BƯỚC 1 (UI Feedback)
1. Xác định trạng thái tự động nhận diện:
   ```tsx
   const isAutoLoadedFromBefore = Boolean(beforeFilePath && sourcePath === beforeFilePath)
   ```
2. Thêm badge hiển thị nguồn gốc dữ liệu bên cạnh trạng thái *"Đã sẵn sàng"*:
   ```tsx
   {isAutoLoadedFromBefore && (
     <span style={{
       background: '#f0fdf4',
       color: '#15803d',
       border: '1px solid #bbf7d0',
       fontSize: 11.5,
       fontWeight: 600,
       padding: '3px 9px',
       borderRadius: 6,
       display: 'inline-flex',
       alignItems: 'center',
       gap: 4,
     }}>
       ⚡ Đã lấy từ NKC Trước điều chỉnh (Nguồn ①)
     </span>
   )}
   ```
3. Nút *"Đổi file khác"* cho phép KTV chủ động chọn file Excel độc lập khác nếu có nhu cầu (khi chọn file mới, `sourcePath` đổi và badge tự tắt).

---

## 3. Kiểm Thử & Nghiệm Thu
- [ ] Mở ứng dụng, nạp file `MAU NKC.xlsx` vào Nguồn ① ở trang Nhập liệu.
- [ ] Chuyển sang module `#07 Lập 15 Giấy Làm Việc`.
- [ ] BƯỚC 1 tự động hiển thị `MAU NKC.xlsx` kèm badge "Đã lấy từ NKC Trước điều chỉnh (Nguồn ①)".
- [ ] Bấm *"Đổi file khác"* và chọn một file khác $\rightarrow$ BƯỚC 1 cập nhật file mới, badge tự động ẩn.
