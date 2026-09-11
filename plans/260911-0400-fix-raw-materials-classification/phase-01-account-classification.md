# Phase 1: Sửa bảng phân loại tài khoản chi tiết trong ExpenseByNatureEngine.ts

## Mục tiêu
Khắc phục triệt để lỗi bot gán nhầm 239.6 tỷ chi phí gia công ngoài (62722) vào Nguyên vật liệu:
1. **Phân loại cụ thể từng tài khoản 4 và 5 số**:
   - `621`, `152` $\rightarrow$ `RAW_MATERIALS`
   - `622x`, `6271x`, `6411x`, `6421x`, `334`, `338` $\rightarrow$ `LABOR`
   - `62741`, `64141`, `64241`, `214` $\rightarrow$ `DEPRECIATION` (Chỉ những tài khoản khấu hao TSCĐ)
   - `62722` (Gia công ngoài), `6277x`, `6417x`, `6427x` $\rightarrow$ `OUTSIDE_SERVICES` (Dịch vụ mua ngoài)
   - `62744`, `64244` (Phân bổ CCDC/242), `6273x`, `6278x`, `6418x`, `6428x` $\rightarrow$ `OTHER_CASH` (Khác bằng tiền)
2. **Loại bỏ việc check tiền tố mơ hồ `startsWith('6272')`**.

## File tác động
- `src/domain/analytics/ExpenseByNatureEngine.ts`
