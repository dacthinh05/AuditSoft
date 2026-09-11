---
title: "Drilldown Chi Tiết Bút Toán Ma Trận 12 Tháng & Xuất Excel 2 Sheet Dạng Pivot Thông Minh"
description: "Cho phép KTV bấm vào từng ô trên Ma Trận 12 Tháng để bật Modal soi chi tiết từng dòng bút toán phát sinh (VirtualTable) và xuất file Excel 2 Sheet gồm Sheet 1 Pivot cơ cấu phát sinh theo TK đối ứng + Top 10 bút toán lớn và Sheet 2 Sổ chi tiết có AutoFilter."
status: completed
priority: P1
effort: 3h
branch: main
tags: [analytics, matrix-12m, drilldown, virtual-table, exceljs, pivot-export]
created: 2026-09-11
---

# Kế Hoạch Triển Khai: Drilldown Chi Tiết Bút Toán Ma Trận 12 Tháng & Xuất Excel Dạng Pivot

## 1. Bối Cảnh & Mục Tiêu (Outcome)
Trên bảng **Ma Trận Biến Động 12 Tháng Theo Khoản Mục** (`GlAnalyticsTab.tsx`), khi phát hiện các tháng có biến động bất thường (ví dụ: Tháng 02 Chi phí tài chính 635 vọt lên 5.84 tỷ), Kiểm toán viên cần soi ngay xem số tiền này gồm những chứng từ nào cấu thành.

Mục tiêu của kế hoạch:
1. **Tương tác Drilldown:** Bấm vào bất kỳ ô nào có phát sinh trên Ma trận $\rightarrow$ Mở Modal `MatrixDrilldownModal.tsx` hiển thị danh sách toàn bộ các dòng nhật ký chung tương ứng (lọc từ `glSnapshot.journals`).
2. **Hiệu năng & Trải nghiệm:** Dùng `VirtualTable` để cuộn mượt mà kể cả hàng nghìn dòng, có ô tìm kiếm tức thì theo số CT, diễn giải, TK đối ứng.
3. **Xuất Excel 2 Sheet Dạng Pivot:**
   - **Sheet 1 (`TongHop_Pivot`):** Bảng tổng hợp Pivot dựng sẵn:
     + Cơ cấu phát sinh theo cặp TK Đối ứng (Nợ/Có), số lượng, số tiền, tỷ trọng %.
     + Bảng Top 10 bút toán lớn nhất phục vụ bốc mẫu kiểm toán (VSA 530).
   - **Sheet 2 (`ChiTiet_SoCai`):** Bảng kê chi tiết toàn bộ các dòng phát sinh, bật sẵn AutoFilter và Freeze Panes.

---

## 2. Ràng Buộc & Tiêu Chí Nghiệm Thu (Constraints & Acceptance Criteria)
- **Ràng buộc:**
  - Không gọi lại ổ cứng hay re-import; lọc trực tiếp từ `glSnapshot.journals` trong Zustand store.
  - Tổng số tiền trong Modal và trong file Excel phải khớp 100% với con số trên ô ma trận.
  - File Excel mở được mượt mà trên mọi phiên bản Excel (2013 - 365, WPS) mà không bị lỗi corrupt file.
- **Tiêu chí nghiệm thu:**
  1. Click ô ma trận mở Modal nhanh dưới 50ms.
  2. Bảng hiển thị đầy đủ Ngày, Số CT, Diễn giải, Nợ, Có, Số tiền.
  3. Tìm kiếm từ khóa lọc danh sách tức thì.
  4. Nút "Xuất Excel" tạo file `.xlsx` chuẩn với 2 sheet `TongHop_Pivot` và `ChiTiet_SoCai`.
  5. 100% unit tests và typecheck pass.
