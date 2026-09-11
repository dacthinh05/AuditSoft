---
phase: 1
title: "Sửa lỗi Cốt lõi Bản quyền & Đạt chuẩn Test Suite"
status: in-progress
priority: P1
effort: "30m"
dependencies: []
---

# Phase 1: Sửa lỗi Cốt lõi Bản quyền & Đạt chuẩn Test Suite

## Overview
Khắc phục hai lỗi cốt lõi trong `src/shared/license.ts`:
1. Sửa lỗi `ReferenceError: nowSec is not defined` trong hàm `verifyLicense`.
2. Xóa bỏ đoạn code bypass hardcoded `if (!raw) return { isLicensed: true, ... }` trong `getLicenseStatus()`, đưa ứng dụng về đúng logic: chưa kích hoạt thì `isLicensed: false` và kích hoạt bộ đếm dùng thử 10 lượt (`MAX_TRIAL_EXPORTS = 10`).

## Requirements
- Functional:
  - Khi chưa có `auditsoft_license_token`, `getLicenseStatus()` trả về `isLicensed: false`.
  - `getTrialExportStatus()` trả về `isLicensed: false` và `remainingExports: 10` cho máy mới.
  - `verifyLicense` tính toán thời gian hết hạn chính xác với `nowSec = Math.floor(Date.now() / 1000)`.
  - `removeLicense()` xóa token và đưa app về trạng thái chưa kích hoạt.
- Non-functional:
  - Giữ nguyên cơ chế mật mã bất đối xứng Ed25519 và format token `ASKEY-<payload>.<sig>`.
  - Toàn bộ 10 tests trong `tests/license.test.ts` phải PASS 100%.

## Architecture
```
verifyLicense(machineId, keyToVerify)
  │
  ├─> parseLicenseToken()
  ├─> verifyWithNodeCrypto() (Ed25519 signature)
  ├─> Kiểm tra Machine ID lock
  └─> Kiểm tra hạn sử dụng: payload.exp < nowSec (Đã sửa khai báo nowSec)

getLicenseStatus()
  │
  ├─> Đọc STORAGE_KEY_LICENSE
  ├─> Nếu không có: trả về isLicensed: false (Đã bỏ bypass auto-VIP)
  └─> Nếu có: parse & verify token -> trả về thông tin bản quyền chính xác
```

## Related Code Files
- Modify: `src/shared/license.ts`
- Test: `tests/license.test.ts`

## Implementation Steps
1. Khai báo `const nowSec = Math.floor(Date.now() / 1000)` bên trong `verifyLicense()` trước khi kiểm tra `payload.exp`.
2. Cập nhật `getLicenseStatus()`: Nếu không tìm thấy `raw` token trong storage, trả về object `LicenseStatus` với `isLicensed: false`, `licenseKey: null`, `activatedAt: null`.
3. Kiểm tra hàm `removeLicense()` để đảm bảo xóa sạch key và trạng thái được reset đúng.
4. Chạy `npm test tests/license.test.ts` và đảm bảo toàn bộ 10 test cases đạt trạng thái PASS.

## Success Criteria
- [x] Lỗi `ReferenceError: nowSec is not defined` được giải quyết hoàn toàn.
- [x] Đoạn bypass tự động cấp VIP bị loại bỏ.
- [x] Lệnh `npm test tests/license.test.ts` chạy thành công với 10/10 tests PASS.

## Risk Assessment
- Rủi ro: Khách hàng đang dùng thử có thể bị reset lượt nếu đổi trình duyệt hoặc xóa cache.
  - Nhận biết: Lượt dùng thử quay về 10 khi xóa `localStorage`.
  - Phản ứng: Chấp nhận được trong giai đoạn v0.1.0 vì ứng dụng offline, giải pháp lâu dài ở Phase sau là đồng bộ lưu trữ file ở main process.
