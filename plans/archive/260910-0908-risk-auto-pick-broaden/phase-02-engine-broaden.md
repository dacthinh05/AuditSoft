# Phase 2: Engine Broaden

## Overview

- Priority: P1, Status: Pending
- Nới `checkSpecificRisk` + Top-N bù trong `calculateAuditSamplingWp`.

## Requirements

1. Cutoff tháng 12: `displayDate` chứa `/12/` hoặc `-12-` (mọi ngày tháng 12, mọi format đã biết) → note 'Giao dịch tháng khóa sổ (Cutoff tháng 12)'.
2. Tròn số: `>= 50tr và chia hết 50tr` → note 'Giá trị tròn số lớn (chia hết 50tr)'. Cập nhật test cũ assert 100tr.
3. Top-N bù (chỉ `auditSamplingWp.ts`): sau vòng phân loại, nếu quét bật + số mẫu auto = 0 + còn dòng dư → chuyển tối đa 10 dòng lớn nhất (abs amount) từ remaining sang risk, note 'Giá trị lớn trong nhóm còn lại (Top dưới KCM, bù khi quét tự động không phát hiện)'. Tick tay KTV không ảnh hưởng.
4. `riskSamples` mapping dùng đúng note (kể cả fallback) thay vì gọi lại `checkSpecificRisk` ra note rỗng.

## Related Code Files

- Modify: `src/domain/sampling/samplingEngine.ts`, `src/domain/sampling/auditSamplingWp.ts`
- Modify (tests): `src/domain/sampling/samplingEngine.test.ts`, `src/domain/sampling/auditSamplingWp.test.ts`

## Implementation Steps

1. Sửa 2 tiêu chí trong `checkSpecificRisk`.
2. Thêm Top-N fallback + note map trong `calculateAuditSamplingWp`.
3. Cập nhật test 100tr cũ; thêm test: tháng 12 giữa tháng, tròn 50tr, fallback Top-10, tắt quét không fallback.
4. Chạy test 2 file + typecheck.

## Todo List

- [x] Nới 2 tiêu chí + sửa test cũ
- [x] Top-N fallback + note đúng
- [x] Test mới xanh

## Success Criteria

- Test mới + cũ xanh; Dòng 6 có mẫu trên sổ mẫu mới.

## Risk Assessment

- Noise tăng nhẹ: mitigation là Top-N chỉ bù khi trắng, tròn số vẫn cần ≥50tr.
- `checkSpecificRisk` dùng chung 2 engine: cả 2 cùng hưởng lợi, test cả 2.

## Next Steps

- Phase 3: note UI khi trắng + verify toàn bộ.
