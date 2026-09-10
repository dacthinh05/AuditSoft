# Journal: Hoàn Thành Module Phân Tích Cơ Bản Sổ NKC & Thống Kê Thuế GTGT/TNCN

- **Date**: 2026-09-10
- **Author**: AuditSoft Engineering
- **Scope**: `auditsoft-nkc` v1.2.0 (Preliminary Analytical Review & Tax Suite)

## 1. Bối Cảnh & Mục Tiêu
Kiểm toán viên trong mùa bận thường mất rất nhiều thời gian phân tích sơ bộ trên file Excel rời rạc: nhặt chi phí lãi vay để tính khống chế 30% EBITDA theo Nghị định 132/2020/NĐ-CP, quét tìm các giao dịch cho vay/mượn không lãi suất (VSA 550), phân tích tỷ trọng Pareto khách hàng/nhà cung cấp, lập ma trận 12 tháng phát hiện tháng đột biến, và mở từng tờ khai thuế GTGT/TNCN để gõ tay đối chiếu với sổ NKC.
Theo chỉ đạo của người dùng:
- Phần xuất Excel Working Paper tạm gác lại sau để chờ người dùng hoàn thiện file GLV MẪU.
- Tập trung toàn lực vào: Domain Analytics Engines, Lõi kéo thả XML Thuế (tái sử dụng từ `TaxRecord`), và Giao diện Dashboard `PreliminaryAnalyticsPage` trực quan trên ứng dụng.

## 2. Các Thành Phần Đã Triển Khai
1. **Port XML Parsers từ `TaxRecord`**:
   - `src/domain/etax/parsers/VatXmlParser.ts`: Đọc toàn bộ chỉ tiêu [22] đến [43] tờ khai 01/GTGT chuẩn Thông tư 80/2021/TT-BTC.
   - `src/domain/etax/parsers/PitXmlParser.ts`: Đọc chỉ tiêu tờ khai 05/KK-TNCN và 05/QTT-TNCN.
   - `src/domain/etax/ingestion/ZipExtractor.ts` & `LocalXmlIngestionEngine.ts`: Quét và giải nén an toàn các file `.xml` và `.zip` kéo thả vào ứng dụng.
   - `src/shared/types/taxAnalytics.ts`: Kiểu dữ liệu an toàn tiền tệ `BigInt`.
2. **Domain Analytics Engines (Pre-adjustment GL)**:
   - `src/domain/analytics/EbitdaCalculator.ts`: Tính Lãi vay thuần (635 trừ 515), Khấu hao (Có 214), Lợi nhuận thuần HĐKD Mã 30, EBITDA và mức trần 30% (Chỉ tiêu B4).
   - `src/domain/analytics/RelatedPartyScanner.ts`: Quét các khoản cho vay (128/1388) hoặc mượn vốn (341/3388) 0% lãi suất, tạm ứng 141 tồn đọng lớn.
   - `src/domain/analytics/ConcentrationAnalyzer.ts`: Phân tích Pareto Top 10 Khách hàng (TK 511) và Top 10 Nhà cung cấp (TK 15x, 6xx, 331).
   - `src/domain/analytics/Trend12MAnalyzer.ts`: Ma trận 12 tháng x 8 tài khoản trọng yếu, tính MoM % và phát hiện tháng đột biến.
   - `src/domain/analytics/TaxCrossReconciler.ts`: Đối chiếu số liệu Thuế vs Sổ NKC (Doanh thu thuế vs Có 511, Thuế đầu ra vs Có 33311, Lương TNCN vs Nợ 334).
3. **Giao Diện Dashboard & IPC**:
   - `src/renderer/config/modulesRegistry.ts`: Đăng ký module `#05: Phân Tích Cơ Bản` (view: `'analytics'`).
   - `src/renderer/App.tsx`: Tích hợp hiển thị `PreliminaryAnalyticsPage` vào vùng làm việc chính.
   - `src/renderer/components/Analytics/PreliminaryAnalyticsPage.tsx`: Màn hình điều khiển chính với 2 sub-tab mượt mà.
   - `src/renderer/components/Analytics/GlAnalyticsTab.tsx`: 5 Thẻ KPI nổi bật, Bảng tính EBITDA, Bảng Bên liên quan, Bảng Pareto Khách hàng/NCC, Ma trận 12 tháng.
   - `src/renderer/components/Analytics/TaxAnalyticsTab.tsx`: Dropzone nhận file XML/ZIP, Bảng Thống kê Thuế GTGT và TNCN, Bảng Chênh lệch đối chiếu chéo.

## 3. Nghiệm Thu & Kiểm Thử
- **Unit Tests**: 100% (42/42 test files, 230/230 tests passed).
- **TypeScript Typecheck**: 0 errors across web, node, và test configurations.
- **ESLint**: 0 errors, 0 warnings.
- **Vite & Node Build**: Hoàn tất thành công gói bundle sản phẩm.
