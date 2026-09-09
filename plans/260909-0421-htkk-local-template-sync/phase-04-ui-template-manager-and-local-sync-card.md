---
phase: 4
title: "UI Template Manager & Local Sync Card"
status: pending
priority: P1
effort: "3h"
dependencies: [1, 2, 3]
---

# Phase 4: UI Template Manager & Local Sync Card

## Overview
Cập nhật giao diện người dùng của module Chuyển đổi QTT TNDN (`Qtt03ConverterPage`, `Qtt03DropZone`), bổ sung thanh trạng thái HTKK cục bộ, khối quản lý khuôn mẫu đang sử dụng và nút thao tác "Lưu tệp này làm khuôn mẫu mặc định". Toàn bộ thiết kế tuân thủ nghiêm ngặt phong cách phần mềm kế toán chuyên nghiệp, không sử dụng icon/emoji dạng AI, mang lại trải nghiệm tin cậy cho kế toán viên và kiểm toán viên.

## Requirements
- Functional:
  - Khối thông tin HTKK Cục bộ (Local HTKK Status Banner):
    - Hiển thị tình trạng phát hiện HTKK: ví dụ *"Phần mềm HTKK trên máy: Đã nhận diện phiên bản 5.7.1 (C:\\Program Files (x86)\\HTKK)"*.
    - Hiển thị khuôn mẫu đang áp dụng: *"Khuôn mẫu hiện hành: Chuẩn Thông tư 80 (XML 2.9.4)"* hoặc *"Khuôn mẫu tùy chỉnh (Đã lưu lúc 14:30 09/09/2026)"*.
  - Thao tác quản trị khuôn mẫu:
    - Khi người dùng nạp một tệp mới ở Chế độ 2, hiển thị nút bấm: **"Lưu tệp này làm khuôn mẫu mặc định"**.
    - Khi bấm lưu, thông báo xác nhận: *"Đã lưu thành công. Toàn bộ các lần chuyển đổi tự động tiếp theo sẽ áp dụng theo bộ khung của tệp này."*
    - Nếu đang dùng khuôn mẫu tùy chỉnh, hiển thị nút: **"Đặt lại về mẫu mặc định ban đầu"**.
  - Nút tiện ích "Lấy mẫu từ HTKK trên máy":
    - Cho phép nạp nhanh tệp XML gần nhất từ thư mục `DataFiles` của HTKK để làm khuôn mẫu mà không cần mở HTKK để xuất lại.
- Non-functional:
  - Giao diện kế toán tối giản, trang nhã, không chứa bất kỳ emoji nào.
  - Bố cục gọn gàng, hỗ trợ cả màn hình laptop 14 inch lẫn màn hình lớn.

## Architecture
```text
[Qtt03ConverterPage]
  ├── [HtkkLocalStatusBanner]
  │     ├── Trạng thái HTKK cục bộ (v5.7.1)
  │     ├── Khuôn mẫu hiện hành (Mặc định / Tùy chỉnh)
  │     └── Nút "Đặt lại về mẫu gốc"
  │
  ├── [Qtt03DropZone]
  │     └── Mode 2: Nút "Lưu tệp này làm khuôn mẫu mặc định"
  │
  └── [Qtt03ReconcileTabs]
```

## Related Code Files
- Modify: `src/renderer/components/EtaxConverter/Qtt03ConverterPage.tsx` (Thêm banner HTKK cục bộ)
- Modify: `src/renderer/components/EtaxConverter/Qtt03DropZone.tsx` (Thêm nút lưu khuôn mẫu mặc định)
- Create: `src/renderer/components/EtaxConverter/HtkkLocalBanner.tsx` (Component hiển thị thông tin HTKK trên máy)

## Implementation Steps
1. Xây dựng `HtkkLocalBanner.tsx`:
   - Gọi `window.electronAPI.detectLocalHtkk()` khi component mount để lấy thông tin phiên bản HTKK trên máy.
   - Đọc trạng thái từ `PersistentTemplateStore`.
   - Hiển thị nút bấm reset mẫu nếu đang dùng template tùy chỉnh.
2. Cập nhật `Qtt03DropZone.tsx`:
   - Bổ sung nút "Lưu tệp này làm khuôn mẫu mặc định" khi tệp mẫu mới được nạp.
3. Tích hợp vào `Qtt03ConverterPage.tsx`.

## Success Criteria
- [x] Hiển thị chính xác phiên bản HTKK cài đặt trên máy người dùng ngay khi vào trang.
- [x] Người dùng bấm nút "Lưu làm khuôn mẫu mặc định" có hiệu lực tức thì cho các lần chuyển đổi tiếp theo.
- [x] Hoàn toàn không có emoji AI nào xuất hiện trên giao diện.

## Risk Assessment
- **Rủi ro:** Khi chạy trên trình duyệt web thông thường (không qua Electron), các API đọc file hệ thống sẽ không khả dụng.
- **Biện pháp:** Thêm cơ chế graceful fallback: nếu không có Electron API thì ẩn phần quét thư mục cục bộ và chỉ giữ tính năng lưu template qua localStorage.
