---
phase: 2
title: "Xây dựng AI Settings Modal và Nút Cấu Hình Topbar Kế Nút Cập Nhật"
status: "pending"
files_modified:
  - "src/renderer/components/Settings/AiConfigModal.tsx"
  - "src/renderer/App.tsx"
  - "src/renderer/styles.css"
---

# Phase 2: Xây dựng AI Settings Modal và Nút Cấu Hình Topbar Kế Nút Cập Nhật

## Mục tiêu
Tạo nút bấm `✨ AI Gemini` nằm ngay kế nút cập nhật phần mềm trên thanh Topbar (phía trên bên phải của ứng dụng) và xây dựng modal popup cấu hình API Key, chọn model `gemini-2.5-flash` kèm hướng dẫn trực quan cách lấy key miễn phí từ Google AI Studio.

## Chi tiết các bước thực hiện:

1. **Thêm nút Cấu hình AI trên Topbar (`src/renderer/App.tsx`)**:
   - Đặt trong `.header-right`, ngay bên trái nút Cập nhật (`.btn-update-header`).
   - Hiển thị nhãn: `✨ AI Gemini 2.5`.
   - Có đèn tín hiệu (dot indicator): Màu xanh lá khi đã lưu API key, màu xám khi chưa cấu hình.
   - Khi bấm: Kích hoạt `useApp.getState().setAiConfigModalOpen(true)`.

2. **Xây dựng `AiConfigModal.tsx`**:
   - Header: Logo biểu tượng AI lấp lánh + Tiêu đề *"Cấu hình Trợ Lý Kiểm Toán AI (Google Gemini 2.5)"*.
   - Input API Key: Dạng password có icon con mắt ẩn/hiện, nút Paste từ clipboard, nút Xóa key.
   - Model Selector: Radio button hoặc dropdown chọn giữa:
     - `gemini-2.5-flash` (Khuyến nghị — Mới nhất, cực nhanh, miễn phí)
     - `gemini-2.5-pro` (Suy luận chuyên sâu)
   - Nút "Kiểm tra kết nối" (Test Connection) gọi IPC ping Gemini:
     - Đang kiểm tra: Trạng thái loading.
     - Thành công: Hiện badge xanh *"✓ Kết nối thành công tới Gemini 2.5!"*.
     - Thất bại: Hiện badge đỏ kèm nguyên nhân (Sai key, Hết quota, Lỗi mạng).
   - **Khối hướng dẫn trực quan lấy API Key miễn phí (1 phút)**:
     - Bước 1: Bấm vào liên kết `https://aistudio.google.com/app/apikey` (tự động mở bằng trình duyệt mặc định qua `openExternalUrl`).
     - Bước 2: Đăng nhập tài khoản Google $\rightarrow$ Chọn **"Create API Key"**.
     - Bước 3: Sao chép chuỗi key (dạng `AIzaSy...`) và dán vào ô bên trên.
   - Cam kết bảo mật: Dòng ghi chú nhấn mạnh API key và dữ liệu chỉ lưu trên máy người dùng.

3. **CSS Styling (`src/renderer/styles.css`)**:
   - Nút topbar `.btn-ai-header`: Hiệu ứng chuyển sắc nhẹ nhàng, hover bóng đổ.
   - Modal `.ai-config-modal-box`: Thiết kế sang trọng, tối giản, chuẩn mực công cụ tài chính.
