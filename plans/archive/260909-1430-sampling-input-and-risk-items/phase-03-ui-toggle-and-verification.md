---
phase: 3
title: "UI Toggle for Special Risk Items & End-to-End Verification"
status: completed
priority: P1
effort: "1h"
dependencies: ["phase-01-domain-engine-risk-toggle.md", "phase-02-input-fields-and-decimal-fix.md"]
---

# Phase 3: UI Toggle for Special Risk Items & End-to-End Verification

## Overview

Thêm điều khiển trực quan trên giao diện `SamplingTab.tsx` để người dùng có thể chủ động **BẬT** hoặc **TẮT** chức năng "Quét phần tử đặc biệt (rủi ro đặc thù)", đồng thời truyền cờ `includeRiskItems` vào hook tính toán `calculateAuditSamplingWp`. Sau đó, tiến hành kiểm thử toàn diện toàn bộ quy trình từ giao diện, bảng 10 bước, danh sách mẫu cho đến xuất file Excel Working Paper.

## Requirements

### Functional
1. **Thêm điều khiển Toggle trên giao diện:**
   - Đặt Checkbox tại khu vực điều khiển lấy mẫu (Card 2 - Section Picker Controls, ngay cạnh checkbox *Gom các dòng cùng Số chứng từ*):
     ```tsx
     <label className="checkbox-label risk-items-toggle">
       <input
         type="checkbox"
         checked={config.includeRiskItems !== false}
         onChange={(e) => setConfig((c) => ({ ...c, includeRiskItems: e.target.checked }))}
       />
       <span>
         <strong>Quét phần tử đặc biệt (rủi ro đặc thù)</strong> (Cuối kỳ 31/12, số tiền tròn, từ khóa nhạy cảm)
       </span>
     </label>
     ```
   - (Tùy chọn phụ trợ): Tại Bảng 10 bước ở tiêu đề Dòng 6 (*6 - Giá trị phần tử đặc biệt*), có thể hiển thị thêm một nhãn trạng thái hoặc nút bật/tắt nhanh tiện dụng.
2. **Liên kết với Hook tính toán:**
   - Trong `useMemo` gọi `calculateAuditSamplingWp` (dòng 415 của `SamplingTab.tsx`):
     ```tsx
     const wpResult = useMemo<AuditSamplingWpResult>(() => {
       return calculateAuditSamplingWp({
         sectionName: activeSection?.label.replace(/^\d+\.\s*/, '') || 'Phần hành kiểm toán',
         accountCode: sectionCode,
         periodStr: '01/01 - 31/12/2025',
         items: filteredSectionItems,
         performanceMateriality: computedMat.performanceMateriality,
         itemMaterialityRatio: config.benchmark.pmRatio,
         assuranceLevel: config.confidenceLevel === 95 ? 'HIGH' : config.confidenceLevel === 90 ? 'MEDIUM' : 'LOW',
         clearlyTrivial: computedMat.clearlyTrivial,
         includeRiskItems: config.includeRiskItems !== false,
       })
     }, [activeSection, sectionCode, filteredSectionItems, computedMat, config.benchmark.pmRatio, config.confidenceLevel, config.includeRiskItems])
     ```
3. **Phản hồi giao diện khi BẬT / TẮT:**
   - Khi **BẬT** (mặc định):
     - Dòng 6 hiển thị giá trị và số lượng mẫu rủi ro đặc biệt.
     - Danh sách mẫu có các dòng gắn thẻ `SPECIFIC_RISK` (màu tím/cam).
   - Khi **TẮT**:
     - Dòng 6 hiển thị `0 đ` và `0 mẫu` (có thể kèm ghi chú: *Đã tắt quét phần tử rủi ro*).
     - Cỡ mẫu còn lại (Dòng 7) và Bước nhảy (Dòng 10) tự động tăng/giảm tương ứng do không còn bị khấu trừ phần tiền rủi ro.
     - Danh sách mẫu không còn dòng nào gắn thẻ `SPECIFIC_RISK`.
4. **Kiểm tra xuất file Excel Working Paper:**
   - Bấm nút "Xuất Working Paper Excel" khi tắt phần tử đặc biệt.
   - Kiểm tra file Excel tạo ra: công thức Dòng 31 (Row 7) `=ROUND((E21-E27-E29)/E26,0)` vẫn hợp lệ và cho kết quả chuẩn xác.

## Related Code Files

- `src/renderer/components/SamplingTab.tsx`
- `src/renderer/styles.css`
- `src/domain/sampling/exportSamplingWp.ts`

## Verification Gate

1. **TypeScript Typecheck:**
   ```bash
   npm run typecheck
   ```
   Đảm bảo không có lỗi type nào trong toàn bộ dự án.
2. **Unit Test Suite:**
   ```bash
   npx vitest run src/domain/sampling
   ```
   Đảm bảo toàn bộ test case liên quan đến sampling đều pass 100%.
3. **Manual / Interactive Verification:**
   - Nhập `65` vào ô PM $\rightarrow$ Kiểm tra Dòng (g) và Dòng 2 bảng 10 bước hiển thị đúng 65%.
   - Nhập `3,5` vào ô CTT $\rightarrow$ Kiểm tra Dòng (i) hiển thị đúng 3.5% của OM.
   - Bật / Tắt checkbox "Quét phần tử đặc biệt" $\rightarrow$ Bảng 10 bước và danh sách mẫu phản hồi mượt mà theo thời gian thực.
