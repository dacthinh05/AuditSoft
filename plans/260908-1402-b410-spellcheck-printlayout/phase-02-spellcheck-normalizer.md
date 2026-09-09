---
phase: 2
status: completed
priority: P1
effort: "4h"
dependencies: [1]
---

# Phase 2: Text & Spellcheck Normalizer

## Overview
Xây dựng hàm chuẩn hóa nội dung văn bản trước/sau khi copy sang Master nhằm xử lý lỗi gõ phím, lỗi dấu câu và thống nhất chuẩn Unicode tiếng Việt.

## Requirements
- Functional:
  - Chuẩn hóa Unicode sang dạng NFC (`IsNormalized(FormC)`).
  - Chuẩn hóa khoảng trắng sau dấu câu: dấu chấm `.`, phẩy `,`, hai chấm `:`, chấm phẩy `;` phải có 1 dấu cách phía sau.
  - Xóa khoảng trắng thừa (Double spaces, khoảng trắng đầu/cuối dòng).
  - Tự động sửa các lỗi chính tả phổ biến trong kiểm toán (`hoá đơn` -> `hóa đơn`, `chứng từ` -> `chứng từ`).
- Non-functional: Giữ nguyên các định dạng Rich Text cơ bản hoặc áp dụng chuẩn hóa trên chuỗi text.

## Implementation Steps
1. Viết hàm `Normalize-AuditText` trong PowerShell (hoặc TypeScript trước khi đẩy vào nếu dùng cell-level).
2. Khi duyệt qua ô nội dung Thực trạng (cột D) và Hướng xử lý (cột F), áp dụng hàm chuẩn hóa.
3. Kiểm tra các trường hợp gõ lỗi như dính từ `năm.như sau:` -> `năm. Như sau:`.

## Success Criteria
- [x] Câu chữ trong file Master đọc mượt mà, không bị lỗi font ô vuông hay khoảng trắng lộn xộn.