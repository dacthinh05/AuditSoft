# Phase 3: Dọn Dẹp Emoji Trên AI Advisor, B410 & Working Papers

## 1. Mục Tiêu
- **`AiAuditAdvisorPanel.tsx` & `AiConfigModal.tsx`**:
  + Header & Button: thay emoji `✨` bằng SVG `IconSparkles`.
  + Nút phân tích lại: thay `🔄` bằng SVG `IconRefresh`.
  + 4 Tags dữ liệu: bỏ `📊`, `📈`, `⚙️`, `⚖️`, chuyển sang tag tối giản viền mỏng.
  + Nút ẩn/hiện API Key: thay `🙈` và `👁️` bằng `IconEye` và `IconEyeOff`.
  + Hướng dẫn & Lưu ý: thay `📖`, `🔒`, `⚡` bằng SVG icons.
- **`B410DropZone.tsx`**:
  + Vùng thả file: thay emoji `📥` bằng SVG `IconDownloadCloud` hoặc `IconFileSpreadsheet`.
  + Nút tổng hợp: thay `🚀` và `⏳` bằng nhãn rõ ràng: *"Bắt đầu tổng hợp B410"* / *"Đang tổng hợp..."*.
- **`PreliminaryAnalyticsPage.tsx` & `WorkingPaperPage.tsx`**:
  + Bỏ các emoji `📥`, `📂`, `📑`, `⚠️`, thay bằng icon SVG thanh thoát.

## 2. Tiêu Chí Nghiệm Thu
- Toàn bộ các tương tác của người dùng không còn nhìn thấy emoji màu sắc lòe loẹt.
