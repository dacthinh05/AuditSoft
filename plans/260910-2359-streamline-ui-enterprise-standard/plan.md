---
title: "Tinh Giản & Chuyên Nghiệp Hóa Giao Diện AuditSoft (Enterprise SaaS UI: Bỏ Icon / Emoji, Tối Ưu UX)"
description: "Dọn dẹp triệt để các emoji màu mè trên nút bấm, tiêu đề tab và modal, thay thế bằng Icon SVG thanh mảnh chuyên nghiệp (Lucide/Linear standard), đồng thời nâng cấp trải nghiệm người dùng tổng thể."
status: planned
priority: P1
effort: 3h
branch: main
tags:
  - ui-design
  - enterprise-saas
  - clean-ui
  - zero-emoji
  - icons-refactor
created: 2026-09-10
---

# Kế Hoạch Triển Khai: Tinh Giản Giao Diện & Dọn Dẹp Icon / Emoji Màu Mè

## 1. Bối Cảnh & Vấn Đề Cần Cải Thiện (Executive Summary)

AuditSoft là phần mềm chuyên dụng dành cho **Kiểm toán viên độc lập (Auditors)**, làm việc trực tiếp với Báo cáo tài chính và đối soát dữ liệu doanh nghiệp.
- **Vấn đề hiện tại**:
  1. Giao diện xuất hiện nhiều **emoji màu sắc kiểu chat/mạng xã hội** (`🚀, ✨, 🔥, 🎯, 📋, 🏛, 🔄, 📅, ⚖, 📈, 📉, 💡, 🔒, 📥, 📂, 📖, ⚡, 🙈, 👁️`) tại các thanh Tab, Nút bấm hành động và Modal.
  2. Việc lạm dụng emoji khiến giao diện trông giống các công cụ nghiệp dư/cá nhân, làm giảm tính nghiêm túc và uy tín của một bộ công cụ kiểm toán doanh nghiệp (Enterprise Audit Suite).
  3. Thiếu sự đồng bộ: chỗ thì dùng icon SVG vector (`IconFileSpreadsheet`, `IconLayers`), chỗ thì lại dùng emoji Unicode render lệch màu giữa các phiên bản Windows.

- **Mục tiêu đạt được (Outcome)**:
  - **Zero Emoji trong UI chính**: Loại bỏ 100% emoji màu mè, thay thế hoàn toàn bằng **Icon SVG Vector tối giản, đơn sắc (Monochrome / Dual-tone thanh lịch)** theo chuẩn Enterprise SaaS (Linear, Stripe, Datadog).
  - Tối ưu các điểm chạm UX: Thay nút chữ emoji thành Button chuyên nghiệp với nhãn rõ ràng, badge trạng thái tinh tế.

---

## 2. Ràng Buộc & Tiêu Chí Nghiệm Thu (Constraints & Acceptance Criteria)

### Constraints:
- Không làm thay đổi logic nghiệp vụ, tính toán hay IPC bridge của ứng dụng.
- Tận dụng tối đa bộ icon SVG có sẵn trong `src/renderer/components/Icons.tsx` (hoặc bổ sung các SVG nhẹ nhàng tương ứng).
- Không phát sinh layout shift hoặc vỡ padding trên các màn hình nhỏ.

### Acceptance Criteria:
1. `AuditPage.tsx`:
   - 8 Tabs chức năng (`risks`, `journals`, `accounts`, `pairs`, `monthly`, `recon`, `kqkd`, `chiphi`) dùng SVG icon thanh mảnh thay cho emoji (`🎯`, `📋`, `🏛`, `📈`...).
2. `AiAuditAdvisorPanel.tsx` & `AiConfigModal.tsx`:
   - Thay emoji `✨`, `💡`, `📊`, `⚙️`, `🙈`, `👁️`, `⚡`, `📖` bằng SVG vector tinh tế.
   - Nút *"Tạo nhận xét kiểm toán"* và *"Phân tích lại"* có diện mạo chuyên nghiệp.
3. `B410DropZone.tsx` & `WorkingPaperPage.tsx`:
   - Nút *"Bắt đầu tổng hợp B410"* bỏ `🚀`, `⏳`. Thay thế bằng SVG Spinner hoặc Checkicon.
   - Dropzone bỏ emoji `📥`, `📂`, dùng `IconFileSpreadsheet` và `IconFolder`.
4. `CogsMatrix12MTable.tsx`:
   - Nút chuyển đổi chế độ bỏ emoji `⚙️`, `📒`. Dùng badge chữ dạng Segmented Controls sạch đẹp.
5. 100% build, typecheck, linting và vitest test suite đều pass.

---

## 3. Các Giai Đoạn Thực Hiện (Phased Execution)

| Phase | Tên Giai Đoạn | Tệp Tin Tác Động Chính |
|---|---|---|
| **Phase 1** | Bổ sung các SVG Icon thanh mảnh vào Icons.tsx | `src/renderer/components/Icons.tsx` |
| **Phase 2** | Dọn dẹp emoji trên AuditPage & CogsMatrix & Stepper | `src/renderer/audit/AuditPage.tsx`<br>`src/renderer/components/Analytics/CogsMatrix12MTable.tsx`<br>`src/renderer/components/AuditWorkflowStepper.tsx` |
| **Phase 3** | Dọn dẹp emoji trên AI Advisor & B410 & WorkingPaper | `src/renderer/components/Analytics/AiAuditAdvisorPanel.tsx`<br>`src/renderer/components/Settings/AiConfigModal.tsx`<br>`src/renderer/components/B410Consolidation/B410DropZone.tsx`<br>`src/renderer/pages/WorkingPaperPage.tsx` |
| **Phase 4** | Kiểm thử, Typecheck, Linting & Nghiệm thu toàn diện | `npm run typecheck`<br>`npm run lint`<br>`npm test`<br>`npm run build` |
