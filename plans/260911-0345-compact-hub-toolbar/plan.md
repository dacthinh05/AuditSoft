---
title: "Tinh Giản Hub Toolbar Siêu Gọn (Single-Line 52px) & Loại Bỏ Thông Tin Trùng Lặp"
description: "Loại bỏ khối Hero cồng kềnh (badge tiêu đề, 5 nút lọc danh mục, 3 dòng thống kê và nút bản quyền trùng lặp), thay bằng thanh công cụ đơn dòng Compact Hub Toolbar siêu gọn cao 52px chứa Ô Tìm Kiếm Nhanh và Nút Sơ Đồ Luồng Nghiệp Vụ, đưa 4 giai đoạn VSA và 8 thẻ phân hệ lên vị trí trung tâm tầm nhìn."
status: in-progress
priority: P1
effort: 0.3h
branch: main
tags:
  - ui-ux
  - hub-page
  - compact-toolbar
  - clean-ui
  - screen-real-estate
created: 2026-09-11
---

# Kế Hoạch: Tinh Giản Hub Toolbar Siêu Gọn & Loại Bỏ Thông Tin Trùng Lặp

## 1. Bối Cảnh & Mục Tiêu
- **Vấn đề:** Khối `hub-hero` hiện tại chiếm tới ~240px chiều cao màn hình với nhiều chi tiết thừa (badge tiêu đề, 5 nút lọc ít dùng khi chỉ có 8 phân hệ, 3 dòng thống kê marketing), đẩy Stepper 4 giai đoạn VSA và lưới 8 phân hệ xuống dưới màn hình khiến KTV phải cuộn trang.
- **Giải pháp:**
  - Thay thế toàn bộ khối `hub-hero` bằng `hub-compact-toolbar` nằm trên **1 hàng ngang duy nhất**.
  - Bên trái: Ô tìm kiếm mở rộng thoáng đãng `[ 🔍 Tìm nhanh công cụ (B410, NKC, VSA 530, eTax, Thuế...) ]`.
  - Bên phải: Nút `[ 🗺️ Sơ Đồ Luồng Nghiệp Vụ ]` (kiểu Soft Sky Pill).
  - Chiều cao giảm 78% (từ 240px $\rightarrow$ 52px), đưa toàn bộ 8 phân hệ trồi lên trên màn hình chính.

## 2. Các Files Thay Đổi
- `src/renderer/pages/HubPage.tsx`
- `src/renderer/styles.css`
- `tests/hub-navigation.test.ts`
