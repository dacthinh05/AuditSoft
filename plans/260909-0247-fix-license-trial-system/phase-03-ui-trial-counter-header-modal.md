---
phase: 3
title: "Cập nhật Hiển thị Giao diện Header & License Modal"
status: pending
priority: P1
effort: "45m"
dependencies: ["phase-01-start"]
---

# Phase 3: Cập nhật Hiển thị Giao diện Header & License Modal

## Overview
Nâng cao trải nghiệm người dùng bằng cách hiển thị minh bạch số lượt dùng thử còn lại trên Header ứng dụng và trong License Modal, giúp kiểm toán viên nắm rõ tình trạng dùng thử và kích hoạt dễ dàng qua VietQR.

## Requirements
- Functional:
  - Header hiển thị huy hiệu bản quyền thông minh:
    + Đã kích hoạt: `✓ Bản quyền: Thịnh Lynx VIP` (Màu xanh lục).
    + Dùng thử còn lượt: `Dùng thử (còn X/10 lượt)` (Màu vàng cam dễ nhận biết).
    + Hết lượt dùng thử: `Hết hạn dùng thử (0/10)` (Màu đỏ cảnh báo).
  - License Modal:
    + Hiển thị rõ số lượt đã dùng và số lượt còn lại (`Đã dùng X/10 lượt xuất file Excel`).
    + Tự động tạo mã VietQR theo Machine ID và gói giá đã chọn (1 Năm hoặc Vĩnh Viễn).
    + Khi hết lượt, hiển thị thông báo kêu gọi kích hoạt rõ ràng.
- Non-functional:
  - Đảm bảo thiết kế gọn gàng (compact zero-scroll modal), typography sắc nét, phù hợp màn hình làm việc kiểm toán.

## Architecture
```
useApp Store (trialStatus: TrialExportStatus)
  │
  ├─> Header (App.tsx):
  │     └─> Hiển thị Badge: "Dùng thử (còn X/10)" hoặc "VIP Vĩnh viễn"
  │
  └─> LicenseModal.tsx:
        ├─> Hiển thị thanh tiến trình dùng thử (Progress bar / Badge)
        ├─> Bảng nhập License Key & Nút Kích hoạt
        ├─> Bộ chọn gói giá (1 Năm: 499k / Vĩnh Viễn: 990k)
        └─> Khung VietQR quét tự động + STK MB Bank
```

## Related Code Files
- Modify: `src/renderer/App.tsx`
- Modify: `src/renderer/components/LicenseModal.tsx`
- Modify: `src/renderer/styles.css`

## Implementation Steps
1. Trong `src/renderer/App.tsx`:
   - Cập nhật nhãn và tooltip của nút `.btn-license-header`: hiển thị rõ `Dùng thử (còn ${trialStatus.remainingExports}/${trialStatus.maxExports} lượt)`.
   - Cập nhật style CSS tương ứng nếu cần để badge hiển thị nổi bật.
2. Trong `src/renderer/components/LicenseModal.tsx`:
   - Bổ sung thanh trạng thái hiển thị số lượt dùng thử còn lại khi `!licenseState.isLicensed`.
   - Cập nhật hiển thị số lượt xuất thử chi tiết để người dùng kiểm toán viên an tâm sử dụng.
   - Giữ nguyên luồng sinh mã VietQR tức thì theo Machine ID và STK MB Bank 0817567008.

## Success Criteria
- [x] Header ứng dụng hiển thị chính xác số lượt dùng thử theo thời gian thực mỗi khi có thao tác xuất file.
- [x] License Modal thể hiện rõ ràng số lượt còn lại và hướng dẫn kích hoạt chi tiết.
- [x] Nút sao chép Mã máy (Machine ID), Số tài khoản MB Bank, Nội dung chuyển khoản hoạt động mượt mà.

## Risk Assessment
- Rủi ro: Tràn dòng text trên header nếu màn hình quá nhỏ.
  - Nhận biết: Nút header bị đẩy xuống hoặc đè lên navigation tab.
  - Phản ứng: Rút gọn text thành `Dùng thử: X/10` trên màn hình hẹp, hiển thị tooltip đầy đủ khi hover.
