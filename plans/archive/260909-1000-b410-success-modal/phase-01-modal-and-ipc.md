# Phase 1: IPC showItemInFolder & B410SuccessModal Component

## Overview
Triển khai IPC `showItemInFolder`, tạo component `B410SuccessModal.tsx` và gắn vào `B410DropZone.tsx`.

## Requirements
1. **IPC Layer**:
   - `src/shared/ipc.ts`: thêm `showItemInFolder: (targetPath: string) => Promise<void>`.
   - `src/main/index.ts`: gọi `shell.showItemInFolder(targetPath)`.
   - `src/preload/index.ts`: bridge function `showItemInFolder`.
2. **Modal Component**:
   - `B410SuccessModal.tsx`:
     - Props: `isOpen: boolean`, `outputPath?: string`, `message?: string`, `fileCount: number`, `onClose: () => void`.
     - Các action: `Mở file Excel ngay`, `Mở thư mục chứa file`, `Để sau`.
     - Hỗ trợ ESC và click backdrop để tắt.
3. **Integration**:
   - `B410DropZone.tsx`: Thay thế đoạn `window.confirm` bằng state `isSuccessModalOpen = true`.
