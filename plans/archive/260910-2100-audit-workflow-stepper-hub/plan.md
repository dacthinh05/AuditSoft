---
title: "Tích hợp Audit Workflow Stepper (Thanh Lộ Trình 4 Bước Kiểm Toán Chuẩn VSA) trên Trang Chủ Hub"
date: "2026-09-10"
status: "completed"
mode: "standard"
tags:
  - ux
  - hub
  - workflow
  - stepper
  - vsa
---

# Kế Hoạch Triển Khai: Audit Workflow Stepper trên Trang Chủ Hub

## 1. Bối cảnh & Mục tiêu (Outcome)
Người dùng khi mở ứng dụng AuditSoft tại Trang Chủ (Hub) hiện tại chỉ thấy danh sách thẻ các phân hệ ngang hàng được xếp theo mã số kỹ thuật (#01 B410, #02 NKC, #03 VSA 530...), chưa có kim chỉ nam định hướng cho một ca kiểm toán mới: **"Bắt đầu từ đâu, đi qua những bước nào để hoàn thành hồ sơ?"**

Mục tiêu của kế hoạch này là bổ sung khối **Audit Workflow Stepper (Thanh Lộ Trình 4 Bước Kiểm Toán Thực Chiến VSA)** đặt trang trọng ngay phía trên danh sách module:
- **Bước 1: Nạp & Đối Chiếu NKC** (`viewKey: 'setup'`) — Khởi tạo hồ sơ, so khớp trước/sau hoặc nạp file gốc.
- **Bước 2: Phân Tích & Rà Soát Thuế** (`viewKey: 'analytics'` hoặc `'taxstats'`) — Phân tích biến động 12M, chỉ số tài chính VSA 520, thuế GTGT/TNCN.
- **Bước 3: Trọng Yếu & Bốc Mẫu VSA** (`viewKey: 'sampling'`) — Xác định OM/PM/CTT theo VSA 320, bốc mẫu phát sinh VSA 530 & Cutoff.
- **Bước 4: Sinh 12 GLV & B410** (`viewKey: 'workingpaper'` hoặc `'b410'`) — Tự động điền 12 Giấy làm việc VACPA & tổng hợp bảng sai sót B410.

Người dùng có thể:
1. Nhìn thấy toàn cảnh luồng công việc kiểm toán chuẩn hóa.
2. Bấm trực tiếp vào từng bước để chuyển ngay tới phân hệ tương ứng.
3. Thấy trạng thái hoàn thành / dữ liệu đã nạp (nếu có) thông qua badge tín hiệu nhẹ nhàng.

---

## 2. Ràng buộc & Giới hạn (Constraints & Non-goals)

### Constraints:
- Sử dụng các `viewKey` chuẩn mực đã có trong hệ thống (`setup`, `analytics`, `taxstats`, `sampling`, `workingpaper`, `b410`).
- Tương thích 100% với hệ thống responsive hiện có (màn hình nhỏ co về dạng 2 cột / dạng cuộn ngang nhẹ nhàng).
- Không làm ảnh hưởng tới thanh tìm kiếm và bộ lọc danh mục phân hệ phía dưới.
- Giữ nguyên tone màu và ngôn ngữ thiết kế tối giản, chuyên nghiệp chuẩn kiểm toán của AuditSoft.

### Non-goals:
- Không bắt buộc (hard-lock) người dùng phải hoàn thành bước 1 mới được bấm bước 2; KTV vẫn có toàn quyền tự do nhảy vào bất kỳ bước nào họ muốn.
- Không thay đổi logic nghiệp vụ bên trong các phân hệ con.

---

## 3. Tiêu chí nghiệm thu (Acceptance Criteria)
1. Component `AuditWorkflowStepper` được hiển thị rõ ràng, thanh lịch ngay trên Trang Chủ Hub.
2. Hiển thị đủ 4 bước tuần tự có đánh số (01 $\rightarrow$ 02 $\rightarrow$ 03 $\rightarrow$ 04), tên bước, mục tiêu cốt lõi và mũi tên liên kết giữa các bước.
3. Bấm vào mỗi bước chuyển trang chính xác đến phân hệ tương ứng mà không gặp lỗi điều hướng.
4. CSS responsive mượt mà trên cả màn hình laptop (1366x768) lẫn màn hình lớn (1920x1080).
5. Toàn bộ test suite Vitest, typecheck, linting và build production đạt **100% Pass (0 lỗi)**.

---

## 4. Các giai đoạn thực hiện (Phased Execution)

* **Phase 1: Xây dựng Component `AuditWorkflowStepper.tsx` & tích hợp vào `HubPage.tsx`**
  - Tạo component độc lập `src/renderer/components/AuditWorkflowStepper.tsx`.
  - Kết nối với Zustand store (`useApp`) để lấy trạng thái dữ liệu (đã nạp NKC chưa, đã bốc mẫu chưa) và kích hoạt `setView`.
  - Nhúng vào `HubPage.tsx` bên dưới Hero Banner và phía trên Module Grid.

* **Phase 2: Thiết kế giao diện & CSS Styling chuyên nghiệp (`styles.css`)**
  - Layout Grid 4 cột có đường dẫn dòng chảy (connecting arrows / stepper flow).
  - Trạng thái hover, active và hiệu ứng ánh sáng nhẹ (subtle border glow).
  - Tích hợp badge "Khuyến nghị bắt đầu ca mới" tinh tế.
  - Tinh chỉnh Responsive breakpoint cho các kích thước màn hình khác nhau.

* **Phase 3: Kiểm thử, Tự động hóa & Xác nhận (Testing & Verification)**
  - Viết unit/integration test trong `tests/audit-workflow-stepper.test.ts`.
  - Chạy `npm run typecheck`, `npm run lint`, `npm run test` và `npm run build`.
