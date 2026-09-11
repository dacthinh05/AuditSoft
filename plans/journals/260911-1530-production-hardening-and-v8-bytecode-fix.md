# Nhật Ký Kỹ Thuật: Lập Kế Hoạch Chuẩn Hóa Production & Khắc Phục Lỗi V8 Bytecode Bytenode

**Ngày:** 11/09/2026  
**Mã kế hoạch:** `plans/260911-1530-production-hardening-and-v8-bytecode-fix/`  
**Trọng tâm:** Kiểm toán toàn diện hệ thống, phát hiện và lập kế hoạch sửa lỗi crash Bytenode V8 (`CRIT-01`), bổ sung timeout/bảo mật header cho Gemini AI (`MED-01`, `MED-02`), và thiết lập chốt chặn bản quyền tầng IPC Main Process (`MED-03`).

---

## 1. Kết Quả Kiểm Toán Thực Nghiệm
- **Trạng thái kiểm thử:** 86/86 test files, 396/396 unit tests PASS 100%, typecheck 0 errors.
- **Phát hiện Critical Blocker:**
  - Lệnh `npm run build:protect` chạy Bytenode qua Node.js máy chủ `v24.14.1`, trong khi Electron chạy V8 của Node 20.18 (`v33.4.11`).
  - Hệ quả: Khi mở ứng dụng bản build bảo vệ, Electron báo lỗi `cachedDataRejected` và văng app ngay lập tức.
  - Giải pháp đã xác minh: Biên dịch Bytenode bằng chính runtime của Electron với cờ `ELECTRON_RUN_AS_NODE=1 electron scripts/compile-bytecode.mjs`.

## 2. Kế Hoạch Đã Thiết Lập
- **Phase 1:** Sửa lệnh build bytecode trong `package.json` và script `scripts/compile-bytecode.mjs`.
- **Phase 2:** Gia cố `src/main/services/GeminiService.ts`: Thêm `AbortSignal.timeout(45000)` chống treo UI và chuyển API Key từ query parameter sang `x-goog-api-key` header.
- **Phase 3:** Thiết lập chốt chặn kiểm tra bản quyền / giới hạn dùng thử độc lập phía Main Process IPC.
- **Phase 4:** Chạy toàn bộ test suite, verify Bytenode smoke test dưới Electron runtime và đóng gói thử nghiệm.

---
> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
