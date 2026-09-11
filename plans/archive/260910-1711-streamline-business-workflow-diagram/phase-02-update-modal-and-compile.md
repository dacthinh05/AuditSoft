---
title: "Phase 2: Cập nhật Modal Component (ArchitectureDiagramModal.tsx) và Biên dịch Archify"
description: "Biên dịch file JSON mới ra .html và .svg bằng Archify compiler, đồng thời tái cấu trúc component ArchitectureDiagramModal.tsx với 3 cột rộng rãi và 4 chapters."
status: completed
priority: P1
effort: "0.5h"
tags: ["react", "modal", "svg", "archify-compiler"]
created: 2026-09-10
---

# Phase 2: Cập nhật Modal Component (ArchitectureDiagramModal.tsx) và Biên dịch Archify

## Context & Objectives

1. Chạy lệnh biên dịch offline của `ak-diagram` để tạo ra:
   - `docs/diagrams/auditsoft-architecture-map.html` (Standalone interactive reader).
   - `docs/diagrams/auditsoft-architecture-map.svg` (Vector graphic).
2. Cập nhật `src/renderer/components/ArchitectureDiagramModal.tsx`:
   - Bố cục 3 Cột rộng rãi (`viewBox="0 0 1080 480"`):
     - Cột 1 (x: 40, width: 280): Tiếp nhận & Đối chiếu (#02, #05, #04).
     - Cột 2 (x: 400, width: 280): Bốc mẫu VSA 530 (#03 đặt ngay vị trí trung tâm, thẳng hàng).
     - Cột 3 (x: 760, width: 280): Tổng hợp & Báo cáo (#01, #06).
   - Dây nối chỉ đi thẳng ngang hoặc lượn nhẹ giữa các cột liền kề (x = 320 -> 400, x = 680 -> 760).
   - Không có bất kỳ đường cong nào bắc cầu qua đầu cột khác.
   - Cập nhật 4 Chapters:
     - `all`: "Toàn Bộ Chu Trình Kiểm Toán"
     - `chap-1`: "1. Tiếp Nhận & Đối Chiếu Dữ Liệu" (#02, #05, #04)
     - `chap-2`: "2. Bốc Mẫu Kiểm Toán Chuẩn Mực VSA 530" (#03)
     - `chap-3`: "3. Báo Cáo & Tổng Hợp Hồ Sơ B410" (#01, #06)
   - Bảng thông tin chi tiết (Drawer) cập nhật chính xác cho 6 module.

## Verification
- Xem trực quan sơ đồ: 3 cột cân xứng, thoáng đãng, các nhãn chữ rõ ràng, hiệu ứng hover/click mượt mà.
