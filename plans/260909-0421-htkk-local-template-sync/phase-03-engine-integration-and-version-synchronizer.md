---
phase: 3
title: "Migration Engine Integration & Version Synchronizer"
status: pending
priority: P1
effort: "3h"
dependencies: [1, 2]
---

# Phase 3: Migration Engine Integration & Version Synchronizer

## Overview
Nâng cấp lõi chuyển đổi `Qtt03Migrator` để tích hợp liền mạch với hai nguồn dữ liệu mới: Kho khuôn mẫu đã lưu (`PersistentTemplateStore`) và Service phát hiện HTKK cục bộ (`LocalHtkkScanner`). Khi người dùng thực hiện chuyển đổi ở Chế độ tự động, engine sẽ tự động kiểm tra xem người dùng đã từng lưu khuôn mẫu riêng hay chưa (nếu có sẽ ưu tiên sử dụng ngay), đồng thời tự động đồng bộ số hiệu phiên bản ứng dụng khớp với bản HTKK thực tế đang cài đặt trên máy.

## Requirements
- Functional:
  - Cập nhật hàm `Qtt03Migrator.migrateAuto`:
    - Nhận thêm tùy chọn `options?: { customTemplateXml?: string, localAppVersion?: string }`.
    - Thứ tự ưu tiên lấy khuôn mẫu (Template Resolution Priority):
      1. *Ưu tiên 1:* Khuôn mẫu người dùng truyền trực tiếp qua tham số.
      2. *Ưu tiên 2:* Khuôn mẫu đã được người dùng lưu làm mặc định qua `PersistentTemplateStore`.
      3. *Ưu tiên 3:* Khuôn mẫu chuẩn tích hợp sẵn trong mã nguồn (`qtt03_tt80.ts`).
  - Đồng bộ phiên bản ứng dụng tự động (Version Auto-Sync):
    - Nếu phát hiện HTKK trên máy có phiên bản (ví dụ `5.7.1`, `5.7.6`, `5.8.0`), tự động cập nhật thẻ `<pbanDVu>` và `<pbanTKhaiXML>` tương ứng để khi nộp vào HTKK trên máy sẽ không bao giờ bị báo lệch phiên bản.
  - Bổ sung thông tin vào `MigrationResult.changesApplied`:
    - Ghi nhận rõ: "Sử dụng khuôn mẫu mặc định đã lưu" hoặc "Đồng bộ theo phiên bản HTKK 5.x trên máy".
- Non-functional:
  - Giữ vững nguyên tắc bảo toàn 100% số liệu (Variance = 0 VNĐ).

## Architecture
```text
[Input: File XML Cũ]
         │
         ▼
[Qtt03Migrator.migrateAuto]
  ├── 1. Check PersistentTemplateStore.hasSavedTemplate()?
  │       ├── Có: Nạp Template người dùng đã lưu
  │       └── Không: Dùng Built-in Template chuẩn
  │
  ├── 2. Check LocalHtkkScanner.detect()?
  │       └── Đồng bộ <pbanDVu> theo AppVersion trên máy
  │
  ├── 3. Rót số liệu Tờ khai chính + 100% Phụ lục
  └── 4. Xuất file XML chuẩn HTKK mới nhất
```

## Related Code Files
- Modify: `src/domain/etax/Qtt03Migrator.ts` (Nâng cấp phương thức migrateAuto)
- Create: `tests/qtt03-migrator-sync.test.ts` (Unit test kiểm thử chuyển đổi với template đã lưu và HTKK version)

## Implementation Steps
1. Cập nhật `src/domain/etax/Qtt03Migrator.ts`:
   - Thêm tham số `options?: { customTemplateXml?: string, localAppVersion?: string }`.
   - Logic chọn template theo thứ tự ưu tiên.
   - Cập nhật `pbanDVu` theo `localAppVersion`.
2. Viết unit test trong `tests/qtt03-migrator-sync.test.ts`:
   - Test chuyển đổi tự động khi đã lưu template mới -> đầu ra mang đúng cấu trúc template mới.
   - Test đồng bộ số hiệu phiên bản HTKK cục bộ.

## Success Criteria
- [x] Chế độ tự động tự nhận diện và nạp template đã lưu mà không cần người dùng chọn lại tệp mẫu.
- [x] Số hiệu phiên bản HTKK trên máy được tự động áp dụng vào tệp XML kết quả.

## Risk Assessment
- **Rủi ro:** Template người dùng lưu có thể bị lỗi cú pháp do chỉnh sửa tay trước đó.
- **Biện pháp:** Engine có bước tự kiểm tra tính hợp lệ của template trước khi áp dụng; nếu template lưu bị lỗi thì tự động fallback về template chuẩn tích hợp sẵn kèm cảnh báo.
