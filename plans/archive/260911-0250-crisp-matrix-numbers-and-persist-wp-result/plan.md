---
title: "Khắc Phục Mất Kết Quả GLV Khi Chuyển Module & Nâng Cấp Số Liệu Ma Trận Sắc Nét, Rõ Ràng"
description: "Lưu trữ workingPaperGenResult vào Zustand store toàn cục để KTV chuyển qua phân hệ khác rồi quay lại vẫn giữ nguyên 100% kết quả xuất file; đồng thời nâng cấp phông chữ và độ tương phản của số liệu trên các bảng ma trận 12 tháng từ font monospace mờ sang High-Contrast Tabular Sans đậm đà, thẳng hàng, sắc nét tuyệt đối."
status: completed
priority: P1
effort: 1h
branch: main
tags:
  - ui-ux
  - state-persistence
  - zustand
  - typography
  - tabular-nums
  - high-contrast
created: 2026-09-11
---

# Kế Hoạch: Giữ Kết Quả GLV Khi Chuyển Module & Nâng Cấp Số Liệu Ma Trận Sắc Nét

## 1. Bối Cảnh & Vấn Đề Người Dùng Nêu
1. **Lỗi mất kết quả xuất GLV khi chuyển Module:**
   - Khi KTV xuất xong 15 file Giấy làm việc, danh sách kết quả đang hiện trên màn hình.
   - Nhưng khi KTV bấm sang phân hệ khác (ví dụ: sang Phân Tích Sơ Bộ, Bốc Mẫu, hoặc B410) rồi bấm quay lại tab Giấy Làm Việc $\rightarrow$ Màn hình bị reset về trạng thái ban đầu, danh sách kết quả bị biến mất!
   - **Nguyên nhân:** Biến `genResult` đang lưu trong `useState` cục bộ của component `WorkingPaperPage`. Khi chuyển view, component bị unmount và reset.
   - **Giải pháp:** Chuyển `workingPaperGenResult` vào Zustand Global Store (`reconcileSlice.ts` / `store.ts`).
2. **Số liệu trên Ma trận bị mờ và khó nhìn:**
   - Các bảng ma trận (Ma trận Giá vốn 12M, Ma trận Yếu tố 12M, Ma trận biến động) đang dùng `font-family: monospace` mặc định trên Windows (Courier New) có nét chữ mảnh, màu xám nhạt và khoảng cách chữ rời rạc.
   - **Giải pháp:** Chuyển sang phông chữ số liệu tài chính chuyên nghiệp:
     * `font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
     * `font-variant-numeric: tabular-nums` (thẳng hàng dọc tuyệt đối như Excel)
     * Ép màu đen than siêu nét `#0f172a`, tăng độ đậm lên `font-weight: 600` (Semi-bold, nét dày gấp đôi)
     * Kẻ lưới `#e2e8f0` sắc nét, xen kẽ dòng chẵn/lẻ nhẹ (Zebra striping `#fafbfc` vs `#ffffff`).

---

## 2. Lộ Trình Triển Khai (Phases)

| Phase | Nhiệm vụ chính | Files tác động |
| :--- | :--- | :--- |
| **Phase 1** | Lưu `workingPaperGenResult` vào Zustand Store | `src/renderer/state/slices/reconcileSlice.ts`<br>`src/renderer/state/store.ts`<br>`src/renderer/pages/WorkingPaperPage.tsx` |
| **Phase 2** | Nâng cấp CSS font số liệu High-Contrast Tabular Sans | `src/renderer/styles.css` |
| **Phase 3** | Kiểm thử, xác thực giao diện và Typecheck | `tests/workingpaper.test.ts` |
