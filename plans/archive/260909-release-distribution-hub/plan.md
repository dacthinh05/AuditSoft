---
title: "Thiết lập Kênh Phân phối Bản phát hành & Auto-Update GitHub (Bảo mật Mã nguồn)"
description: "Tách biệt hoàn toàn mã nguồn khỏi GitHub public repo dacthinh05/AuditSoft. Chỉ đưa version.json, README.md và GitHub Releases (Setup.exe & Portable.exe) lên GitHub phục vụ cơ chế tự động cập nhật."
status: completed
priority: P1
effort: "2h"
tags: ["git", "release", "auto-update", "security", "distribution"]
created: 2026-09-09
---

# Thiết lập Kênh Phân phối Bản phát hành & Auto-Update GitHub (Bảo mật Mã nguồn)

## Overview
Dự án cần phát hành phiên bản và kích hoạt tính năng Tự động Cập nhật (Auto-Update) qua GitHub repository `https://github.com/dacthinh05/AuditSoft/`.
Tuy nhiên, mã nguồn của ứng dụng là tài sản sở hữu trí tuệ đóng, **tuyệt đối không được đẩy lên GitHub public**.
File thực thi `.exe` (>70MB) cũng không thể commit vào Git tree (tránh vi phạm giới hạn 100MB của GitHub).

Giải pháp là biến repository GitHub `dacthinh05/AuditSoft` thành **Public Release & Update Hub**:
1. Nhánh `main`: Chỉ chứa duy nhất `version.json` (để app kiểm tra bản mới) và `README.md` (giới thiệu phần mềm, link tải).
2. GitHub Releases: Chứa các file cài đặt `AuditSoft-0.1.0-Setup.exe` và `AuditSoft-0.1.0-Portable.exe`.
3. Thư mục mã nguồn local: Ngắt kết nối trực tiếp với remote public để loại bỏ 100% nguy cơ vô tình push lộ source.
4. Cung cấp công cụ phát hành tự động 1-click `Phat-Hanh-Ban-Moi.bat`.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Bảo vệ mã nguồn: Cô lập git source code, ngăn chặn tuyệt đối lộ source lên GitHub | P1 |
| 2 | Khởi tạo distribution repo chỉ gồm `version.json` và `README.md` trên `origin/main` | P1 |
| 3 | Đóng gói bản cài đặt Setup.exe và Portable.exe v0.1.0 sẵn sàng phát hành | P1 |
| 4 | Thiết lập script phát hành 1-click `Phat-Hanh-Ban-Moi.bat` và tài liệu hướng dẫn Release | P1 |
| 5 | Kiểm thử tích hợp: URL raw version.json và cơ chế Auto-Update của app | P1 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Cô lập Mã nguồn & Chuẩn bị Staging Phân phối](./phase-01-isolate-source-and-stage-distribution.md) | Completed |
| 2 | [Phase 2: Đóng gói EXE/Portable & Khởi tạo Release Hub](./phase-02-package-and-push-release-hub.md) | Completed |
| 3 | [Phase 3: Tạo Công cụ Phát hành 1-Click & Kiểm thử Updater](./phase-03-release-tooling-and-verification.md) | Completed |

## Success Criteria

- [x] Remote `origin` không trỏ trực tiếp từ thư mục mã nguồn đầy đủ lên GitHub public, hoặc có cơ chế bảo vệ ngăn push source.
- [x] Nhánh `main` của `https://github.com/dacthinh05/AuditSoft` chỉ có `version.json` và `README.md` chuyên nghiệp.
- [x] File thực thi `AuditSoft-0.1.0-Setup.exe` và `AuditSoft-0.1.0-Portable.exe` được đóng gói thành công.
- [x] Có script phát hành tự động tiện lợi cho các phiên bản tiếp theo (`Phat-Hanh-Ban-Moi.bat`).
- [x] Endpoint `https://raw.githubusercontent.com/dacthinh05/AuditSoft/main/version.json` hoạt động chính xác.
