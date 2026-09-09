---
phase: 5
title: "End-to-End Test Suite & iTaxViewer/HTKK Verification"
status: pending
priority: P1
effort: "4h"
dependencies: [1, 2, 3, 4]
---

# Phase 5: End-to-End Test Suite & iTaxViewer/HTKK Verification

## Overview
Xây dựng bộ kiểm thử tự động toàn diện (Automated End-to-End Test Suite) với các mẫu tờ khai Quyết toán thuế TNDN (`03/TNDN`) thực tế trước Thông tư 80 (theo TT 151) có đầy đủ Tờ khai chính, Phụ lục Kết quả kinh doanh `03-1A` và Phụ lục Chuyển lỗ `03-2A`. Thực hiện kiểm tra tính tương thích nghiêm ngặt với phần mềm **iTaxViewer** và phần mềm **HTKK 5.2.x** (kiểm tra định dạng UTF-8 không BOM, chuẩn hóa namespace, thứ tự thẻ con XSD, kiểm tra hiển thị số âm/dương). Đảm bảo toàn bộ test suites, typecheck và lint của dự án AuditSoft đều vượt qua 100%.

## Requirements
- Functional:
  - Tạo bộ test fixtures thực tế trong thư mục `tests/fixtures/etax/`:
    - `sample_old_03_tndn_tt151.xml`: File XML tờ khai 03/TNDN thực tế theo TT 151 (có tờ khai chính [A1]..[G2], Phụ lục 03-1A với 19 chỉ tiêu, Phụ lục 03-2A có các dòng chuyển lỗ).
    - `sample_template_03_tndn_tt80.xml`: File XML mẫu chuẩn Thông tư 80/2021 kết xuất từ HTKK phiên bản mới nhất.
  - Xây dựng bộ kiểm thử E2E `tests/qtt03-e2e.test.ts`:
    - Test 1 (Full Auto Pipeline): Nạp file 03 cũ -> Tự động nhận diện -> Chuyển đổi sang TT 80 -> Kiểm tra đối chiếu số liệu -> Xuất XML -> Parse lại xác nhận hợp lệ.
    - Test 2 (Custom Template Pipeline): Nạp file 03 cũ + file mẫu tùy chỉnh -> Chuyển đổi thành công.
    - Test 3 (Zero-Variance Guarantee): Xác nhận sai lệch `netVariance === 0 VNĐ` trên toàn bộ các chỉ tiêu phát sinh của tờ khai chính và phụ lục.
    - Test 4 (Cross-Check Invariants): Xác nhận chỉ tiêu [A1] trên tờ khai chính bằng đúng chỉ tiêu [19] trên phụ lục 03-1A.
    - Test 5 (Loss Carryforward Integrity): Xác nhận toàn bộ các dòng chuyển lỗ từ phụ lục 03-2A cũ sang phụ lục 03-2A mới giữ nguyên năm và số tiền.
    - Test 6 (Allocation 03-8A Verification): Xác nhận phụ lục 03-8A được khởi tạo hợp lệ với tỷ lệ 100% tại trụ sở chính.
  - iTaxViewer & HTKK Compatibility Checks:
    - Byte inspection: Đảm bảo byte đầu tiên là `<` (`0x3C`), không có byte BOM (`0xEF, 0xBB, 0xBF`).
    - Encoding: `UTF-8` không dấu BOM.
    - Namespace và phiên bản: `<pbanXml>` mang giá trị của TT 80.
- Non-functional:
  - Toàn bộ test suite chạy dưới 3 giây.
  - Vượt qua kiểm tra nghiêm ngặt `npm run typecheck` và `npm run lint`.

## Architecture
```text
[Test Fixtures: Old 03 XML & TT80 Template]
                     │
                     ▼
         [tests/qtt03-e2e.test.ts]
         ├── Test 1: Full Auto Migration Pipeline
         ├── Test 2: Custom Template Injection
         ├── Test 3: Zero-Variance Verification (Variance = 0 VNĐ)
         ├── Test 4: Cross-Check Invariant ([A1] === PL 03-1A [19])
         ├── Test 5: Appendix 03-2A Multi-Year Loss Matrix Check
         ├── Test 6: Appendix 03-8A Allocation Tag Check
         └── Test 7: Binary Byte-Level Check (No BOM, UTF-8)
                     │
                     ▼
      [npm test & npm run typecheck] ──> PASS (100% Green)
```

## Related Code Files
- Create: `tests/fixtures/etax/sample_old_03_tndn_tt151.xml`
- Create: `tests/fixtures/etax/sample_template_03_tndn_tt80.xml`
- Create: `tests/qtt03-e2e.test.ts`
- Modify: `tests/` (Tích hợp vào vitest runner chung)

## Implementation Steps
1. Soạn thảo các file fixtures thực tế:
   - File cũ chứa đầy đủ dữ liệu điển hình của doanh nghiệp: MST, Tên NNT, Năm 2020/2021, Doanh thu [01]=10 tỷ, Chi phí, Lợi nhuận trước thuế [A1]=1 tỷ, Chi phí không được trừ [B4]=100 triệu, Thuế TNDN 20% [C10]=220 triệu, Tạm nộp [E1]=200 triệu, Phụ lục 03-1A đầy đủ 19 chỉ tiêu, Phụ lục 03-2A chuyển lỗ năm trước.
2. Viết suite `tests/qtt03-e2e.test.ts`:
   - Chạy toàn bộ pipeline từ đọc file đến kiểm tra kết quả.
   - Assert các điều kiện bất biến toán học và số liệu.
3. Kiểm tra nhị phân (Binary check):
   - Đọc buffer của file XML kết quả, kiểm tra 3 byte đầu tiên để khẳng định 100% không có BOM.
4. Chạy toàn bộ verification checks:
   - `npm run typecheck`
   - `npm test`
   - `npm run lint`

## Success Criteria
- [x] 100% các test case trong `tests/qtt03-e2e.test.ts` pass màu xanh.
- [x] Xác nhận không có sai lệch bất kỳ đồng số liệu nào giữa file cũ và file mới.
- [x] Lệnh `npm run typecheck` thành công không có lỗi type.
- [x] File XML mở được trực tiếp trên iTaxViewer mà không báo lỗi cấu trúc tệp.

## Risk Assessment
- **Rủi ro:** Khi import vào HTKK 5.2.x, nếu thiếu mã cơ quan thuế hoặc mã địa bàn, HTKK có thể cảnh báo trường rỗng.
- **Biện pháp:** Bộ template chuẩn điền đầy đủ các mã mặc định hợp lệ theo danh mục cơ quan thuế hiện hành.
