---
title: "Tái định vị Thương hiệu AuditSoft & Tự động Cập nhật Phiên bản"
description: "Chuyển dịch nhận diện từ công cụ hẹp NKC sang Hệ thống Trợ lý Kiểm toán Toàn diện (Audit Suite), gỡ bỏ nhãn NKC, và xây dựng hệ thống Auto-Update kiểm tra phiên bản mới tự động kèm thông báo/changelog."
status: pending
priority: P1
effort: "4h"
tags: ["ui", "branding", "auto-update", "electron", "ipc"]
created: 2026-09-08
---

# Tái định vị Thương hiệu AuditSoft & Tự động Cập nhật Phiên bản

## Overview
Kế hoạch này thực hiện 2 mục tiêu lớn:
1. **Tái định vị thương hiệu (Brand & Label):** Xóa bỏ hoàn toàn ấn tượng phần mềm chỉ phục vụ đối chiếu Nhật ký chung (NKC). Chuyển định vị sang **AuditSoft — Hệ thống Trợ lý Kiểm toán Toàn diện** (Audit Suite), phản ánh đầy đủ năng lực: Đối chiếu NKC, Bốc mẫu kiểm toán VSA 530, và Lập 12 Giấy làm việc tự động.
2. **Cơ chế Tự động Cập nhật (Auto-Update Engine & Notification):** Xây dựng hệ thống tự động kiểm tra phiên bản mới từ Remote Manifest khi mở app và kiểm tra thủ công. Cung cấp UI thông báo có bản cập nhật tinh tế, popup hiển thị Changelog và liên kết 1-click tải trực tiếp bản Setup Installer / Portable.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Đồng bộ nhận diện thương hiệu AuditSoft Audit Suite trên toàn bộ UI, Logo, Title bar, Subtitle và Modal | P1 |
| 2 | Xây dựng Auto-Update Engine trong Electron Main process (IPC bridge, Remote manifest check, Semantic Versioning) | P1 |
| 3 | Xây dựng giao diện Update Notification (Status badge trên Header, Update Modal hiển thị Changelog, nút tải bản mới) | P1 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Re-brand UI & Labels](./phase-01-start.md) | Pending |
| 2 | [Phase 2: Auto-Update Engine (Backend & IPC)](./phase-02-auto-update-engine.md) | Pending |
| 3 | [Phase 3: Update UI & Verification](./phase-03-update-ui-and-verification.md) | Pending |

## Success Criteria

- [ ] Toàn bộ logo, badge, subtitle và thanh tiêu đề chuyển sang `AuditSoft` (loại bỏ nhãn `NKC` gò bó).
- [ ] Header hiển thị badge phiên bản (VD: `v0.1.0`) kèm trạng thái cập nhật.
- [ ] Khi có thông báo phiên bản mới từ remote endpoint, badge tự động phát sáng và cho phép mở modal xem chi tiết.
- [ ] Modal cập nhật hiển thị đầy đủ thông tin: Phiên bản mới, ngày phát hành, danh sách cải tiến (Changelog), nút tải bản Setup & Portable.
- [ ] Hoạt động mượt mà ở chế độ offline, không gây đơ lag hay hiện popup lỗi khó chịu cho KTV.
- [ ] TypeScript typecheck (`npm run typecheck`) và Vite build (`npm run build`) hoàn tất 100% không lỗi.

<!-- slug: rebrand-audit-suite-and-auto-update -->
