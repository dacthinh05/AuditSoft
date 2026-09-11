---
phase: 2
title: "Bổ Sung Cấu Hình 2 Đợt Kiểm Toán Vào UI BƯỚC 2 & Đồng Bộ engagementSlice"
status: ready
priority: P1
effort: "30m"
files:
  - "src/renderer/pages/WorkingPaperPage.tsx"
---

# Phase 02: Bổ Sung Cấu Hình 2 Đợt Kiểm Toán Vào UI BƯỚC 2 & Đồng Bộ engagementSlice

## 1. Mục Tiêu
1. Hiển thị trực quan 2 trường nhập liệu cho **Đợt 1 (Interim)** và **Đợt 2 (Final)** trong thẻ **BƯỚC 2: Thông Tin Hồ Sơ Kiểm Toán (ADD)** trên `WorkingPaperPage.tsx`.
2. Đồng bộ 2 chiều dữ liệu hồ sơ kiểm toán (`clientName`, `fiscalYearEnd`, `auditPeriod1`, `auditPeriod2`, `auditorName`, `auditFirmName`, `outputDir`) giữa `WorkingPaperPage` và `engagementSlice` (Zustand store), thống nhất với modal header `EngagementModal`.

---

## 2. Chi Tiết Thực Hiện

### 2.1. Đọc và Đồng Bộ Với `engagementSlice`
Trong `WorkingPaperPage.tsx`:
```tsx
const engagement = useApp((s) => s.engagement)
const setEngagement = useApp((s) => s.setEngagement)
```
- Khởi tạo giá trị form từ `engagement` hoặc đồng bộ state khi `engagement` thay đổi.
- Khi người dùng chỉnh sửa các trường trong BƯỚC 2, gọi `setEngagement(...)` để cập nhật đồng thời lên thanh Header và modal toàn ứng dụng.

### 2.2. Bổ sung giao diện 2 Đợt Kiểm Toán tại BƯỚC 2
Thêm 2 ô input trong grid của BƯỚC 2:
```tsx
<div>
  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
    Đợt 1 (Interim):
  </label>
  <input
    type="text"
    className="input-text"
    value={auditPeriod1}
    onChange={(e) => {
      setAuditPeriod1(e.target.value)
      setEngagement({ auditPeriod1: e.target.value })
    }}
    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
    placeholder="01/01 - 30/06/2026"
  />
</div>

<div>
  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
    Đợt 2 (Final):
  </label>
  <input
    type="text"
    className="input-text"
    value={auditPeriod2}
    onChange={(e) => {
      setAuditPeriod2(e.target.value)
      setEngagement({ auditPeriod2: e.target.value })
    }}
    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
    placeholder="01/07 - 31/12/2026"
  />
</div>
```

### 2.3. Tự động tính đợt mặc định khi đổi Niên độ khóa sổ
Khi phát hiện năm từ tên file (ví dụ `2025`):
- `fiscalYearEnd` $\rightarrow$ `31/12/2025`
- `auditPeriod1` $\rightarrow$ `01/01 - 30/06/2025`
- `auditPeriod2` $\rightarrow$ `01/07 - 31/12/2025`
Đồng bộ ngay vào `setEngagement`.

### 2.4. Truyền đầy đủ khi gọi IPC `generateWorkingPapers`
```tsx
const res = await window.auditsoft.generateWorkingPapers({
  sourcePath: activePath,
  outputDir: outputDir.trim() || undefined,
  engagement: {
    clientName: clientName.trim() || 'Doanh Nghiệp Kiểm Toán',
    fiscalYearEnd: fiscalYearEnd.trim() || '31/12/2026',
    auditPeriod1: auditPeriod1.trim() || '01/01 - 30/06/2026',
    auditPeriod2: auditPeriod2.trim() || '01/07 - 31/12/2026',
    auditorName: auditorName.trim() || 'Đắc Thịnh',
    auditFirmName: auditFirmName.trim() || 'Công ty TNHH Kiểm toán BẮC ĐẨU',
  },
})
```

---

## 3. Kiểm Thử & Nghiệm Thu
- [ ] BƯỚC 2 hiển thị đầy đủ 2 ô nhập liệu "Đợt 1 (Interim)" và "Đợt 2 (Final)".
- [ ] Đổi năm niên độ sang 2025 $\rightarrow$ Đợt 1 và Đợt 2 tự động cập nhật về năm 2025.
- [ ] Gõ chỉnh sửa thủ công (ví dụ: `01/01 - 30/09/2025`) $\rightarrow$ giá trị được lưu giữ và cập nhật vào store.
- [ ] Bấm vào pill thông tin trên Header $\rightarrow$ modal mở ra phản ánh đúng giá trị đã nhập ở BƯỚC 2.
