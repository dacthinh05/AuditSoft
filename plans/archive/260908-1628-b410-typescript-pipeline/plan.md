---
title: "Kiến Trúc Parse → Normalize → Render TypeScript Cho Module B410"
description: "Tái kiến trúc hoàn toàn module B410 sang TypeScript thuần túy chạy trong Node.js (in-memory) bằng ExcelJS: nhận diện sheet thông minh, bộ lọc shape/ảnh độc lập, chuẩn hóa B410Issue[], tính toán RowHeight chống đè ảnh, render Master chuẩn cấu trúc 4 cột có merge và cách 1 hàng trống 12.75pt, kèm bộ unit test toàn diện."
status: pending
priority: P1
effort: "4h"
tags: ["b410", "typescript", "exceljs", "parser", "normalizer", "renderer", "unit-test"]
created: 2026-09-08
---

# Kiến Trúc Parse → Normalize → Render TypeScript Cho Module B410

## Overview
Kế hoạch này tái thiết lập toàn diện module Tổng Hợp B410 từ cách tiếp cận sao chép Range mù quáng (COM) sang kiến trúc **Parse → Normalize → Render** thuần túy bằng TypeScript với `exceljs`.
Đảm bảo 100% các tiêu chuẩn:
1. Nhận diện sheet linh hoạt (`Sai sot & luu y`, `B410`...).
2. Lọc shape/ảnh độc lập: loại bỏ shape ẩn, size <= 2, nút bấm, OLE; chỉ giữ lại ảnh hợp lệ và neo chuẩn xác vào dòng lưu ý.
3. Đồng bộ chiều cao dòng (`finalRowHeight`): đảm bảo ảnh nằm lọt lòng trong ô D:E, tuyệt đối không đè nát chữ.
4. Cấu trúc bảng Master chuẩn mực: B: STT liên tục, C: GLV, D:E: Thực trạng (gộp), F:H: Hướng xử lý (gộp), I: Ý kiến KH.
5. Sau mỗi lưu ý là đúng một hàng trống 12.75 pt có gộp D:E, F:H và kẻ khung viền chuẩn.
6. Khi đổi người thực hiện: chèn dòng "Người thực hiện: ..." (Cambria 10 đậm, nghiêng, gạch chân, gộp D:E) kèm 1 hàng trống.
7. Xử lý siêu tốc trong 1-2 giây (in-memory), không còn tình trạng đứng máy, đơ COM hay bảng cảnh báo external links.
8. Đi kèm bộ Unit Test tự động hóa kiểm thử đầy đủ các ca biên phức tạp.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Xây dựng B410Parser & B410ShapeFilter độc lập trích xuất B410Issue[] và ảnh hợp lệ | P1 |
| 2 | Xây dựng B410Normalizer chuẩn hóa mã GLV, nhóm KTV, tính toán RowHeight chống đè ảnh | P1 |
| 3 | Xây dựng B410Renderer xuất bảng Master chuẩn cấu trúc 4 cột merge, hàng trống 12.75pt và chèn ảnh an toàn | P1 |
| 4 | Xây dựng bộ Unit Test (Vitest) cho các ca biên: shape ẩn, ảnh cao 200pt, sheet đa dạng tên, merge bất thường | P1 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: B410 Parser & Shape/Image Filter](./phase-01-start.md) | Pending |
| 2 | [Phase 2: B410 Normalizer & Height Calculator](./phase-02-b410-normalizer-and-height-calculator.md) | Pending |
| 3 | [Phase 3: B410 Renderer & Master Template Builder](./phase-03-b410-renderer-and-template-builder.md) | Pending |
| 4 | [Phase 4: Unit Tests & End-to-End Verification](./phase-04-b410-tests-and-verification.md) | Pending |

## Success Criteria

- [ ] Pipeline chạy hoàn toàn bằng TypeScript in-memory, hoàn tất gộp các file trong 1–2 giây.
- [ ] Không có bất kỳ ảnh nào đè lên chữ hoặc tràn xuống dòng tiếp theo.
- [ ] Mọi hàng lưu ý đều có gộp ô D:E và F:H chuẩn mực.
- [ ] Sau mỗi lưu ý là đúng 1 hàng trống cao 12.75 pt có viền và merge chuẩn.
- [ ] Dòng Người thực hiện hiển thị chuẩn (Cambria 10, đậm, nghiêng, gạch chân, gộp D:E).
- [ ] Bộ unit test chạy qua 100% test cases trong `vitest`.
- [ ] Typecheck và Build thành công 0 lỗi.

<!-- slug: b410-typescript-pipeline -->
