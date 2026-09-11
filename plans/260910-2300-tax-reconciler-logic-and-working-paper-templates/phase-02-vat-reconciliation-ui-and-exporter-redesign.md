---
phase: 2
title: "Thiết kế lại Giao diện Bảng Thuế và Exporter theo Mẫu Kiểm Toán Chuẩn E380"
status: "pending"
files_modified:
  - "src/renderer/components/Analytics/TaxAnalyticsTab.tsx"
  - "src/main/export/TaxReconExporter.ts"
  - "src/renderer/styles.css"
---

# Phase 2: Thiết kế lại Giao diện Bảng Thuế và Exporter theo Mẫu Kiểm Toán Chuẩn E380

## Mục tiêu
Tái cấu trúc bảng đối chiếu thuế trên giao diện và file xuất Excel thành **2 khối nghiệp vụ song song** đúng y hệt Biểu mẫu kiểm toán `E380 - B.1. PHÁT SINH: ĐỐI CHIẾU KÊ KHAI THUẾ & SỔ KẾ TOÁN` (Ảnh 2 của người dùng).

## Chi tiết các bước thực hiện:

1. **Cấu trúc Bảng GTGT trong `TaxAnalyticsTab.tsx`**:
   - Header 2 tầng:
     - Tầng 1: `KỲ KÊ KHAI` | `KÊ KHAI THUẾ GTGT (TỜ KHAI 01/GTGT)` (colSpan 7) | `SỔ KẾ TOÁN (SỔ NHẬT KÝ CHUNG)` (colSpan 4) | `GHI CHÚ KIỂM TOÁN`
     - Tầng 2:
       * Khối Thuế: `Tháng/Quý`, `VAT đầu vào [25]`, `VAT đầu ra [35]`, `Đ/c Giảm [37]`, `Đ/c Tăng [38]`, `Xin hoàn [42]`, `Phải nộp [40]`, `Số dư [43]`
       * Khối Sổ sách: `PS NỢ 133*`, `CL Đầu vào`, `PS CÓ 33311`, `CL Đầu ra`
   - Bảng TNCN: Bổ sung 2 cột mới:
     * `Thuế khấu trừ sổ NKC (Có 3335)`
     * `CL Thuế khấu trừ` ([29] vs Có 3335)

2. **Cập nhật `TaxReconExporter.ts`**:
   - Dựng Sheet `01_GTGT_DoiChieu` theo đúng ma trận 2 khối của Mẫu E380.
   - Dựng Sheet `02_TNCN_Luong334` đối chiếu cả Quỹ lương (Có 334) và Thuế TNCN khấu trừ (Có 3335).
   - Bảo toàn các công thức tính dòng CỘNG tổng cả năm.
