---
phase: 2
title: "Persistent Custom Template Store"
status: pending
priority: P1
effort: "2h"
dependencies: [1]
---

# Phase 2: Persistent Custom Template Store

## Overview
Xây dựng lớp quản trị và lưu trữ bền vững khuôn mẫu XML tùy chỉnh của người dùng (`PersistentTemplateStore`). Khi người dùng nạp một tệp XML mới kết xuất từ bản HTKK mới nhất và bấm "Lưu làm khuôn mẫu mặc định", module này sẽ bóc tách metadata (phiên bản XML, phiên bản ứng dụng, ngày lưu), lưu trữ an toàn trong bộ nhớ bền vững (localStorage / File System) và cung cấp hàm truy xuất tự động cho lõi chuyển đổi ở các phiên làm việc tiếp theo.

## Requirements
- Functional:
  - Khóa lưu trữ: `auditsoft_qtt03_custom_template`.
  - Cấu trúc dữ liệu lưu trữ (`SavedTemplateData`):
    - `xmlContent: string` (nội dung XML mẫu chuẩn)
    - `savedAt: string` (thời điểm lưu ISO)
    - `sourceFileName: string`
    - `pbanTKhaiXML: string`
    - `pbanDVu: string`
    - `appVersion?: string`
  - Các hàm tiện ích:
    - `saveTemplate(xmlString: string, fileName?: string): SavedTemplateData`
    - `getSavedTemplate(): SavedTemplateData | null`
    - `hasSavedTemplate(): boolean`
    - `resetToDefault(): void` (xóa khuôn mẫu tùy chỉnh, quay về mẫu tích hợp sẵn của phần mềm)
    - `getEffectiveTemplate(): string` (trả về khuôn mẫu tùy chỉnh nếu có, ngược lại trả về mẫu chuẩn tích hợp sẵn)
- Non-functional:
  - Tốc độ đọc/ghi khuôn mẫu dưới 10ms.
  - Tự động kiểm tra tính hợp lệ của tệp XML trước khi lưu (phải có các thẻ đặc trưng của tờ khai 03/TNDN).

## Architecture
```text
[User Action: Bấm "Lưu làm khuôn mặc định"]
                   │
                   ▼
       [PersistentTemplateStore]
       ├── validateXml()
       ├── extractVersions()
       └── setItem(KEY, JSON.stringify(data))
                   │
         [Storage: LocalStorage]
                   │
                   ▼
       [Qtt03Migrator.migrateAuto()]
         └── getEffectiveTemplate() ──> Ưu tiên mẫu đã lưu
```

## Related Code Files
- Create: `src/domain/etax/PersistentTemplateStore.ts` (Lớp quản trị lưu trữ template)
- Create: `tests/persistent-template-store.test.ts` (Unit test kiểm thử lưu, đọc, fallback và reset)

## Implementation Steps
1. Xây dựng `PersistentTemplateStore.ts`:
   - Kiểm tra môi trường (Node.js mock memory store vs Browser localStorage).
   - Hàm `saveTemplate`: Parse nhanh XML để lấy `pbanTKhaiXML` và `pbanDVu`, lưu JSON.
   - Hàm `getEffectiveTemplate`: Kiểm tra nếu có mẫu lưu thì trả về, nếu không gọi `getQtt03TT80BlankTemplate()`.
2. Viết unit test trong `tests/persistent-template-store.test.ts`:
   - Test lưu khuôn mẫu từ tệp mới của người dùng.
   - Test lấy ra đúng nội dung và phiên bản XML.
   - Test fallback về mẫu mặc định khi chưa lưu hoặc sau khi reset.

## Success Criteria
- [x] Lưu trữ bền vững tệp mẫu XML của người dùng kèm đầy đủ metadata.
- [x] Hàm `getEffectiveTemplate()` trả về chính xác khuôn mẫu người dùng đã ghi nhớ.
- [x] Đặt lại về mặc định (Reset) hoạt động an toàn.

## Risk Assessment
- **Rủi ro:** Dung lượng lưu trữ localStorage có hạn (khoảng 5-10MB).
- **Biện pháp:** Một tệp XML tờ khai thuế chỉ chiếm 30-50KB, hoàn toàn nằm trong giới hạn an toàn của localStorage.
