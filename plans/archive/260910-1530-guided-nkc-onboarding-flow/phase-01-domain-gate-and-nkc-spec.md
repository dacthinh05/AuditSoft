# Phase 01: Map Yêu Cầu Dữ Liệu Module + Spec NKC Trung Tâm

## 1. Mục Tiêu
Tạo một nguồn sự thật duy nhất trong domain: module nào cần BEFORE, module nào cần cả 2, và file NKC phải đạt chuẩn gì — để UI chỉ việc đọc, không tự suy diễn.

## 2. Việc Làm
1. Tạo mới `src/domain/nkcRequirements.ts`:
   - `MODULE_DATA_REQUIREMENTS: Record<ModuleViewKey, 'NONE' | 'BEFORE' | 'BOTH'>` — `NONE` cho Nhập liệu; `BEFORE` cho Phân tích cơ bản, Thuế, Bốc mẫu, Profiler; `BOTH` cho So khớp/Đối chiếu, Xuất GLV.
   - `NKC_COLUMN_SPEC` — 6 cột từ `ColumnMapping` (`date, voucher, description, debit, credit, amount`) kèm nhãn + mô tả tiếng Việt (tái dùng mảng `FIELDS` trong `SetupPage.tsx`, chuyển vào đây để khỏi định nghĩa 2 nơi).
   - `NKC_RULE_SPEC` — diễn giải từ `standardizeSource`: dòng trống bỏ qua; tiền null/0 bị loại (đếm `dropped`); ngày sai giữ lại + cờ `LOI_NGAY`; thiếu TK giữ lại + cờ `THIEU_TK_NO/CO`; SốCT/Diễn giải UPPER(TRIM); tiền làm tròn nguyên. Import `ROW_ERROR_LABELS` từ `src/domain/types.ts`, không copy text.
   - Selectors thuần hàm: `isBeforeReady(before): boolean`, `isAfterReady(after): boolean` (logic hiện ở `SetupPage.tsx:354-356`, chuyển vào đây).
2. `src/renderer/pages/SetupPage.tsx`: import selectors + `FIELDS` từ module mới, xóa định nghĩa cục bộ (giữ nguyên behavior).
3. Không đụng `standardizeSource`, không đụng store shape.

## 3. Nghiệm Thu
- `npx tsc -p tsconfig.web.json --noEmit` 0 lỗi.
- SetupPage build/behavior không đổi (so bằng mắt: 2 thẻ nguồn + nút đối chiếu như cũ).
