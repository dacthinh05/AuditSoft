# Phase 1: Rà soát & Bóc tách ma trận đối ứng 2 chiều trong ExpenseByNatureEngine.ts

## Mục tiêu
Tính toán chính xác số phát sinh thuần (Netting) của 5 yếu tố chi phí đầu vào và chi phí P&L:
1. **5 Yếu tố chi phí phát sinh thuần**:
   - `Net 621` = Nợ 621 - Có 621 (trừ kết chuyển 154)
   - `Net 622` = Nợ 622 - Có 622 (trừ kết chuyển 154)
   - `Net 627` = Nợ 627 - Có 627 (trừ kết chuyển 154, 632)
   - `Net 641` = Nợ 641 - Có 641 (trừ kết chuyển 911)
   - `Net 642` = Nợ 642 - Có 642 (trừ kết chuyển 911)
2. **Chi phí P&L thuần (Sổ sách đối chiếu)**:
   - `Net 632` = Nợ 632 (trừ kết chuyển 911) - Có 632 (hàng bán bị trả lại, giảm giá vốn)
   - `Net 641` = Nợ 641 (trừ kết chuyển 911) - Có 641 (giảm chi phí bán hàng)
   - `Net 642` = Nợ 642 (trừ kết chuyển 911) - Có 642 (giảm chi phí QLDN)
   - `Tổng P&L thuần` = `Net 632 + Net 641 + Net 642`.

## File tác động
- `src/domain/analytics/ExpenseByNatureEngine.ts`
