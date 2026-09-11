---
title: "Chuẩn Hóa & Nâng Cấp Bố Cục Trang In GLV (Print Layout & Page Preview Optimization)"
description: "Rà soát, thiết kế và tối ưu hóa toàn diện định dạng trang in cho 15 bộ Giấy làm việc kiểm toán (GLV) và B410: tự động khóa vừa vặn 1 trang ngang (Fit-to-1-Page-Wide), căn lề hẹp chuẩn bấm còng (Narrow Margins), lặp tiêu đề cột (Print Titles) và hiển thị sắc nét khi Print Preview (Ctrl + P)."
status: in_progress
priority: P1
effort: "4h"
tags: ["working-paper", "glv", "print-layout", "page-setup", "openxml", "b410", "excel"]
created: 2026-09-11
---

# KẾ HOẠCH TRIỂN KHAI: TỐI ƯU HÓA TOÀN DIỆN ĐỊNH DẠNG TRANG IN GLV

## 1. Bối cảnh & Mục tiêu

Khi kiểm toán viên lập hồ sơ kiểm toán bằng phần mềm AuditSoft NKC, các file Giấy làm việc (GLV như Leadsheet, D100, D300, D500, E200, G100, G200, B410...) sau khi nạp dữ liệu cần được in ra giấy A4 hoặc lưu bản PDF nộp cho Chủ nhiệm kiểm toán / Khách hàng.

### Hiện trạng rủi ro:
1. **Rớt cột mồ côi (Horizontal Overflow):** Khi bảng tính có nhiều cột (ví dụ từ cột A đến cột L hoặc N), khi bấm `Ctrl + P` (Print Preview) thì các cột cuối cùng (như *Tham chiếu GLV*, *Ghi chú KTV*, *Kết luận*) bị rơi sang trang ngang thứ 2. Kiểm toán viên phải mất công chỉnh tay từng sheet rất phiền phức.
2. **Thiếu lặp lại dòng tiêu đề (Missing Header Repeat):** Bảng số liệu dài 3 - 5 trang dọc nhưng từ trang 2 trở đi không lặp lại dòng tiêu đề cột (`STT, Tên đối tượng, Số dư đầu kỳ, Phát sinh Nợ, Phát sinh Có, Số dư cuối kỳ`), gây khó đọc và thiếu chuyên nghiệp.
3. **Lề in chưa tối ưu cho đóng hồ sơ:** Lề trang mặc định của Excel quá rộng, lãng phí diện tích, trong khi lề trái cần `1.5cm` (0.59 inch) để bấm lỗ đóng file còng mà không che khuất số liệu kế toán.

### Mục tiêu đạt được:
* Toàn bộ 15 bộ Giấy làm việc (`A - B - H`, `Leadsheet`, `D100`, `D200`, `D300`, `D500`, `D600`, `D700`, `E100`, `E200`, `E300`, `E400`, `F100`, `G100`, `G200`) và `B410 Master` khi mở lên bấm `Ctrl + P` đều **vừa khít 1 trang ngang (Fit-to-1-Page-Wide)**.
* **Lặp lại dòng tiêu đề cột** ở mọi trang in.
* **Lề in chuẩn A4:** Trái 0.59" (1.5cm), Phải 0.39" (1.0cm), Trên 0.47" (1.2cm), Dưới 0.47" (1.2cm).
* **Căn giữa trang in ngang** (`horizontalCentered="1"`), bật hiển thị lưới in (`gridLines="1"`).

---

## 2. Kiến trúc giải pháp (Architecture Design)

```
┌────────────────────────────────────────────────────────┐
│             Working Paper Generation Pipeline          │
└───────────────────────────┬────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
   ┌──────────────────────┐    ┌──────────────────────┐
   │ OpenXmlPackageEditor │    │     B410Renderer     │
   │ (15 GLV OpenXML Zip) │    │  (B410 Master Sheet) │
   └──────────┬───────────┘    └──────────┬───────────┘
              │                           │
              └─────────────┬─────────────┘
                            │
                            ▼
     ┌──────────────────────────────────────────────┐
     │           PrintLayoutNormalizer              │
     ├──────────────────────────────────────────────┤
     │ 1. <pageSetUpPr fitToPage="1"/> in <sheetPr> │
     │ 2. <pageMargins left="0.59" right="0.39".../>│
     │ 3. <pageSetup paperSize="9" fitToWidth="1"   │
     │               fitToHeight="0" .../>          │
     │ 4. <printOptions horizontalCentered="1".../> │
     │ 5. DefinedName "_xlnm.Print_Titles" for rows │
     └──────────────────────────────────────────────┘
```

---

## 3. Lộ trình triển khai theo các Phase

### Phase 1: Core Engine Print Optimization
* **Files:** `src/domain/workingpaper/openxml/PrintLayoutNormalizer.ts`, `src/domain/workingpaper/openxml/OpenXmlPackageEditor.ts`, `src/domain/workingpaper/b410/B410Renderer.ts`
* Xây dựng engine `PrintLayoutNormalizer`:
  * Xử lý XML OpenXML chính xác chuẩn ECMA-376 Part 4.
  * Tự động inject/update `<sheetPr>`, `<pageMargins>`, `<pageSetup>`, `<printOptions>`.
  * Tự động tính toán và cấu hình `fitToWidth: 1`, `fitToHeight: 0`, `orientation: 'landscape'` (hoặc 'portrait' cho sheet biên bản).
  * Khởi tạo `B410Renderer` chuẩn hóa toàn bộ sheet con lẫn sheet Master.

### Phase 2: Working Paper Templates Integration
* **Files:** `src/domain/workingpaper/WorkingPaperGenerator.ts`, `src/domain/workingpaper/fillers/*.ts`
* Tích hợp gọi tự động `editor.normalizePrintLayout(options)` trước khi lưu file tại `WorkingPaperGenerator.ts`.
* Nhận diện các sheet dữ liệu bảng biểu (bật `landscape`, `fitToWidth: 1`) và các sheet thuyết minh/chương trình kiểm toán (bật `portrait`, `fitToWidth: 1`).
* Khóa dòng tiêu đề bảng kê mẫu và bảng tổng hợp.

### Phase 3: UI Control & Verification
* **Files:** `src/renderer/pages/WorkingPaperPage.tsx`, `src/domain/workingpaper/b410/B410Types.ts`
* Thêm badge thông báo trên giao diện: `✓ Tự động căn chuẩn A4 trang in (Fit-to-Page & Lặp Header)` giúp kiểm toán viên an tâm.
* Viết script kiểm thử tự động đọc lại file kết quả, parse OpenXML và đối soát 100% các thẻ in ấn hợp lệ.
* Kiểm thử thực tế `Ctrl + P` (Print Preview) trên Microsoft Excel.

---

## 4. Kế hoạch xác thực (Verification Plan)

### Automated Tests:
1. `tests/printLayoutNormalizer.test.ts`: Test khả năng parse, inject và sửa đổi thẻ XML của `PrintLayoutNormalizer` mà không làm hỏng cấu trúc worksheet.
2. `npm test`: Đảm bảo toàn bộ 11+ test suite của hệ thống tiếp tục pass 100%.
3. `npm run typecheck`: Bảo đảm không phát sinh bất kỳ lỗi TypeScript nào.

### Manual Verification:
* Mở file GLV tạo ra trên Excel, nhấn `Ctrl + P`:
  * Cột cuối cùng của bảng không bị tràn sang trang thứ 2.
  * Lật trang 2, trang 3: Tiêu đề cột tự động hiển thị ở đầu mỗi trang.
  * Căn lề trái 1.5cm vừa khít đóng còng hồ sơ.
