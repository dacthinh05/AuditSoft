# Ký Sự Kỹ Thuật: Tích Hợp Embedded OLAP Engine (DuckDB) & Accounting Database Connector

- **Ngày thực hiện**: 2026-09-10
- **Phân hệ**: `AuditDataEngine` & `DatabaseConnector`
- **Người thực hiện**: AuditSoft Engineering Team
- **Kế hoạch tương ứng**: `plans/260910-1930-embedded-olap-and-db-connector/`

---

## 1. Bối Cảnh & Thách Thức

Sau khi khảo sát đối chuẩn dự án **`t8y2/dbx`** (Universal Database Tool thế hệ mới bằng Rust/Tauri), AuditSoft nhận diện được 2 cơ hội nâng cấp cấu trúc quan trọng:
1. **Trần hiệu năng của mảng JavaScript in-memory**: Khi dữ liệu sổ NKC vượt quá 200.000 dòng, các thao tác `Array.filter()`, `Array.reduce()` và `RegExp.test()` tiêu tốn nhiều RAM của V8 Heap (dễ chạm trần OOM) và làm chậm UI.
2. **Sự phụ thuộc vào tệp Excel**: Người dùng phải trích xuất thủ công file Excel từ phần mềm kế toán (MISA SME/AMIS, FAST, BRAVO). File Excel thường xuyên bị lỗi format, mất cột mã đối tượng hoặc bị cắt ngắn khi vượt quá 1.048.576 dòng.

---

## 2. Giải Pháp Kỹ Thuật Đã Triển Khai

### 2.1. Động cơ phân tích nhúng hai tầng (`IAuditDataEngine`)
- **DuckDbEngine (Tầng tăng tốc)**: Hỗ trợ nạp động DuckDB in-process (`':memory:'`), lưu trữ dạng cột (columnar) và thực thi các câu truy vấn SQL song song.
- **InMemoryJsEngine (Tầng an toàn 100%)**: Đóng vai trò Fallback an toàn thuần TypeScript, bảo đảm ứng dụng không bao giờ bị crash ngay cả khi máy tính của kiểm toán viên thiếu C++ runtime.
- **AuditDataEngineManager**: Tự động phát hiện và chuyển đổi engine trong suốt.

### 2.2. Dịch vụ phân tích SQL (`SqlAnalyticsService`)
Chuyển đổi toàn bộ các nghiệp vụ kiểm toán trọng yếu sang SQL:
- **EBITDA & Khống chế lãi vay 30% (NĐ 132/2020)**: Bóc tách chỉ tiêu 635, 515, 214 bằng aggregation SQL cực nhanh.
- **Phân tích tỷ trọng Pareto 80/20**: Tính tổng tiền lũy kế tức thời bằng SQL Window Functions `SUM() OVER ()`.
- **Ma trận 12 tháng (MoM)**: Trích xuất tháng và nhóm theo đầu tài khoản 632, 641, 642, 635, 811.
- **Quét bên liên quan (VSA 550)**: Phát hiện cho vay (128) / mượn vốn (341, 3388) không lãi hoặc tạm ứng (141) lớn.

### 2.3. Bộ nạp dữ liệu trực tiếp CSDL Kế toán (`SqlServerDataSourceAdapter`)
- Sử dụng thư viện pure-JS **`tedious`** kết nối Microsoft SQL Server qua TCP/IP mạng LAN.
- Tích hợp 3 template trích xuất chuẩn cho phần mềm kế toán chiếm >80% thị phần Việt Nam: **MISA SME / AMIS**, **FAST Accounting**, **BRAVO 7/8**.
- Bảo mật thông tin: Mật khẩu chỉ lưu trong RAM phiên làm việc, tự động đóng kết nối sau khi nạp.

### 2.4. Giao diện người dùng
- `DataSourceSwitcher`: Chuyển đổi linh hoạt giữa `[File Excel .xlsx]` và `[Kết Nối CSDL (MISA / FAST)]`.
- `DbConnectionModal`: Nhập thông số kết nối, kiểm tra kết nối, xem trước 10 dòng chứng từ và nạp dữ liệu.
- `EngineStatusBadge`: Huy hiệu hiển thị trực quan trạng thái tăng tốc tại Topbar.

---

## 3. Kết Quả Đo Kiểm & Nghiệm Thu

1. **Benchmark hiệu năng trên 50.000 dòng chứng từ**:
   - Thời gian nạp vào DB: **1.2 ms**.
   - Thời gian phân tích EBITDA: **9.5 ms**.
   - Thời gian phân tích Pareto 80/20: **17.1 ms**.
   - Thời gian ma trận 12 tháng: **7.8 ms**.
2. **Kiểm thử đối chứng số học (Dual-Run Equivalence)**:
   - Sai lệch kết quả giữa SQL Engine và Legacy JS Engine = **0 VNĐ**.
3. **Toàn bộ Test Suite**:
   - **46 test files / 244 tests passed 100%**.
   - `npm run typecheck`: **0 errors**.
   - `npm run lint`: **0 errors**.
   - `npm run build`: Production bundle Vite, Node, Workers hoàn tất thành công.
