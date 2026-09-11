---
title: "Phase 4: UI Data Source Switcher & Database Connection Modal"
description: "Phát triển giao diện chuyển đổi nguồn dữ liệu linh hoạt (Excel vs CSDL), Modal cấu hình kết nối SQL Server (MISA/FAST/BRAVO), xem trước bảng dữ liệu (Data Preview) và thanh trạng thái hiển thị động cơ tăng tốc DuckDB."
status: completed
priority: P2
effort: "0.7d"
created: 2026-09-10
---

# Phase 4: UI Data Source Switcher & Database Connection Modal

## 1. Mục Tiêu (Objective)

Cung cấp giao diện trực quan, chuyên nghiệp và thân thiện cho kiểm toán viên:
- Thêm thanh chuyển đổi nguồn dữ liệu tại trang Thiết lập (SetupPage): Lựa chọn giữa nạp file Excel truyền thống hoặc kết nối trực tiếp CSDL.
- Xây dựng component `DbConnectionModal`: Cho phép KTV nhập thông tin máy chủ CSDL, chọn cấu hình mẫu phần mềm (MISA SME, FAST, BRAVO), kiểm tra kết nối (`Test Connection`) và xem trước 10 dòng chứng từ (`Preview Data`).
- Bổ sung huy hiệu trạng thái động cơ (Engine Status Badge) trên thanh `AuditDataProfilerBar` để KTV biết rõ dữ liệu đang được tăng tốc bởi DuckDB hay chạy trên JS Engine.

---

## 2. Thiết Kế Giao Diện (UI/UX Specifications)

### 2.1. Thanh Chọn Nguồn Dữ Liệu (Data Source Switcher)

Vị trí: Tại đầu trang `SetupPage.tsx` hoặc bảng nạp file:

```tsx
<div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
  <button
    onClick={() => setSourceType('excel')}
    className={clsx(
      'px-4 py-2 text-sm font-semibold rounded-lg transition-all',
      sourceType === 'excel'
        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
    )}
  >
    📁 Tệp Excel (.xlsx, .xls)
  </button>
  <button
    onClick={() => setSourceType('database')}
    className={clsx(
      'px-4 py-2 text-sm font-semibold rounded-lg transition-all',
      sourceType === 'database'
        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
    )}
  >
    🗄️ Kết Nối CSDL (MISA / FAST / SQL Server)
  </button>
</div>
```

### 2.2. Modal Cấu Hình Kết Nối CSDL (`DbConnectionModal.tsx`)

Vị trí: `src/renderer/components/DatabaseConnector/DbConnectionModal.tsx`

- **Các trường thông tin**:
  - **Mẫu phần mềm (Preset)**: Menu dropdown chọn `MISA SME / AMIS` (Mặc định), `FAST Accounting`, `BRAVO`, `Tùy chỉnh SQL Server`.
  - **Địa chỉ máy chủ (Host / IP)**: Mặc định `localhost` hoặc `192.168.1.xxx` kèm Port (mặc định `1433`).
  - **Tên CSDL (Database)**: Tên file CSDL (ví dụ `MISA_SME_2024` hoặc `FAST_DATA`).
  - **Tài khoản & Mật khẩu**: `sa` hoặc tài khoản xem dữ liệu.
  - **Năm tài chính**: `2024`, `2025`...
- **Thanh thao tác tương tác**:
  - `[Kiểm Tra Kết Nối]`: Gọi IPC `db-connector:test-connection`, hiển thị thông báo thành công (màu xanh lá) hoặc mã lỗi chi tiết.
  - `[Xem Trước 10 Dòng]`: Hiển thị bảng nhỏ 10 dòng chứng từ đầu tiên để KTV xác nhận đúng dữ liệu trước khi nạp toàn bộ.
  - `[Nạp Vào Hệ Thống]`: Chạy tiến trình nạp dữ liệu với thanh tiến độ thời gian thực (Progress Bar).

### 2.3. Huy Hiệu Hiệu Năng (`EngineStatusBadge.tsx`)

Hiển thị góc phải thanh `AuditDataProfilerBar`:
- Khi DuckDB hoạt động: `⚡ DuckDB OLAP: 524.180 dòng trong 0.8s` (Màu xanh ngọc Emerald).
- Khi Fallback JS: `⚙️ Chế độ Chuẩn (V8 Engine): 524.180 dòng` (Màu xanh dương Slate/Blue).

---

## 3. Các Bước Thực Hiện Chi Tiết (Implementation Steps)

1. **Bước 4.1**: Tạo thư mục `src/renderer/components/DatabaseConnector/` gồm:
   - `DbConnectionModal.tsx`
   - `DbPreviewTable.tsx`
   - `EngineStatusBadge.tsx`
2. **Bước 4.2**: Tích hợp các state mới vào Zustand Store (`src/renderer/state/store.ts`):
   - `dbConfig`: Thông tin kết nối hiện tại.
   - `engineType`: `'duckdb' | 'in_memory_js'`.
   - `ingestionMetrics`: Số dòng, thời gian nạp.
3. **Bước 4.3**: Gắn kết nối vào `SetupPage.tsx` và `AuditDataProfilerBar.tsx`.
4. **Bước 4.4**: Kiểm tra giao diện trên cả 2 chế độ Light mode & Dark mode.

---

## 4. Tiêu Chuẩn Nghiệm Thu (Acceptance Criteria)

- [x] Giao diện chuyển đổi nguồn dữ liệu hoạt động mượt mà, không làm mất dữ liệu đã nạp trước đó.
- [x] Modal kết nối hiển thị đầy đủ các trường cấu hình và presets MISA/FAST/BRAVO/CUSTOM.
- [x] Tính năng xem trước 10 dòng hiển thị đúng bảng dữ liệu định dạng chuẩn kế toán qua `DbPreviewTable`.
- [x] Tiến trình tải dữ liệu hiển thị % tiến độ chính xác theo sự kiện truyền từ IPC Main process.
- [x] Badge `EngineStatusBadge` hiển thị trực quan trạng thái tăng tốc động cơ tại Header.
