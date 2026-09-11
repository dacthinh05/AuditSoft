# Nhật Ký Kỹ Thuật: Hoàn Thành Chuẩn Hóa Production & Sửa Triệt Để Lỗi V8 Bytecode Bytenode

**Ngày:** 11/09/2026  
**Mã kế hoạch:** `plans/260911-1530-production-hardening-and-v8-bytecode-fix/`  
**Trạng thái:** ✅ ĐÃ HOÀN THÀNH TOÀN BỘ 4 PHASES (COMPLETED)  

---

## 1. Kết Quả Triển Khai Thực Tế

### Phase 1: Khắc phục V8 Bytecode Build (CRIT-01)
- **Tệp thay đổi:** `scripts/compile-bytecode.mjs`, `package.json`
- **Chi tiết:**
  - Bổ sung cơ chế tự động chuyển hướng sang Electron V8 runtime (`process.versions.electron`) với `ELECTRON_RUN_AS_NODE=1`.
  - Xử lý tương thích đường dẫn có khoảng trắng trên Windows (`"5. AuditSoft"`).
  - Cập nhật lệnh `npm run build:protect` và bổ sung `npm run dist:protect`.
- **Xác minh:** Lệnh nạp bytecode qua Electron trả về `BYTECODE_SMOKE_TEST_PASS`, loại bỏ hoàn toàn lỗi `cachedDataRejected`.

### Phase 2: Gia cố An Ninh & Timeout Gemini AI (MED-01 & MED-02)
- **Tệp thay đổi:** `src/main/services/GeminiService.ts`
- **Chi tiết:**
  - Bổ sung `AbortSignal.timeout(15000)` cho `testGeminiConnection` và `AbortSignal.timeout(60000)` cho `generateGeminiAuditReview`.
  - Chuyển API Key từ Query Parameter (`?key=`) sang HTTP Header chuẩn Google `x-goog-api-key`.
  - Phân loại lỗi `TimeoutError` và `AbortError` rõ ràng, chống treo vô tận giao diện người dùng.

### Phase 3: Chốt Chặn Bản Quyền Đa Tầng Phía Main Process (MED-03)
- **Tệp thay đổi / tạo mới:** `src/main/mainLicenseGuard.ts`, `src/main/index.ts`, `tests/main-license-guard.test.ts`
- **Chi tiết:**
  - Tạo module `mainLicenseGuard.ts` lưu trữ và đếm số lượt dùng thử độc lập trong `userData`.
  - Gắn hàm chốt chặn `assertCanExport` vào các IPC Handlers: `IPC.exportReport`, `IPC.auditExport`, `IPC.exportExpenseByNature`, `IPC.generateWorkingPapers`, `IPC.consolidateB410`.
  - Tự động đồng bộ token chữ ký số Ed25519 xuống Main Process khi kích hoạt bản quyền hợp lệ qua `IPC.verifyLicenseKey`.

### Phase 4: Kiểm Thử Toàn Diện & Đóng Gói
- **Typecheck:** 0 errors trên cả 3 file config (`tsconfig.web.json`, `tsconfig.node.json`, `tsconfig.tests.json`).
- **Unit Tests:** **87/87 test files PASS**, **401/401 tests PASS** (tăng thêm 4 tests bảo vệ bản quyền).
- **Smoke test:** Nạp `index.jsc` thành công 100% trong môi trường Electron V8.

---
> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
