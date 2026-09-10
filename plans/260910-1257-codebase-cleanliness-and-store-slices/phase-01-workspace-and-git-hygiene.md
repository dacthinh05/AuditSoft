---
title: "Phase 1: Workspace & Git Hygiene (.gitignore và dọn dẹp file tạm)"
description: "Bổ sung các đường dẫn file tạm vào .gitignore và dọn dẹp các thư mục đầu ra thử nghiệm trên ổ đĩa."
status: planned
priority: P1
effort: "0.3h"
tags: ["gitignore", "workspace", "hygiene", "cleanup"]
created: 2026-09-10
---

# Phase 1: Workspace & Git Hygiene (.gitignore và dọn dẹp file tạm)

## Context & Objectives

Trong quá trình chạy kiểm thử và phát triển các phân hệ kiểm toán, một số thư mục và tệp tin tạm thời sinh ra trên đĩa:
- `output_test_glv/`: Thư mục chứa 12 file Excel sinh ra khi chạy test `workingpaper.test.ts`.
- `~conv_*`: File tạm sinh ra khi chuyển đổi .xls sang .xlsx.
- Các file log hoặc build cache cục bộ.

Nếu không đưa vào `.gitignore`, các file này liên tục xuất hiện trong `git status`, làm loãng thông tin và gây bừa bộn working tree.

## Detailed Tasks

### 1. Cập nhật `.gitignore`
Thêm các mục sau vào `.gitignore`:
```gitignore
# Test Output & Artifacts
output_test_glv/
output_*/
test_out/
test-out/
*.tmp
~conv_*
```

### 2. Dọn dẹp các thư mục tạm đang tồn tại trên ổ đĩa
- Xóa thư mục `output_test_glv/` sinh ra trong đợt chạy test vừa qua.
- Kiểm tra và đảm bảo không có file rác nào nằm sai vị trí.

## Verification
- Chạy `git status` xác nhận `output_test_glv/` và các file tạm không còn xuất hiện trong danh sách untracked.
