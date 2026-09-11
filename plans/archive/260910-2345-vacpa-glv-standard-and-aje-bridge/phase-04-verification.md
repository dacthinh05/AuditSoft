# Phase 4: Kiểm Thử Toàn Diện, Verify Bằng Microsoft Excel COM & Build

## Mục Tiêu
- Viết unit test case kiểm tra:
  + Dọn dẹp khoảng trắng tên sheet: các hàm tìm kiếm sheet không bị crash khi tên sheet đã chuẩn hóa.
  + Tính toán đúng điều chỉnh thuần AJE theo chiều dư Nợ / dư Có.
  + Điền đúng số liệu điều chỉnh vào Leadsheet `D 110`.
  + Ghi nhận đúng các ký hiệu chú thích Tickmarks.
- Chạy script kiểm chứng thực tế Microsoft Excel COM (`scripts/verify-all-12-glv-com.ts`) để đảm bảo cả 12 file mở bằng Microsoft Excel không gặp bất kỳ cảnh báo hoặc lỗi corrupt nào.
- Đảm bảo `npm run typecheck`, `npm run lint` và `npm test` pass 100%.
