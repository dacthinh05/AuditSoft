# Phase 1: Bổ Sung Bộ Icon SVG Thanh Mảnh (Lucide / Linear Style) Vào Icons.tsx

## 1. Mục Tiêu
Bổ sung các icon SVG vector đơn sắc chất lượng cao vào `src/renderer/components/Icons.tsx` để thay thế toàn bộ emoji:
- `IconSparkles`: Thay emoji `✨` (Trợ lý AI Gemini, Tạo nhận xét)
- `IconTarget`: Thay emoji `🎯` (Rủi ro phát hiện)
- `IconBuilding`: Thay emoji `🏛` (Bảng Tài khoản)
- `IconScale`: Thay emoji `⚖` (Đối chiếu số cái, Rủi ro cutoff)
- `IconTrendingUp`: Thay emoji `📈` (Báo cáo KQKD, Xu hướng 12M)
- `IconTrendingDown`: Thay emoji `📉` (Biến động chi phí)
- `IconCalendar`: Thay emoji `📅` (Biến động 12 tháng)
- `IconLightbulb`: Thay emoji `💡` (Gợi ý kiểm toán)
- `IconZap`: Thay emoji `⚡` (Kiểm tra kết nối API)
- `IconEye`, `IconEyeOff`: Thay emoji `👁️`, `🙈` (Ẩn/hiện mật khẩu API Key)
- `IconFlame`: Thay emoji `🔥` (Gói bản quyền)
- `IconBookOpen`: Thay emoji `📖` (Hướng dẫn)

## 2. Tiêu Chí Nghiệm Thu
- 100% SVG đồng bộ `strokeWidth={1.75}` hoặc `2`, `stroke="currentColor"`, kích thước linh hoạt theo `size`.
