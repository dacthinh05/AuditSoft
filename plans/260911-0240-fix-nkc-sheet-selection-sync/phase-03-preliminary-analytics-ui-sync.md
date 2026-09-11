# Phase 3: Cập nhật PreliminaryAnalyticsPage.tsx — Truyền sheetName & Hiển thị minh bạch

## Mục tiêu
1. **Truyền chính xác `sheetName`:**
   - Khi gọi `window.auditsoft.auditAnalyze`, gửi kèm `{ filePath, sheetName: activeCfg?.sheetName }`.
   - Đưa `activeCfg?.sheetName` vào dependency array của `useEffect` phân tích để khi người dùng đổi sheet ở `SetupPage` thì `PreliminaryAnalyticsPage` tự động chạy phân tích lại ngay.
2. **Minh bạch hóa Header:**
   - Cập nhật thẻ trạng thái sổ kế toán:
     ```tsx
     {isClipboard
       ? 'Sổ NKC: Dán từ Clipboard'
       : `Sổ NKC: ${filePath.split(/\\|\//).pop()} ${activeCfg?.sheetName ? `(Sheet: ${activeCfg.sheetName})` : ''}`}
     ```

## File tác động
- `src/renderer/components/Analytics/PreliminaryAnalyticsPage.tsx`
