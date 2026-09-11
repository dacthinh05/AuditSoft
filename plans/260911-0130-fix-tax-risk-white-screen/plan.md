# Plan: Khắc Phục Lỗi Treo Màn Hình Trắng Khi Bấm Vào Module Rủi Ro Thuế & Bổ Sung Toàn Diện ErrorBoundary

## 1. Bối Cảnh & Vấn Đề (Problem & Root Cause)
Khi người dùng bấm vào phân hệ **#04: Rà Soát Rủi Ro Chi Phí Thuế & B4 QTT TNDN (NĐ 181)** từ Hub hoặc thanh điều hướng, ứng dụng bị treo màn hình trắng (White Screen of Death):
1. **Thiếu nạp tự động Sổ NKC (Missing Auto-load):**
   - `TaxRiskScannerPage.tsx` chỉ phụ thuộc vào `glSnapshot` trong Zustand store. Nếu người dùng mở app và bấm thẳng vào module này (chưa qua module Phân tích trước đó), `glSnapshot` là `null`.
   - Trang không có `useEffect` gọi `window.auditsoft.auditAnalyze({ filePath })` như `TaxStatsPage.tsx` để nạp dữ liệu.
2. **Bỏ quên `ModuleGateBanner` & Chưa khai báo `taxrisk: 'BEFORE'`:**
   - Trong `src/domain/nkcRequirements.ts`: `MODULE_DATA_REQUIREMENTS` chưa có key `taxrisk`.
   - Trong `TaxRiskScannerPage.tsx`: Chưa gắn `<ModuleGateBanner requirement="BEFORE" moduleName="Rà soát rủi ro thuế NĐ 181" />`. Nếu chưa nạp sổ, module không báo gì mà render trong trạng thái thiếu dữ liệu.
3. **Thiếu `ErrorBoundary` toàn cục trong React:**
   - Khi một lỗi JavaScript bất ngờ ném ra trong quá trình render của bất kỳ trang nào, toàn bộ ứng dụng bị crash và biến thành màn hình trắng tinh, không có cơ chế fallback.

## 2. Mục Tiêu (Outcome)
- **Hết 100% hiện tượng màn hình trắng:** Khi bấm vào module Rủi ro thuế, nếu đã có file Sổ NKC thì trang tự động nạp và hiển thị bảng rà soát; nếu chưa có Sổ NKC thì hiển thị banner hướng dẫn nạp rõ ràng.
- **Phòng vệ chủ động bằng ErrorBoundary:** Xây dựng `ErrorBoundary.tsx` bao bọc toàn bộ ứng dụng và từng trang. Nếu có lỗi phát sinh, hiển thị giao diện thông báo lỗi thân thiện kèm nút "Quay về Trang Chủ" thay vì làm trắng màn hình.

## 3. Các Giai Đoạn Triển Khai (Phases)

- [x] **Phase 1: Xây dựng Component `ErrorBoundary.tsx` & Tích hợp vào `App.tsx`**
  - Tạo `src/renderer/components/ErrorBoundary.tsx` (React Class Component chuẩn).
  - Bọc quanh `<Suspense>` và khu vực nội dung chính của `App.tsx`.
  - Hiển thị giao diện thông báo lỗi thanh lịch, nút "Tải lại trang" và "Về Trang Chủ Hub".

- [x] **Phase 2: Bổ sung Auto-load Sổ NKC & `ModuleGateBanner` vào `TaxRiskScannerPage.tsx`**
  - Khai báo `taxrisk: 'BEFORE'` trong `src/domain/nkcRequirements.ts`.
  - Bổ sung `useEffect` tự động nạp Sổ NKC qua `auditAnalyze` (tương tự như `TaxStatsPage.tsx`) và lưu vào `glSnapshot`.
  - Gắn `<ModuleGateBanner requirement="BEFORE" moduleName="Rà soát rủi ro thuế NĐ 181" />` ở đầu trang.
  - Thêm trạng thái `isLoading` kèm spinner `Đang phân tích dữ liệu chi tiền mặt...`.

- [x] **Phase 3: Kiểm thử, Typecheck & Xác nhận không hồi quy**
  - Chạy `npx vitest run tests/hub-navigation.test.ts tests/nkc-requirements.test.ts`.
  - Chạy `npx tsc -p tsconfig.web.json --noEmit`.
  - Xác nhận điều hướng mượt mà từ Hub sang `taxrisk`.
