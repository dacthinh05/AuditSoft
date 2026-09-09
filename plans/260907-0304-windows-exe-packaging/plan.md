---
title: "Đóng gói ứng dụng AuditSoft NKC thành file thực thi (.exe) Windows"
description: "Kế hoạch cấu hình electron-builder, xử lý worker thread và tạo cả 2 bản Setup Installer cùng Portable EXE"
status: completed
priority: P1
effort: "2h"
tags: [electron, packaging, windows, exe, portable, nsis]
created: 2026-09-07
---

# Kế hoạch đóng gói AuditSoft NKC (.exe Windows)

## Overview
Dự án **AuditSoft NKC** là ứng dụng desktop (Electron 33 + Vite 5 + React 18). Kế hoạch này triển khai **Phương án 3 (Bản Kép)** để đóng gói ứng dụng thành file thực thi `.exe` trên Windows 10/11 x64, cung cấp đồng thời:
1. **Bản Portable (.exe chạy ngay):** Không cần cài đặt, nhấp đúp là mở, thích hợp lưu trên USB hoặc gửi Zalo/Drive chạy ngay.
2. **Bản Setup Installer (.exe cài đặt):** Bộ cài đặt NSIS tiêu chuẩn với wizard chọn thư mục, tạo shortcut Desktop và Start Menu.
3. **Đóng gói đầy đủ tài nguyên GLV MAU & Worker Threads:** Đảm bảo tính năng đối chiếu và xuất giấy làm việc kiểm toán chạy độc lập không phụ thuộc môi trường dev.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Cấu hình `package.json` hỗ trợ cả 2 target `nsis` và `portable`, đính kèm thư mục `GLV MAU` qua `extraResources` | P1 |
| 2 | Khắc phục đường dẫn Worker Threads (`reconcile.worker.js`, `export.worker.js`) và nạp template `GLV MAU` trong môi trường asar packaged | P1 |
| 3 | Xây dựng kịch bản đóng gói tự động 1-click (.bat) cho người dùng Windows | P2 |
| 4 | Build thử nghiệm thực tế, xác minh dung lượng, tính toàn vẹn và smoke test file `.exe` | P1 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Cấu hình Build Target và Tài nguyên Đóng gói](./phase-01-start.md) | Pending |
| 2 | [Phase 2: Chuẩn hóa Worker Threads & Đường dẫn Template](./phase-02-runtime-fixes.md) | Pending |
| 3 | [Phase 3: Tự động hóa Quy trình Đóng gói (Script 1-Click)](./phase-03-build-scripts.md) | Pending |
| 4 | [Phase 4: Thực thi Build và Nghiệm thu Toàn diện](./phase-04-verification.md) | Pending |

## Success Criteria

- [ ] Lệnh đóng gói tạo thành công cả 2 file `.exe` (Setup và Portable) trong thư mục `installer/`.
- [ ] Ứng dụng chạy từ file `.exe` hiển thị đúng giao diện, icon và nhận dạng bản quyền / Machine ID.
- [ ] Thư mục `GLV MAU` được nạp đầy đủ trong file cài đặt; tính năng tạo giấy làm việc kiểm toán không báo lỗi thiếu file.
- [ ] Tiến trình Worker Threads (`node:worker_threads`) khởi chạy trơn tru khi chạy đối chiếu dữ liệu lớn.

<!-- slug: windows-exe-packaging -->
