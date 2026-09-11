# Phase 3: Chốt Chặn Bản Quyền Đa Tầng Phía Main Process (MED-03)

## 1. Mục Tiêu
Thiết lập cơ chế phòng thủ chiều sâu (Defense-in-Depth) tại Main Process của Electron, đảm bảo người dùng không thể bypass kiểm tra bản quyền hoặc giới hạn số lượt dùng thử bằng cách mở DevTools và gọi trực tiếp IPC từ console.

## 2. Phân Tích Kỹ Thuật
- Hiện tại, hàm `useTrialExport()` chỉ được kiểm tra ở giao diện người dùng React (Renderer).
- Các handler ở Main Process:
  - `IPC.generateWorkingPapers` (`src/main/index.ts:317`)
  - `IPC.exportReport` (`src/main/index.ts:196`)
  - `IPC.consolidateB410` (`src/main/index.ts:371`)
  chỉ nhận payload và thực thi ghi file ra đĩa.
- **Giải pháp:**
  1. Trong Main Process, trước khi thực hiện xuất file, kiểm tra trạng thái bản quyền hoặc yêu cầu Renderer cung cấp token / machineId để xác thực lại chữ ký số Ed25519 (sử dụng hàm `verifyLicense` có sẵn bằng `node:crypto`).
  2. Lưu trữ an toàn trạng thái bản quyền / số lượt dùng thử vào một tệp cấu hình cục bộ được bảo vệ trong thư mục `app.getPath('userData')` (ví dụ: `auditsoft_sec.json` hoặc tương tự) để Main Process có thể tự kiểm tra độc lập với `localStorage`.
  3. Từ chối yêu cầu (throw Error) nếu chưa kích hoạt bản quyền và đã hết số lượt dùng thử miễn phí.

## 3. Các Bước Thực Hiện
1. **Xây dựng module lưu trữ an toàn phía Main Process (`src/main/mainLicenseGuard.ts`)**:
   - Đọc/Ghi file cấu hình bản quyền tại `app.getPath('userData')/license_store.json`.
   - Cung cấp hàm `assertCanExport(actionName: string): { allowed: boolean; message?: string }`.
   - Nếu máy chưa kích hoạt: Đếm số lần xuất thực tế, vượt quá `MAX_TRIAL_EXPORTS` (20 lượt) thì chặn đứng và ném lỗi có mô tả rõ ràng.
   - Nếu máy đã kích hoạt: Xác thực lại chữ ký số Ed25519 bằng `MASTER_PUBLIC_KEY_BASE64`. Nếu chữ ký hợp lệ thì cho phép xuất không giới hạn.
2. **Đồng bộ trạng thái khi Renderer kích hoạt key**:
   - Thêm IPC `IPC.syncLicenseToken` để khi người dùng kích hoạt thành công trên giao diện, Renderer gửi token sang Main Process để lưu trữ bền vững.
3. **Gắn chốt chặn vào các IPC Handlers trong `src/main/index.ts`**:
   - `IPC.generateWorkingPapers`: gọi `assertCanExport('Tạo Giấy làm việc')`.
   - `IPC.exportReport`: gọi `assertCanExport('Xuất Báo cáo Đối chiếu NKC')`.
   - `IPC.consolidateB410`: gọi `assertCanExport('Tổng hợp B410')`.
   - `IPC.exportExpenseByNature`: gọi `assertCanExport('Xuất Ma trận Chi phí Yếu tố')`.

## 4. Tiêu Chí Hoàn Thành (Acceptance Criteria)
- [ ] Mọi lệnh xuất file Excel đều phải đi qua chốt chặn an ninh Main Process.
- [ ] Khi hết 20 lượt dùng thử và không có key VIP, gọi IPC trực tiếp sẽ nhận `Error: Đã hết số lượt dùng thử miễn phí`.
- [ ] Kích hoạt key hợp lệ mở khóa xuất file vĩnh viễn ở cả UI và Main Process.
- [ ] Không làm suy giảm hiệu năng xử lý file.
