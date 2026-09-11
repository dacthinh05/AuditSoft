---
title: "Redesign Nút Sơ Đồ Luồng Nghiệp Vụ Trên Hub Quick Stats"
description: "Thiết kế lại nút Sơ Đồ Luồng Nghiệp Vụ từ khối xanh đậm to bản sang phong cách Soft Sky Pill hiện đại, bổ sung IconLayers và đồng bộ visual với thanh trạng thái Hub."
status: completed
priority: P2
effort: 0.2h
branch: main
tags:
  - ui
  - button-redesign
  - hub-page
  - icons
created: 2026-09-10
---

# Kế Hoạch: Redesign Nút Sơ Đồ Luồng Nghiệp Vụ (Hub Quick Stats)

## 1. Bối cảnh
- Nút "Sơ Đồ Luồng Nghiệp Vụ" trên thanh `hub-quick-stats` trước đây có kích thước lớn, màu xanh biển đậm gradient `#0284c7` chói lọi, không có icon và lệch hoàn toàn so với ngôn ngữ thiết kế tinh tế của thanh thông tin và nút `hub-license-pill` bên cạnh.
- Người dùng yêu cầu "ĐỔI NÚT" để giao diện chuyên nghiệp, thanh thoát và hiện đại hơn.

## 2. Giải pháp
1. **Thiết kế lại Style:** Chuyển sang phong cách **Soft Sky Pill**:
   - Bình thường: Nền `#f0f9ff`, viền mảnh `#bae6fd`, chữ `#0369a1`, chiều cao đồng bộ 100% với nút Bản quyền VIP.
   - Bổ sung vector `<IconLayers size={13} />` đứng trước chữ để trực quan hoá ý nghĩa sơ đồ luồng các phân hệ.
   - Khi rê chuột (Hover): Hiệu ứng mượt mà chuyển sang Gradient xanh dương, chữ và icon chuyển màu trắng, đổ bóng nhẹ và nâng nhẹ 1px.
2. **File tác động:**
   - `src/renderer/pages/HubPage.tsx`
   - `src/renderer/styles.css`
