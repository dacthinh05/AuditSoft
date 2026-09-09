---
phase: 3
title: "UI Integration & Error Handling"
status: pending
priority: P2
effort: "1d"
dependencies: [2]
---

# Phase 3: UI Integration & Error Handling

## Overview
Giao diện người dùng (UI) cho phép Trưởng nhóm AuditSoft kéo thả các file `.xls` và `.xlsx`. Module UI này sẽ giao tiếp với Core Engine ở Phase 2, hiển thị trạng thái xử lý thời gian thực, báo cáo tóm tắt, và cung cấp nút xuất file Master B410 cuối cùng.

## Requirements
- Functional: 
  - Vùng Drag & Drop hỗ trợ chọn nhiều file cùng lúc.
  - Hiển thị danh sách file, trạng thái từng file (Đang xử lý, Thành công, Lỗi).
  - Xuất báo cáo (Số dòng đã gộp, Số ảnh đã chép, Số file bỏ qua).
- Non-functional: UX mượt mà, cung cấp cảnh báo nếu phát hiện máy tính chưa cài MS Excel.

## Architecture
- React component mới (Zustand để quản lý state danh sách file).
- Giao tiếp IPC (Electron) với tiến trình nền (Core Engine).

## Related Code Files
- Create: `src/renderer/components/B410Consolidation/B410DropZone.tsx`
- Create: `src/renderer/components/B410Consolidation/B410Report.tsx`
- Modify: Tích hợp vào menu/navigation của phần Mẫu biểu/Báo cáo.

## Implementation Steps
1. Dựng UI DropZone, chỉ cho phép file `.xls`, `.xlsx`.
2. Tạo hàm `ipcRenderer.invoke` gửi đường dẫn mảng file xuống Node.js backend.
3. Ở backend, gọi `B410Consolidator` (Phase 2), dùng hàm callback hoặc IPC event để báo cáo tiến độ (`progress` event) sau khi xử lý xong mỗi file.
4. UI nhận event và cập nhật icon (Loading -> Checkmark / Error) bên cạnh tên file.
5. Khi hoàn tất, hiển thị bảng Summary Report tổng hợp số liệu. Cung cấp nút "Lưu B410 Tổng Hợp" để copy file temp ra ngoài thư mục do user chọn.
6. Thêm cơ chế kiểm tra (Pre-flight): Khi mount component, gọi lệnh ẩn để check COM Excel có khả dụng không. Nếu không, disable vùng DropZone và hiện thông báo hướng dẫn cài Excel.

## Success Criteria
- [x] Người dùng có thể kéo thả 5-10 file cùng lúc.
- [x] UI không bị đơ (freeze) khi quá trình COM đang diễn ra (nhờ chạy tiến trình nền độc lập).
- [x] Khi một file lỗi (ví dụ file khóa pass), UI chỉ báo đỏ file đó, các file khác vẫn báo xanh.
- [x] Nút lưu trả về file kết quả mở lên an toàn.

## Risk Assessment
- Rủi ro: Backend bị crash khiến IPC channel bị treo, giao diện loading vĩnh viễn.
- Khắc phục: Bọc toàn bộ block gọi Core Engine trong `try/catch`. Thêm `timeout` chờ IPC. Nếu vượt quá thời gian, backend tự kill process COM tương ứng và trả về lỗi `Timeout` cho Frontend để dừng trạng thái loading.