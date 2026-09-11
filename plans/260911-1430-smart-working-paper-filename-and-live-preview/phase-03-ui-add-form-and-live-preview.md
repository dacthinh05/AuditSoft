---
phase: 3
title: "Giao diện Form ADD, Nút chọn nhanh Đợt D1/D2 & Thẻ Live Preview"
status: pending
priority: P2
effort: "1h"
dependencies: ["phase-01", "phase-02"]
---

# Phase 3: Giao diện Form ADD, Nút chọn nhanh Đợt D1/D2 & Thẻ Live Preview

## Goal
Nâng cấp giao diện người dùng tại `src/renderer/pages/WorkingPaperPage.tsx` (và `engagementSlice.ts`), tự động điền gợi ý thông minh khi người dùng nạp file kế toán, bổ sung các nút điều khiển chọn đợt/phong cách và hiển thị khối xem trước tên file (Live Preview) theo thời gian thực.

## Files to Create / Modify
- Modify: `src/renderer/state/slices/engagementSlice.ts`
- Modify: `src/renderer/pages/WorkingPaperPage.tsx`
- Modify: `src/renderer/components/EngagementModal.tsx` (nếu cần đồng bộ)

## Tasks & Steps

1. **Cập nhật Zustand Store `engagementSlice.ts`**:
   - Thêm vào `EngagementProfile`:
     ```typescript
     clientShortName?: string
     auditPeriodStage?: 'D1' | 'D2' | ''
     namingStyle?: 'compact' | 'standard'
     ```
   - Thiết lập giá trị mặc định: `clientShortName: ''`, `auditPeriodStage: 'D2'`, `namingStyle: 'compact'`.

2. **Cập nhật hàm nạp file `handleLoadPath` trong `WorkingPaperPage.tsx`**:
   - Khi người dùng chọn file hoặc kéo thả file vào vùng nạp (DropZone):
     - Gọi `parseSmartFilename(filePath, clientName)`:
       - Nếu nhận diện được `clientShortName`, cập nhật state `clientShortName`.
       - Nếu nhận diện được `auditPeriodStage` (`D1` hoặc `D2`), tự động kích hoạt nút đợt tương ứng.
       - Nếu nhận diện được `fiscalYear`, cập nhật `fiscalYearEnd` và khoảng thời gian Đợt 1, Đợt 2 như hiện nay.
     - Đồng bộ vào store `setEngagement(...)`.

3. **Cải tiến Layout Bước 2 - "Thông Tin Hồ Sơ Kiểm Toán (ADD)"**:
   - Thêm ô nhập **"Tên viết tắt / Tên file rút gọn:"** (đặt ngay cạnh hoặc dưới ô Tên khách hàng đầy đủ):
     - Placeholder: `Ví dụ: Long Rich, ABC, May Mặc Test`
     - Có nút nhỏ 🔄 "Tự động trích xuất lại từ file" nếu KTV muốn reset về tên gốc.
   - Thêm cụm nút bấm chọn nhanh **Đợt kiểm toán (Audit Stage):**
     - Nút `[ ● Đợt 1 (D1) ]`: khi click, gán `auditPeriodStage = 'D1'`.
     - Nút `[ ● Đợt 2 (D2 - Final) ]`: khi click, gán `auditPeriodStage = 'D2'`.
     - Nút `[ ○ Không kèm đợt ]`: khi click, gán `auditPeriodStage = ''`.
   - Thêm cụm Toggle phong cách đặt tên file:
     - Tab hoặc Radio:
       - `[ ● Siêu gọn: D100 - Long Rich D1 2026 - Thinh.xlsx ]`
       - `[ ○ Chuẩn VACPA: D100 - Tien - Long Rich D1 2026 - Thinh.xlsx ]`
   
4. **Thiết kế Thẻ "Live Preview (Xem trước tên file & thư mục)"**:
   - Vị trí: Ngay dưới ô chọn Thư mục lưu kết quả, trước nút bấm xuất lớn (Hero CTA).
   - Thiết kế giao diện:
     - Hộp màu xanh nhạt hoặc xám slate hiện đại (`background: #f8fafc`, `border: 1px solid #e2e8f0`, `borderRadius: 8px`).
     - Biểu tượng ghim 📌 hoặc mắt xem trước 👁️.
     - Dòng 1: **Mẫu tên file xuất ra (Preview):**
       - Badge màu xanh lá cây hoặc tím đậm hiển thị chuỗi tên file thực tế, ví dụ:
         `D100 - Long Rich D2 2025 - Thinh.xlsx` (hoặc `D100 - Tien - Long Rich D2 2025 - Thinh.xlsx`)
       - Ghi chú: `(Áp dụng tương tự cho tất cả 15 file: Leadsheet, Master, D200, D300, D500...)`
     - Dòng 2: **Thư mục tự động tạo:** `📁 HoSoKiemToan_Long Rich_D2_2025/`
   - Tính phản ứng (Reactivity): Mọi thao tác gõ bàn phím (sửa tên viết tắt, sửa tên KTV, đổi năm, click chọn D1/D2, click gạt phong cách) đều làm Live Preview biến đổi tức thì không có độ trễ.

5. **Truyền tham số xuống hàm `handleGenerate`**:
   - Gửi kèm `clientShortName`, `auditPeriodStage`, `namingStyle` vào request gửi qua `window.auditsoft.generateWorkingPapers`.

## Verification
- Kiểm tra trực quan trên giao diện:
  - Nạp file `LONG RICH 2025 - D2 - sau dc.xlsx`: ô Tên viết tắt tự động điền `Long Rich`, Đợt tự động chọn `D2`, Live Preview hiển thị `D100 - Long Rich D2 2025 - Thinh.xlsx`.
  - Thử đổi KTV thành `Nguyễn Văn Nam` $\to$ Live Preview đổi thành `... - Nam.xlsx`.
  - Thử gạt sang phong cách Chuẩn VACPA $\to$ Live Preview đổi thành `D100 - Tien - Long Rich D2 2025 - Nam.xlsx`.
  - Thử bấm nút xuất file và kiểm tra thư mục kết quả sinh ra đúng tên chuẩn.
