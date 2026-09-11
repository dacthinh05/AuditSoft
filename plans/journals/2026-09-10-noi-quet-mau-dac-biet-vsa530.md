# Journal: Nới quét mẫu đặc biệt tự động VSA 530

- **Date**: 2026-09-10
- **Plan**: `plans/260910-0908-risk-auto-pick-broaden` (done)

## Chẩn đoán

Nút + checkbox không hỏng (chứng minh bằng test tạm 5/5: wiring checkbox → includeRiskItems → checkSpecificRisk → riskSamples → Dòng 6 đúng). Dòng 6 = 0 vì 5 tiêu chí quá hẹp: dòng ≥KCM đã vào Dòng 5, tròn số phải đúng bội 100tr, cutoff chỉ 30–31/12, 7 từ khóa, dưới CTT loại.

## Thay đổi (phương án A theo lựa chọn user)

1. `checkSpecificRisk`: cutoff mọi ngày tháng 12 (`/12/`, `-12-`); tròn số `≥50tr và chia hết 50tr`.
2. `calculateAuditSamplingWp`: bù Top-10 giá trị lớn dưới KCM khi quét auto trắng (tick tay không ảnh hưởng); note nguồn gốc từng mẫu + note Dòng 6.
3. `SamplingTab`: Dòng 6 count = 0 hiện note engine ("đã quét... không phát hiện"); text tĩnh cập nhật theo tiêu chí mới.

## Nghiệm thu

- typecheck 0 lỗi · lint sạch toàn repo · 50 files / 265 tests pass · build OK.
- Test mới: tròn 50tr/lệch 1đ, giữa tháng 12, ISO date, fallback Top-10 + note, tắt quét không fallback.
