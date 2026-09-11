# Phase 1: Registry & Legal Specs (Cập Nhật Quy Định Mới NĐ 181/2025 & Điều Hướng)

## 1. Mục Tiêu
Cập nhật định nghĩa module #08 `tax_risk_scanner` từ trạng thái `coming_soon` thành `active`, phản ánh đúng văn bản pháp lý mới (ngưỡng 5 triệu theo Nghị định 181/2025/NĐ-CP & Luật Thuế GTGT 2024, cùng ngưỡng 20 triệu theo quy định cũ), mở rộng `ViewKey` và kết nối điều hướng.

## 2. Các Thay Đổi Cụ Thể
1. **`src/renderer/config/modulesRegistry.ts`**:
   - Mở rộng kiểu `viewKey?: ... | 'taxrisk'`.
   - Cập nhật module `tax_risk_scanner`:
     - `status`: chuyển từ `'coming_soon'` sang `'active'`.
     - `category`: `'tax'`.
     - `categoryName`: `'Hỗ Trợ Thuế Điện Tử'`.
     - `title`: `'Rà Soát Rủi Ro Chi Phí Thuế & B4 QTT 03/TNDN'`.
     - `badgeText`: `'QUY ĐỊNH MỚI NĐ 181'`.
     - `viewKey`: `'taxrisk'`.
     - `description`: `'Tự động quét các khoản chi tiền mặt >= 5 triệu (Nghị định 181/2025/NĐ-CP) và >= 20 triệu (Nghị định 209/2013/NĐ-CP), phát hiện chia nhỏ phiếu chi trong ngày, ước tính thuế TNDN và chi phí không được trừ Chỉ tiêu B4.'`.
     - `highlights`:
       - `'Quét chi tiền mặt >= 5 triệu theo Luật Thuế GTGT 2024 / NĐ 181/2025'`
       - `'Phát hiện giao dịch tiền mặt tách nhiều hóa đơn cùng ngày cùng NCC'`
       - `'Tự động ước tính số tiền loại trừ Chỉ tiêu B4 Tờ khai 03/TNDN'`
   - Bổ sung module dự kiến trong tương lai trên Lộ Trình 2026–2027 (đảm bảo điều kiện `upcomingMods.length >= 1` trong test suite):
     - `id: 'ai_audit_copilot'`, `code: '09'`, `title: 'Trợ Lý AI Soát Xét Báo Cáo Tài Chính & Bút Toán Gian Lận'`, `status: 'coming_soon'`.
2. **`src/renderer/state/slices/navigationSlice.ts`**:
   - Mở rộng union type `ViewKey` thêm `'taxrisk'`.
3. **`src/renderer/components/ArchitectureDiagramModal.tsx`**:
   - Sửa mô tả module #08: `'Rà soát chi tiền mặt >= 5 triệu (NĐ 181/2025) & >= 20 triệu, chi phí không có hóa đơn hợp lệ, lãi vay giao dịch liên kết.'`.
4. **`src/renderer/pages/HubPage.tsx`**:
   - Đảm bảo `getModuleIcon` có case xử lý cho `tax_risk_scanner`.
5. **`tests/hub-navigation.test.ts`**:
   - Cập nhật số lượng module active từ `7` lên `8`.
   - Thêm `expect(activeIds).toContain('tax_risk_scanner')`.
   - Thêm `expect(getModuleByView('taxrisk')?.id).toBe('tax_risk_scanner')`.

## 3. Tiêu Chí Nghiệm Thu
- [x] `modulesRegistry.ts` có đầy đủ thông tin chuẩn pháp lý NĐ 181/2025 ngưỡng 5 triệu.
- [x] Thẻ #08 trên Hub hiển thị badge "QUY ĐỊNH MỚI NĐ 181", click vào chuyển view sang `'taxrisk'`.
- [x] `npm run typecheck` và `npx vitest run tests/hub-navigation.test.ts` pass 100%.
