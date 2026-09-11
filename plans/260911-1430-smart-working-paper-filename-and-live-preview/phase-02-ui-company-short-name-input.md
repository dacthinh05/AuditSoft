# Phase 2: Thêm Ô Nhập Tên Công Ty Lưu File, Nút Chọn Đợt Kiểm & Live Preview

## 1. Mục Tiêu
- Cập nhật `engagementSlice.ts` để lưu `companyShortName` và `auditRound`.
- Trong `WorkingPaperPage.tsx`:
  - Thêm hàng gồm:
    - **Ô nhập `Tên công ty khi lưu file:`** (placeholder: `Ví dụ: LONG RICH hoặc May Mặc Test`).
    - **Nút chọn `Đợt kiểm toán:`** Segmented toggle gồm 3 lựa chọn: `D1 (Đợt 1)`, `D2 (Đợt 2)`, `Cả năm`.
  - Thêm thanh **Live Preview** thời gian thực:
    `👁️ Tên file mẫu sẽ xuất: D100 - Tien - [Tên công ty] [Đợt] [Năm] - [Tên KTV].xlsx`
  - Đồng bộ placeholder và giá trị gợi ý của `Thư mục lưu kết quả:`.

## 2. File Chỉnh Sửa
- `src/renderer/state/slices/engagementSlice.ts`
- `src/renderer/pages/WorkingPaperPage.tsx`

## 3. Các Bước Thực Hiện
1. Mở rộng `EngagementProfile` trong `engagementSlice.ts`:
   - `companyShortName?: string`
   - `auditRound?: 'D1' | 'D2' | 'FY'`
2. Trong `WorkingPaperPage.tsx`:
   - Khởi tạo local state:
     - `const [companyShortName, setCompanyShortName] = useState<string>(engagement.companyShortName || '')`
     - `const [auditRound, setAuditRound] = useState<'D1' | 'D2' | 'FY'>(engagement.auditRound || 'D2')`
   - Render cụm điều khiển trực quan tại Bước 2 (dưới ô Tên Khách hàng).
   - Render thanh Live Preview với font monospace, viền xanh pastel nổi bật.
   - Khi KTV gõ hoặc bấm chọn D1/D2, Live Preview và Thư mục lưu cập nhật tức thì.

## 4. Tiêu Chí Kiểm Tra
- Gõ vào ô `Tên công ty khi lưu file`, Live Preview đổi ngay lập tức.
- Bấm chuyển giữa D1 / D2 / Cả năm, tên file mẫu lập tức thêm/bớt `D1` hoặc `D2`.
