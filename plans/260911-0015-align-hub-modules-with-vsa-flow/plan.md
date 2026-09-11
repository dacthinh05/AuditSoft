# Plan: Tái Cấu Trúc Thứ Tự Nghiệp Vụ & Đồng Bộ Hub Modules Với 4 Giai Đoạn VSA

## 1. Bối Cảnh & Vấn Đề (Problem & Context)
Người dùng phát hiện mâu thuẫn lớn giữa **Dải 4 bước tiến trình kiểm toán (AuditWorkflowStepper)** và **Lưới các phân hệ (MODULES_REGISTRY trên HubPage)**:
- Dải trên đang hướng dẫn người dùng đi theo lộ trình:
  - Giai đoạn 1: Khởi tạo & Nạp sổ sách (NKC/CĐPS)
  - Giai đoạn 2: Rà soát & Phân tích (VSA 520, Thuế GTGT/TNCN)
  - Giai đoạn 3: Xác định Trọng yếu & Bốc mẫu (VSA 320, VSA 530)
  - Giai đoạn 4: Lập hồ sơ kiểm toán & Tổng hợp sai sót (15 GLV, Tổng hợp B410)
- Nhưng lưới thẻ bên dưới (`MODULES_REGISTRY`) lại sắp xếp lộn xộn:
  - **#01** lại là `Tổng Hợp B410` (việc kết thúc hồ sơ kiểm toán lại đập vào mắt đầu tiên).
  - **#02** là `Đối Chiếu 2 Sổ NKC` (việc nạp đầu vào lại nằm sau việc kết thúc).
  - **#03** là `Chọn Mẫu VSA 530`
  - **#04** là `Chuyển Đổi Tờ Khai eTax TT 80` (tiện ích chuyển đổi XML lại nằm xen vào giữa luồng nghiệp vụ).
  - **#05** và **#06** là `Phân Tích Sổ NKC (VSA 520)` và `Thống Kê Thuế` (đáng ra làm ngay ở bước 2 thì bị dồn xuống đáy).
  - **#07** `Lập 15 Giấy Làm Việc` (Working Paper) và **#08** `Rà Soát Rủi Ro Thuế` nằm khuất phía sau.

## 2. Mục Tiêu (Outcome)
Đồng bộ hóa 100% logic hiển thị giữa **AuditWorkflowStepper** và **MODULES_REGISTRY**:
1. Đánh số mã phân hệ (`code`) và sắp xếp thứ tự các thẻ trên Hub khớp hoàn toàn với tiến trình 4 Giai đoạn VSA.
2. Gom nhóm/phân cấp rõ ràng:
   - **Nhóm 1 (Giai đoạn 1): Tiếp nhận & Đối chiếu dữ liệu** (#01: Đối Chiếu 2 Sổ NKC / Nạp Sổ).
   - **Nhóm 2 (Giai đoạn 2): Phân tích sơ bộ & Rà soát thuế** (#02: Phân Tích Sổ NKC - VSA 520 & Đồ Thị, #03: Thống Kê Thuế GTGT/TNCN & Đối Chiếu Sổ, #04: Rà Soát Rủi Ro Chi Phí Thuế NĐ 181).
   - **Nhóm 3 (Giai đoạn 3): Trọng yếu & Kiểm tra chi tiết** (#05: Chọn Mẫu VSA 530 - Bốc Mẫu Kiểm Toán).
   - **Nhóm 4 (Giai đoạn 4): Lập hồ sơ & Báo cáo kết thúc** (#06: Lập 15 Giấy Làm Việc Tự Động, #07: Tổng Hợp B410 - Bảng Sai Sót Kiểm Toán).
   - **Nhóm Tiện ích phụ trợ**: #08: Chuyển Đổi Tờ Khai eTax TT 80 (chuyển về đúng nhóm Tiện ích thuế).
3. Đảm bảo các link điều hướng (buttons) ở Stepper tương ứng trực tiếp và chính xác với mã code / vị trí thẻ bên dưới.

## 3. Các Giai Đoạn Triển Khai (Phases)

- [x] **Phase 1: Sắp xếp lại thứ tự & Đánh số mã `MODULES_REGISTRY`**
  - Cập nhật file `src/renderer/config/modulesRegistry.ts`.
  - Đổi lại thứ tự mảng và trường `code: '01'`, `'02'`, ... theo đúng tiến trình kiểm toán VSA:
    - 01: `reconcile_nkc` (Đối Chiếu & Nạp Sổ NKC)
    - 02: `analytics_vsa520` (Phân Tích Sổ NKC - VSA 520)
    - 03: `tax_stats_vsa520` (Thống Kê Thuế GTGT/TNCN)
    - 04: `tax_risk_scanner` (Rà Soát Rủi Ro Chi Phí Thuế NĐ 181)
    - 05: `sampling_vsa530` (Chọn Mẫu VSA 530)
    - 06: `wp_generator` (Lập 15 Giấy Làm Việc)
    - 07: `b410` (Tổng Hợp B410 - Bảng Tổng Hợp Sai Sót)
    - 08: `etax_qtt03` (Chuyển Đổi Tờ Khai eTax TT 80)
    - 09: `ai_audit_copilot` (Trợ Lý AI Soát Xét BCTC)

- [x] **Phase 2: Đồng bộ nhãn và số lượng Giấy làm việc trong `AuditWorkflowStepper.tsx`**
  - Đồng bộ text ở Bước 04: Đổi `Lập 12 Giấy Làm Việc` $\rightarrow$ `Lập 15 Giấy Làm Việc` (vì module #06 hiện tại đã sinh 15 file chuẩn VACPA).
  - Khớp badge giai đoạn VSA hiển thị trên Hub để người dùng biết Card nào phục vụ Giai đoạn nào.

- [x] **Phase 3: Cập nhật Unit Tests & Typecheck**
  - Chạy `npm test` và cập nhật các file test liên quan (`tests/hub-navigation.test.ts`, `tests/audit-workflow-stepper.test.ts`).
  - Đảm bảo `npx tsc -p tsconfig.web.json --noEmit` pass 100%.
