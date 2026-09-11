# Phase 2: Nâng cấp UI TaxRiskScannerPage.tsx — Chuyên Đề & Bộ Thẻ KPI B4

## Mục tiêu
Thiết kế lại giao diện module #04 phản ánh đầy đủ bức tranh rà soát thuế toàn diện:
1. **Header Banner**:
   - Tiêu đề: "Rà Soát Rủi Ro Chi Phí Thuế & Tổng Hợp Chỉ Tiêu B4 QTT 03/TNDN".
   - Subtitle: "Quét tự động chi tiền mặt vi phạm NĐ 181, tiền phạt vi phạm hành chính (811), chi phí không hóa đơn và các khoản chi không được trừ khi tính thuế TNDN".
2. **Bộ 4 Thẻ KPI Tóm Tắt**:
   - Thẻ 1: **Tổng Chi Phí Không Được Trừ (B4)** (Màu đỏ Rose)
   - Thẻ 2: **Thuế TNDN Dự Kiến Tăng Thêm (20%)** (Màu xanh dương Sky)
   - Thẻ 3: **Chi Tiền Mặt Vi Phạm (NĐ 181)** (Màu cam Amber)
   - Thẻ 4: **Tiền Phạt VPHC & Không Hóa Đơn** (Màu tím Indigo)
3. **Thanh Tab Chuyên Đề Rủi Ro (Category Filters)**:
   - `[Tất cả vi phạm (N)]`
   - `[Chi tiền mặt >= 5tr (N)]`
   - `[Chia nhỏ trong ngày (N)]`
   - `[Tiền phạt VPHC (811) (N)]`
   - `[Không hóa đơn / Chi lẻ (N)]`
4. **Bảng Kê Chi Tiết**:
   - Cột "Phân loại rủi ro": Hiển thị badge màu sắc tương ứng với từng chuyên đề.
   - Cột "Căn cứ pháp lý & Lưu ý B4": Trích dẫn Thông tư 96/2015, Luật Thuế GTGT 2024, NĐ 181/2025.

## File tác động
- `src/renderer/components/TaxRisk/TaxRiskScannerPage.tsx`
