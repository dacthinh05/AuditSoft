---
phase: 2
title: "Chốt chặn Dùng thử cho Working Papers & B410"
status: pending
priority: P1
effort: "45m"
dependencies: ["phase-01-start"]
---

# Phase 2: Chốt chặn Dùng thử cho Working Papers & B410

## Overview
Đồng bộ hóa cơ chế kiểm tra bản quyền và giới hạn lượt dùng thử trên toàn bộ các tính năng xuất dữ liệu của AuditSoft:
1. Gắn kiểm tra `useTrialExport()` vào quy trình tạo Giấy làm việc tự động trong `WorkingPaperPage.tsx`.
2. Gắn kiểm tra `useTrialExport()` vào quy trình tổng hợp file B410 Master trong `B410DropZone.tsx`.

## Requirements
- Functional:
  - Khi người dùng bấm "TẠO TOÀN BỘ WORKING PAPERS": nếu là bản quyền thì chạy bình thường; nếu là dùng thử thì kiểm tra còn lượt hay không.
  - Nếu hết lượt dùng thử: chặn tiến trình, hiển thị thông báo lỗi và tự động mở `LicenseModal` để hướng dẫn quét mã VietQR.
  - Nếu còn lượt: trừ 1 lượt dùng thử, tiến hành tạo Giấy làm việc, và làm mới số lượt còn lại trên giao diện.
  - Tương tự với nút "BẮT ĐẦU TỔNG HỢP B410 THÀNH 1 FILE MASTER" trong `B410DropZone.tsx`.
- Non-functional:
  - Thông báo thân thiện, đồng nhất với trang Đối chiếu NKC (`ResultsPage.tsx`) và Chọn mẫu (`SamplingTab.tsx`).

## Architecture
```
User bấm Xuất / Tạo / Tổng hợp
  │
  ├─> useTrialExport()
  │     ├─> isLicensed = true? ──> Cho phép xuất (Không giới hạn)
  │     └─> isLicensed = false?
  │           ├─> remainingExports > 0? ──> Trừ 1 lượt, cho phép tiếp tục, cập nhật UI
  │           └─> remainingExports <= 0? ─> Chặn, thông báo hết lượt, mở LicenseModal
```

## Related Code Files
- Modify: `src/renderer/pages/WorkingPaperPage.tsx`
- Modify: `src/renderer/components/B410Consolidation/B410DropZone.tsx`
- Reference: `src/renderer/pages/ResultsPage.tsx`
- Reference: `src/renderer/components/SamplingTab.tsx`

## Implementation Steps
1. Trong `WorkingPaperPage.tsx`:
   - Import `useTrialExport` từ `../../shared/license`.
   - Trong `handleGenerate()`: kiểm tra `const trialCheck = useTrialExport()`. Nếu `!trialCheck.allowed`, set error, mở `useApp.getState().setLicenseModalOpen(true)`, refresh trial status và dừng xử lý.
   - Khi thành công, gọi `useApp.getState().refreshTrialStatus()`.
2. Trong `B410DropZone.tsx`:
   - Import `useTrialExport` từ `../../shared/license`.
   - Trong `handleConsolidate()`: kiểm tra `const trialCheck = useTrialExport()`. Nếu `!trialCheck.allowed`, hiển thị thông báo lỗi, mở License Modal và dừng xử lý.
   - Khi tổng hợp thành công, gọi refresh trial status.

## Success Criteria
- [x] Khi hết 10 lượt dùng thử, người dùng bấm tạo Working Papers bị chặn ngay từ đầu và popup bản quyền xuất hiện.
- [x] Khi hết 10 lượt dùng thử, người dùng bấm tổng hợp B410 bị chặn ngay từ đầu và popup bản quyền xuất hiện.
- [x] Khi còn lượt dùng thử, cả hai tính năng trên trừ đúng 1 lượt dùng thử mỗi lần thực hiện.
- [x] Khi đã kích hoạt key VIP, cả hai tính năng chạy không giới hạn.

## Risk Assessment
- Rủi ro: Trừ lượt dùng thử nhưng quá trình tạo file gặp lỗi giữa chừng (ví dụ file Excel nguồn bị lỗi).
  - Nhận biết: Người dùng phàn nàn bị mất 1 lượt khi file hỏng.
  - Phản ứng: Trong giai đoạn dùng thử 10 lượt là đủ để trải nghiệm; có thể cân nhắc hoàn lượt nếu gặp lỗi crash nghiêm trọng.
