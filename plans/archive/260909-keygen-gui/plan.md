# KẾ HOẠCH TRIỂN KHAI: AUDITSOFT KEYGEN STUDIO (GUI TẠO KEY NHANH)

## 1. Mục tiêu
Tạo công cụ GUI chạy cục bộ cực nhanh, trực quan, chuyên nghiệp để tạo License Key cho khách hàng sử dụng AuditSoft NKC:
- Người dùng chỉ cần nhấp đúp file `Tao-Key-Nhanh.bat`.
- Tự động bật HTTP server mini bảo mật nội bộ (chỉ bind localhost:7890).
- Tự động mở trình duyệt mặc định hiển thị giao diện tạo Key sang trọng, tối ưu cho việc copy gửi Zalo.
- Hỗ trợ lưu lịch sử Key đã tạo để tra cứu lại khi cần.

## 2. Các thành phần
1. `scripts/keygen-gui-server.mjs`:
   - HTTP server viết bằng Node.js thuần (ESM, không phụ thuộc thư viện ngoài).
   - Tự nạp `scripts/keys/master_private_key.pem`.
   - API endpoint:
     - `POST /api/generate`: nhận `{ machineId, customerName, plan, days }`, ký số Ed25519, verify lại bằng Public Key, trả về `{ success, licenseKey, info, zaloMessage }`.
     - `GET /api/history`: trả về danh sách key đã tạo gần nhất (lưu trong file `scripts/keys/keygen_history.json`).
     - `GET /`: phục vụ giao diện HTML/CSS/JS duy nhất, hiện đại, responsive.
2. `Tao-Key-Nhanh.bat`:
   - File batch ngoài thư mục gốc, gọi `node scripts/keygen-gui-server.mjs`.
   - Tự động gọi lệnh mở URL trên trình duyệt Windows.
3. Giao diện Web:
   - Header nhận diện thương hiệu AuditSoft & Tác giả Thịnh Lynx.
   - Form nhập:
     - Machine ID (hỗ trợ tự làm sạch input khi khách gửi chuỗi dính ký tự thừa như "AS 9F2A-88B1-C410", "AS-9F2A88B1C410", ...).
     - Tên khách hàng (mặc định "Kiểm toán viên VIP").
     - Chọn gói nhanh qua nút bấm: Vĩnh viễn (VIP), 1 Năm (365 ngày), Enterprise, Hoặc tự điền số ngày.
   - Kết quả:
     - Thẻ hiển thị License Key với nút 1-click Copy Key.
     - Thẻ hiển thị mẫu tin nhắn Zalo gửi khách (kèm nút 1-click Copy Tin Nhắn).
     - Badge xác thực chữ ký số "Ed25519 Verified ✓".
   - Bảng lịch sử Key đã tạo gần đây (có nút copy lại nhanh).

## 3. Tiêu chí nghiệm thu
- Chạy `Tao-Key-Nhanh.bat` mở được GUI ngay lập tức.
- Tạo key sinh ra chuẩn `ASKEY-...`, verify hợp lệ 100% với `MASTER_PUBLIC_KEY_BASE64` của app.
- Copy vào app chính AuditSoft NKC kích hoạt thành công.
