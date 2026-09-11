# Plan: Khắc Phục Triệt Để Độ Lệch Thuyết Minh BCTC & Cân Đối 100% Chi Phí Theo Yếu Tố (VAS 01 / TT 200)

## 1. Bối Cảnh & Nguyên Nhân Gốc Rễ (Problem & Root Cause)
Trên màn hình **Ma Trận Chi Phí Theo Yếu Tố 12 Tháng & Cân Đối Thuyết Minh BCTC (Mục 28 Thông tư 200)**, hệ thống đang báo lệch **`-2.502.637.184 đ`** (cảnh báo đỏ):
1. **Thiếu số dư kho 154 và 155:**
   - Trong bảng đối chiếu cột bên phải:
     - `Chi phí SXKD dở dang đầu năm (TK 154 ĐK)`: hiển thị `-` (0 đ).
     - `Tồn kho thành phẩm đầu năm (TK 155 ĐK)`: hiển thị `-` (0 đ).
     - `Chi phí SXKD dở dang cuối năm (TK 154 CK)`: hiển thị `(-)` (0 đ).
     - `Tồn kho thành phẩm cuối năm (TK 155 CK)`: hiển thị `(-)` (0 đ).
   - **Nguyên nhân:** Backend `AnalysisPipeline.ts` đã đọc xong CĐSPS nhưng không gửi `trialBalance` sang frontend; `PreliminaryAnalyticsPage.tsx` gọi `FinancialCorrelationEngine.analyze(entries, incomeStatement)` mà không truyền `cdfsAccounts`. Vì không có số dư kho, biến động tồn kho bị coi bằng 0.
2. **Phương trình kế toán cân đối Thuyết minh (VAS 01 / Thông tư 200):**
   $$\text{Chi phí P&L (Nợ 632 + 641 + 642)} = \text{Tổng 5 yếu tố} + \Delta\text{Kho 154 (ĐK - CK)} + \Delta\text{Kho 155 (ĐK - CK)} + \text{Giá vốn 156}$$
   - Nếu có bảng CĐSPS $\rightarrow$ lấy chính xác số dư ĐK và CK của 154, 155.
   - Nếu file NKC độc lập không có sheet CĐSPS $\rightarrow$ **Cơ chế suy diễn thông minh từ dòng luân chuyển trên NKC:**
     - $\Delta\text{Kho 154} = \text{Tổng Nợ 154} - \text{Tổng Có 154}$
     - $\Delta\text{Kho 155} = \text{Tổng Nợ 155} - \text{Tổng Có 155}$
     - Khi đó phương trình kế toán sẽ triệt tiêu chênh lệch và **cân bằng tuyệt đối 0 đ**.

- [x] **Phase 1: Mở rộng `AnalysisResult` trả về `trialBalance` & DTO hoá sang Frontend**
  - Trong `src/shared/types/analytics.ts`: Mở rộng `AnalysisResult` thêm trường `trialBalance: TrialBalanceRowDTO[]`.
  - Trong `src/main/AnalysisPipeline.ts`: Gửi mảng `trialBalance` sang renderer.
  - Trong `src/renderer/components/Analytics/analyticsMappers.ts`: Tạo mapper chuyển `TrialBalanceRowDTO` sang `Map<string, CdfsAccountRow>`.

- [x] **Phase 2: Nâng cấp `ExpenseByNatureEngine.ts` — Thuật toán cân đối kho thông minh**
  - Tự động trích xuất `deltaWip154` và `deltaFinished155` từ NKC nếu `cdfsAccounts` không có số dư.
  - Tinh chỉnh bóc tách 5 yếu tố phát sinh chi phí đảm bảo không sót và không tính trùng các bút toán kết chuyển.
  - Cập nhật `FinancialCorrelationEngine.ts` nhận tham số `cdfsAccounts`.

- [x] **Phase 3: Cập nhật UI `ExpenseByNatureTable.tsx` & `PreliminaryAnalyticsPage.tsx`**
  - Truyền `cdfsAccounts` từ kết quả phân tích vào `FinancialCorrelationEngine.analyze`.
  - Hiển thị rõ số tiền $\Delta\text{154}$ và $\Delta\text{155}$ trên bảng Thuyết minh BCTC.
  - Nếu độ lệch $= 0$, hiển thị badge xanh lá `✓ Cân đối hoàn hảo (0 đ)`.

- [x] **Phase 4: Kiểm thử, Typecheck & Xác thực toán học**
  - Viết unit test xác thực phương trình cân đối Thuyết minh BCTC (`tests/expense-by-nature-balance.test.ts`).
  - Chạy `npx tsc -p tsconfig.web.json --noEmit` & `vitest run`.
