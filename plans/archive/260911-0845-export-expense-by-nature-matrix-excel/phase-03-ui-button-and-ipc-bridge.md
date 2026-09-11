---
phase: 3
title: "Đấu Nối IPC Xuất Excel & Thêm Nút Bấm Trên ExpenseByNatureTable"
status: ready
priority: P1
effort: "35m"
files:
  - "src/shared/ipc.ts"
  - "src/preload/index.ts"
  - "src/main/index.ts"
  - "src/renderer/components/Analytics/ExpenseByNatureTable.tsx"
---

# Phase 03: Đấu Nối IPC Xuất Excel & Thêm Nút Bấm Trên ExpenseByNatureTable

## 1. Mục Tiêu
1. Đấu nối kênh IPC `exportExpenseByNature` giữa Main process, Preload bridge và Renderer.
2. Thêm nút bấm **`[📥 Xuất Excel Ma Trận Chi Tiết]`** vào thanh header của `ExpenseByNatureTable.tsx`.
3. Xử lý mở hộp thoại chọn nơi lưu file (`dialog.showSaveDialog`) và tự động mở file/thư mục sau khi xuất thành công.

---

## 2. Chi Tiết Thực Hiện

### 2.1. Khai báo IPC trong `src/shared/ipc.ts`
```ts
export interface ExportExpenseByNatureRequest {
  report: ExpenseByNatureReport
  clientName?: string
  fiscalYear?: string
  suggestedName?: string
}

// Thêm vào interface AuditBridgeApi:
exportExpenseByNature(req: ExportExpenseByNatureRequest): Promise<ExportResultPayload>

// Thêm channel vào IPC constant:
exportExpenseByNature: 'auditsoft/exportExpenseByNature'
```

### 2.2. Đăng ký Preload trong `src/preload/index.ts`
```ts
exportExpenseByNature: (req: ExportExpenseByNatureRequest): Promise<ExportResultPayload> =>
  ipcRenderer.invoke(CHANNELS.exportExpenseByNature, req),
```

### 2.3. Xử lý Main Process trong `src/main/index.ts`
```ts
ipcMain.handle(IPC.exportExpenseByNature, async (_e, rawReq: unknown) => {
  const req = rawReq as ExportExpenseByNatureRequest
  const win = mainWindow ?? undefined
  const defaultName = req.suggestedName || `MaTran-ChiPhi-YeuTo-12M-${req.fiscalYear || '2026'}.xlsx`

  const save = await dialog.showSaveDialog(win as BrowserWindow, {
    title: 'Xuất Ma Trận Chi Phí Theo Yếu Tố (12 Tháng & Chi Tiết Tài Khoản)',
    defaultPath: defaultName,
    filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }],
  })

  if (save.canceled || !save.filePath) {
    return { ok: false, outPath: null }
  }

  const wb = buildExpenseByNatureWorkbook(req.report, req.clientName, req.fiscalYear)
  await wb.xlsx.writeFile(save.filePath)
  return { ok: true, outPath: save.filePath }
})
```

### 2.4. Cập nhật UI trong `ExpenseByNatureTable.tsx`
Trên thanh `nature-matrix-head`:
Thêm nút xuất Excel cạnh cụm nút chuyển chế độ `Số tiền (VNĐ)` / `Tỷ trọng %`:
```tsx
<button
  type="button"
  className="btn-export-nature-excel"
  onClick={() => void handleExportExcel()}
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: '#15803d',
    color: '#ffffff',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(21, 128, 61, 0.25)',
  }}
>
  <IconFileSpreadsheet size={15} />
  <span>Xuất Excel Ma Trận Chi Tiết</span>
</button>
```

Khi bấm nút:
- Gọi `window.auditsoft.exportExpenseByNature(...)`.
- Nếu thành công, tự động gọi `window.auditsoft.openPath(res.outPath)` hoặc `showItemInFolder`.

---

## 3. Kiểm Thử Toàn Diện
- [ ] Chạy `npm run typecheck` xác nhận type-safe 100%.
- [ ] Chạy `npx vitest run` đảm bảo không phát sinh regression.
- [ ] Mở ứng dụng, vào phân hệ Phân tích, cuộn xuống bảng Chi Phí Theo Yếu Tố.
- [ ] Bấm nút "Xuất Excel Ma Trận Chi Tiết" $\rightarrow$ Chọn vị trí lưu $\rightarrow$ Mở file kiểm tra định dạng dọc (12 tháng) và ngang (tài khoản chi tiết).
