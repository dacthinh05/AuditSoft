# Phase 2: Dọn Dẹp Emoji Trên AuditPage, CogsMatrix & Stepper

## 1. Mục Tiêu
- **`src/renderer/audit/AuditPage.tsx`**:
  + Thay 8 emoji ở mảng `TABS` bằng Icon SVG:
    * `risks`: `IconTarget`
    * `journals`: `IconClipboard`
    * `accounts`: `IconBuilding`
    * `pairs`: `IconRefresh`
    * `monthly`: `IconCalendar`
    * `recon`: `IconScale`
    * `kqkd`: `IconTrendingUp`
    * `chiphi`: `IconTrendingDown`
- **`src/renderer/components/Analytics/CogsMatrix12MTable.tsx`**:
  + Nút chuyển đổi góc nhìn:
    * `⚙️ Biên Chi Phí Thực Tế (CPSX)` $\rightarrow$ Chữ thuần hoặc kèm SVG icon nhẹ: `Biên Chi Phí Thực Tế (CPSX)`.
    * `📒 Biên Sổ Sách (TK 632)` $\rightarrow$ `Biên Sổ Sách (TK 632)`.
  + Gợi ý kiểm toán: thay emoji `💡` bằng `IconLightbulb`.
  + Cờ cảnh báo: thay `🔴`, `🟠` bằng chấm status pill thanh lịch `.status-dot`.
- **`src/renderer/components/AuditWorkflowStepper.tsx`**:
  + Bỏ emoji `💡` ở dòng gợi ý quy trình, thay bằng `IconLightbulb`.

## 2. Tiêu Chí Nghiệm Thu
- Giao diện các trang trở nên sạch sẽ, hiện đại, các tab hiển thị sắc nét trên cả màn hình High-DPI và máy tính thông thường.
