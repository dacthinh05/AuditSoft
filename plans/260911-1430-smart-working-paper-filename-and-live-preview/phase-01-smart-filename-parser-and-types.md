---
phase: 1
title: "Bộ phân tích tên file thông minh & Khung định dạng tên W/P"
status: pending
priority: P2
effort: "45m"
dependencies: []
---

# Phase 1: Bộ phân tích tên file thông minh & Khung định dạng tên W/P

## Goal
Xây dựng module thuần túy `src/domain/workingpaper/smartFilenameParser.ts` chịu trách nhiệm bóc tách tự động các thành phần từ tên file nguồn và tên doanh nghiệp, chuẩn hóa KTV sang ASCII không dấu, đồng thời mở rộng interface `EngagementInfo` trong `types.ts`.

## Files to Create / Modify
- Create: `src/domain/workingpaper/smartFilenameParser.ts`
- Modify: `src/domain/workingpaper/types.ts`
- Create: `tests/unit/smartFilenameParser.test.ts`

## Tasks & Steps

1. **Mở rộng `EngagementInfo` trong `src/domain/workingpaper/types.ts`**:
   - Bổ sung trường:
     ```typescript
     clientShortName?: string // e.g. 'Long Rich'
     auditPeriodStage?: 'D1' | 'D2' | '' // e.g. 'D1', 'D2' hoặc rỗng
     namingStyle?: 'compact' | 'standard' // 'compact' = Siêu gọn (mặc định), 'standard' = Chuẩn VACPA có tên phân hệ
     ```

2. **Xây dựng module `src/domain/workingpaper/smartFilenameParser.ts`**:
   - `sanitizeFileName(name: string): string`: Lọc bỏ ký tự cấm Windows `/ \ : * ? " < > |`, thay thế bằng ký tự an toàn hoặc dấu gạch dưới, gộp khoảng trắng thừa.
   - `toAsciiAuditor(fullName: string): string`: Lấy từ cuối cùng trong tên KTV, chuẩn hóa bỏ dấu tiếng Việt (NFD regex, `Đ` $\to$ `D`), viết hoa chữ cái đầu (ví dụ: `Đắc Thịnh` $\to$ `Thinh`, `Nguyễn Hải Triều` $\to$ `Trieu`, `Phạm Hoàng Anh` $\to$ `Anh`).
   - `cleanCompanyPrefixes(fullName: string): string`: Cắt bỏ các tiền tố pháp lý công ty phổ biến tại Việt Nam:
     - `Công ty Cổ phần`, `Công ty CP`, `CTCP`
     - `Công ty TNHH MTV`, `Công ty TNHH`, `TNHH`
     - `Doanh nghiệp tư nhân`, `DNTN`, `Tập đoàn`
     - Kết quả: `Công ty Cổ phần May Mặc Gia Công Test` $\to$ `May Mặc Gia Công Test`.
   - `parseSmartFilename(filePathOrName: string, fallbackFullName?: string)`:
     - Nhận vào đường dẫn hoặc tên file (ví dụ `LONG RICH 2025 - D2 - sau dc.xlsx`).
     - Tách extension (`.xlsx`, `.xlsm`, `.xls`).
     - Nhận diện đợt kiểm toán:
       - Match `\b(D1|DOT\s*1|INTERIM|6M)\b` (không phân biệt hoa thường) $\to$ `auditPeriodStage = 'D1'`.
       - Match `\b(D2|DOT\s*2|FINAL|CN|CA\s*NAM)\b` $\to$ `auditPeriodStage = 'D2'`.
     - Nhận diện năm niên độ:
       - Match `\b(202\d)\b` $\to$ `fiscalYear = match[1]`.
     - Làm sạch tên rút gọn:
       - Loại bỏ các từ khóa điều chỉnh kế toán: `sau dc`, `truoc dc`, `adjusted`, `unadjusted`, `sau dieu chinh`, `nkc`, `nhat ky chung`, `so cai`, `mau`.
       - Loại bỏ năm đã match và đợt đã match.
       - Làm sạch dấu phân cách `-`, `_`, `()`.
       - Nếu chuỗi còn lại rỗng hoặc thuộc danh sách từ khóa rác (`DATA`, `TEST`, `MAU`, `NKC`, `FILE`): fallback sang `cleanCompanyPrefixes(fallbackFullName || '')`.
       - Chuẩn hóa viết hoa đầu từ (Title Case): `LONG RICH` $\to$ `Long Rich`.
   - `formatWorkingPaperFileName(params)`:
     - `code`: `D100`, `D200`, `Leadsheet`, `A - B - H`...
     - `shortSectionName`: `Tien`, `HTK`, `Phai thu`...
     - `clientShortName`: `Long Rich`
     - `auditPeriodStage`: `D1` / `D2` / `''`
     - `fiscalYear`: `2025` / `2026`
     - `auditorName`: `Đắc Thịnh`
     - `namingStyle`: `'compact' | 'standard'`
     - Logic tạo tên:
       - Compact: `[code] - [clientShortName] [stage] [year] - [auditor].xlsx`
         - Ví dụ: `D100 - Long Rich D1 2026 - Thinh.xlsx`
         - Với Leadsheet: `Leadsheet - Long Rich D1 2026 - Thinh.xlsx`
         - Với A - B - H: `A - B - H - Long Rich D1 2026 - Thinh.xlsx` (hoặc `A - B - H - Master - Long Rich D1 2026 - Thinh.xlsx`)
       - Standard: `[code] - [shortSectionName] - [clientShortName] [stage] [year] - [auditor].xlsx`
         - Ví dụ: `D100 - Tien - Long Rich D1 2026 - Thinh.xlsx`
   - `formatOutputDirectoryName(params)`:
     - Tạo thư mục: `HoSoKiemToan_[clientShortName]_[stage]_[year]`
     - Ví dụ: `HoSoKiemToan_Long Rich_D2_2025` (hoặc `HoSoKiemToan_Long Rich_2025` nếu không có đợt).

3. **Viết test cases trong `tests/unit/smartFilenameParser.test.ts`**:
   - Kiểm tra bóc tách `LONG RICH 2025 - D2 - sau dc.xlsx` $\to$ `Long Rich`, `D2`, `2025`.
   - Kiểm tra bóc tách `Long Rich 2025_D1_truoc dc.xlsx` $\to$ `Long Rich`, `D1`, `2025`.
   - Kiểm tra fallback khi file là `MAU NKC.xlsx` và tên cty là `Công ty Cổ phần May Mặc Gia Công Test` $\to$ `May Mặc Gia Công Test`.
   - Kiểm tra định dạng tên file compact vs standard.

## Verification
- Chạy: `npx vitest run tests/unit/smartFilenameParser.test.ts`
- Đảm bảo 100% test cases của module parser đạt trạng thái PASS.
