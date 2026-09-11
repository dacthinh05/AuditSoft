---
title: "Phase 3: Refactor GlAnalyticsTab & 12M Matrix Table (Sticky Column, '-' for Zeros, Clean SaaS Theme)"
description: "Tái cấu trúc toàn diện màn hình phân tích kế toán GlAnalyticsTab.tsx: Tích hợp bộ chuyển đổi góc nhìn biểu đồ, tối ưu bảng ma trận 12 tháng với cột đầu cố định, hiển thị dấu gạch ngang '-' cho số 0, tăng độ tương phản số liệu và tinh giản khối cảnh báo rủi ro."
status: planned
priority: P1
effort: "5h"
created: 2026-09-10
---

# Phase 3: Refactor GlAnalyticsTab & 12M Matrix Table

## 1. Mục Tiêu
Nâng cấp giao diện phân tích kế toán trong `GlAnalyticsTab.tsx` đạt chuẩn **Enterprise SaaS**:
1. Tích hợp bộ chuyển đổi góc nhìn phân tích trực quan hóa (Analytics Sub-View Switcher) cho phép KTV chuyển đổi linh hoạt giữa 4 biểu đồ tương quan và bảng số liệu tổng thể.
2. Khắc phục dứt điểm lỗi bảng ma trận 12 tháng bị tràn mép phải làm mất cột T11, T12 và CẢ NĂM: Cố định cột đầu tiên (`sticky column`), giảm đệm cột để hiển thị trọn vẹn toàn bộ các tháng.
3. Thay thế toàn bộ chữ số `0` tràn lan bằng dấu gạch ngang mờ `-` (`#cbd5e1`) giúp mắt KTV tập trung ngay vào các tháng có phát sinh số tiền thật.
4. Tăng độ đậm nét số liệu (`font-weight: 700`, monospace màu đen xám đậm `#0f172a`).
5. Thay thế 3-5 thanh cảnh báo màu vàng xếp chồng bằng **Hộp Cảnh Báo Thông Minh Tinh Gọn (`SmartAuditAlerts.tsx`)**.
6. Triệt tiêu toàn bộ emoji trang trí rườm rà.

## 2. Danh Sách Tệp Cần Chỉnh Sửa & Tạo Mới

| Tệp | Trách Nhiệm |
|-----|-------------|
| `src/renderer/components/Analytics/GlAnalyticsTab.tsx` | Tái cấu trúc component chính: tích hợp các component biểu đồ mới, tinh chỉnh bảng số liệu và thẻ Pareto. |
| `src/renderer/components/Analytics/SmartAuditAlerts.tsx` | Component hiển thị các điểm lưu ý rủi ro kiểm toán gọn gàng dạng lưới (Grid), phân loại theo tháng. |
| `src/renderer/styles.css` | Bổ sung các class CSS cho bảng ma trận cố định cột (`.matrix-sticky-col`), badge đột biến, và bộ chuyển góc nhìn biểu đồ. |

## 3. Chi Tiết Kỹ Thuật Triển Khai

### 3.1. Bộ Chuyển Góc Nhìn Biểu Đồ (Analytics Sub-View Switcher)
Đặt ngay phía trên khu vực phân tích biến động 12 tháng:
```tsx
type ChartViewKey = 'combo' | 'cogs_struct' | 'opex' | 'waterfall' | 'matrix'

<div className="analytics-view-switcher">
  <button className={activeView === 'combo' ? 'active' : ''} onClick={() => setActiveView('combo')}>
    Tương Quan Doanh Thu — Giá Vốn & Biên Lãi Gộp
  </button>
  <button className={activeView === 'cogs_struct' ? 'active' : ''} onClick={() => setActiveView('cogs_struct')}>
    Bóc Tách Cấu Trúc Chi Phí Giá Vốn (621/622/627)
  </button>
  <button className={activeView === 'opex' ? 'active' : ''} onClick={() => setActiveView('opex')}>
    Tỷ Lệ Chi Phí Hoạt Động (OPEX / Doanh Thu)
  </button>
  <button className={activeView === 'waterfall' ? 'active' : ''} onClick={() => setActiveView('waterfall')}>
    Cầu Nối Lợi Nhuận Waterfall
  </button>
  <button className={activeView === 'matrix' ? 'active' : ''} onClick={() => setActiveView('matrix')}>
    Bảng Số Liệu 12 Tháng Chi Tiết
  </button>
</div>
```

### 3.2. Cải Tiến Bảng Ma Trận 12 Tháng
- **Cố định cột Khoản mục (Sticky First Column)**:
  ```css
  .matrix-sticky-col {
    position: sticky;
    left: 0;
    background: #ffffff !important;
    z-index: 2;
    box-shadow: 2px 0 6px rgba(0, 0, 0, 0.04);
    min-width: 190px;
    font-family: system-ui, sans-serif !important;
    font-weight: 600;
  }
  th.matrix-sticky-col {
    background: #f8fafc !important;
    z-index: 3;
  }
  ```
- **Xử lý số 0 và số dương**:
  ```tsx
  {val === 0 ? (
    <span style={{ color: '#94a3b8' }}>-</span>
  ) : isAnomaly ? (
    <span style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
      {fmtMoneyNum(val)}
    </span>
  ) : (
    <span style={{ fontWeight: 700, color: '#0f172a' }}>
      {fmtMoneyNum(val)}
    </span>
  )}
  ```
- **Độ rộng và padding**:
  Giảm padding từ `padding: 8px 10px` xuống `padding: 6px 8px`. Cột "CẢ NĂM" có nền xanh nhạt `#eff6ff` và chữ màu xanh đậm `#1d4ed8` nổi bật.

### 3.3. Hộp Cảnh Báo Rủi Ro Tinh Gọn (`SmartAuditAlerts.tsx`)
- Thay thế 3-5 thanh màu vàng xếp chồng bằng một hộp tổng hợp:
  - Tiêu đề: `ĐIỂM LƯU Ý KIỂM TOÁN BIẾN ĐỘNG BẤT THƯỜNG (VSA 520)`
  - Hiển thị dưới dạng thẻ con trong lưới 2 cột:
    + Thẻ Tháng 4: Chi phí khác (811) đột biến 12.75 tỷ $\rightarrow$ Gợi ý kiểm tra biên bản thanh lý tài sản / tiền phạt.
    + Thẻ Tháng 6, 9: Chi phí QLDN (642) tăng cao $\rightarrow$ Gợi ý kiểm tra chi phí trích trước, lương thưởng giữa năm.
    + Thẻ Tháng 12: Tập trung kiểm tra thủ tục cắt niên độ (Cut-off) doanh thu và giá vốn.

## 4. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
1. KTV có thể chuyển đổi mượt mà giữa 4 biểu đồ và bảng số liệu chi tiết.
2. Bảng ma trận 12 tháng không bị vỡ bố cục, cột Khoản mục cố định khi cuộn ngang, toàn bộ 12 tháng và CẢ NĂM hiển thị đầy đủ.
3. Số 0 hiển thị dạng `-` thanh lịch, số tiền có độ tương phản cao, dễ đọc.
4. Toàn bộ icon trang trí rườm rà được loại bỏ, phong cách đồng nhất với hệ thống AuditSoft Light Theme Pro.
