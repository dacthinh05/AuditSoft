---
id: "phase-04"
name: "Kiểm thử tự động Vitest & kiểm thử thực tế qua Microsoft Excel COM"
plan: "plans/260911-1045-wp-counterparts-and-all-ajes/plan.md"
status: "pending"
priority: "P1"
effort: "30m"
files:
  - "tests/unit/counterpartExtractor.test.ts"
  - "tests/workingpaper.test.ts"
  - "scripts/verify-full-openxml-ajes.ps1"
---

# Pha 4: Kiểm Thử Tự Động Vitest & Kiểm Thử Thực Tế Qua Microsoft Excel COM

## 1. Mục Tiêu
Bảo đảm toàn bộ tính năng sinh GLV sau khi bổ sung đối ứng D390/E290, AJE sheets và Master CHITIETDC đều đạt tiêu chuẩn chất lượng cao nhất:
1. **100% Type-safe:** Không có lỗi TypeScript (`npm run typecheck`).
2. **Unit & Integration Tests:** 100% tests trong Vitest passed (`npm test`).
3. **Microsoft Excel COM Verification:** Mở thực tế các file sinh ra trên Excel thật bằng script PowerShell/Node, kiểm tra 0 lỗi corrupt/repair và đối chiếu chính xác số tổng.

---

## 2. Kịch Bản Kiểm Thử Chi Tiết

### 2.1. Kiểm thử Unit Test (`tests/unit/counterpartExtractor.test.ts`)
- Kiểm tra bóc tách phát sinh TK 131:
  - Phân tách đúng phát sinh Đợt 1 (tháng 1 đến tháng 6) và Cả năm (tháng 1 đến tháng 12).
  - Tự động gom nhóm theo TK đối ứng 3 số (`111`, `112`, `511`, `3331`...).
  - Sắp xếp số tiền giảm dần, tính đúng tỷ trọng `%`.
  - Gán mã W/P Ref chính xác (`112` $\rightarrow$ `D190`, `511` $\rightarrow$ `G190`, `3331` $\rightarrow$ `E390`...).
- Kiểm tra bóc tách phát sinh TK 331:
  - Bóc tách đúng các TK đối ứng (`111`, `112`, `152`, `156`, `211`, `642`...).

### 2.2. Kiểm thử Tích Hợp Working Paper (`tests/workingpaper.test.ts`)
- Kiểm tra sinh file `D300`:
  - Sheet `D 390` có dữ liệu ở cả 2 khối Đợt 1 và Cả năm.
  - Sheet `D 341` có dữ liệu AJE (hoặc ghi "Không phát sinh.").
  - Sheet `D 310` có Cột 5 và Cột 6 được cập nhật chuẩn xác.
- Kiểm tra sinh file `E200`:
  - Sheet `E290` có dữ liệu Đợt 1 và Cả năm.
  - Sheet `E241` có dữ liệu AJE.
- Kiểm tra sinh file Master `A - B - H`:
  - Sheet `CHITIETDC` có đủ danh sách các bút toán AJE.

### 2.3. Kiểm thử Microsoft Excel COM trên Windows
- Tạo script PowerShell `scripts/verify-full-openxml-ajes.ps1`:
  - Khởi tạo tiến trình `New-Object -ComObject Excel.Application`.
  - Mở file `D300`, `E200`, `E300`, `E400`, `A - B - H` đã sinh.
  - Đọc trực tiếp giá trị các ô:
    - `D300`: `D 390!C23`, `D 390!G23`, `D 390!C41`, `D 390!G41`.
    - `E200`: `E290!C27`, `E290!G27`, `E290!C51`, `E290!G51`.
    - `A - B - H`: `CHITIETDC!F4`, `CHITIETDC!C4`.
  - Đóng Excel và giải phóng COM Object sạch sẽ.

---

## 3. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] `npm run typecheck` đạt 0 lỗi.
- [ ] Tất cả các test suites trong Vitest đều passed 100%.
- [ ] Script PowerShell mở thành công 100% các file kết xuất mà không kích hoạt hộp thoại cảnh báo "Excel completed file level validation and repair".
- [ ] Số liệu tổng phát sinh đối ứng trên D390 và E290 khớp 100% với Sổ cái và Bảng CDFS.
