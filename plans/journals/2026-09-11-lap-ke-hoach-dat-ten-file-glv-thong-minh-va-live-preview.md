# Nhật Ký: Lập Kế Hoạch Đặt Tên File Giấy Làm Việc Thông Minh & Live Preview (Phương Án 3)

**Ngày thực hiện:** 2026-09-11  
**Mục tiêu:** Xây dựng kế hoạch 4 pha nâng cấp tự động hóa đặt tên file và thư mục Giấy làm việc (GLV) thông minh theo chuẩn thực tế kiểm toán, bổ sung Live Preview và tùy chọn phong cách (Siêu gọn vs Chuẩn VACPA).

## Các Hạng Mục Kế Hoạch Đã Soạn Thảo

1. **Thư mục kế hoạch:** `plans/260911-1430-smart-working-paper-filename-and-live-preview/`
2. **Tài liệu các pha chi tiết:**
   - `plan.md`: Tổng quan bối cảnh, kiến trúc luồng dữ liệu, sơ đồ Mermaid và ma trận rủi ro.
   - `phase-01-smart-filename-parser-and-types.md`: Xây dựng module `smartFilenameParser.ts` bóc tách `clientShortName`, `auditPeriodStage`, `fiscalYear`, khử ký tự cấm Windows và mở rộng `EngagementInfo`.
   - `phase-02-backend-ipc-and-generator-integration.md`: Tích hợp vào `generateOutputFileName`, `src/main/index.ts` (sinh thư mục rút gọn `HoSoKiemToan_[TênTắt]_[Đợt]_[Năm]`) và `src/shared/ipc.ts`.
   - `phase-03-ui-add-form-and-live-preview.md`: Giao diện Form ADD tại `WorkingPaperPage.tsx`: ô Tên viết tắt, nút chọn nhanh Đợt D1/D2, toggle phong cách đặt tên và thẻ **Live Preview** thời gian thực.
   - `phase-04-unit-tests-and-end-to-end-verification.md`: Bộ kiểm thử toàn diện Unit Test, kiểm tra khử ký tự cấm và kiểm thử hồi quy 60+ test suites.

3. **Chỉ số kiểm tra trạng thái kế hoạch:**
   - Đã lập chỉ mục thành công vào AgentKit Plan Store (`ak plan show 260911-1430-smart-working-paper-filename-and-live-preview`).
   - Sẵn sàng chuyển giao sang bước thực thi `/ak:cook`.
