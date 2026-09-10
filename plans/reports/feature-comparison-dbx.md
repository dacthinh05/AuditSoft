# Báo Cáo Đánh Giá & So Sánh Kiến Trúc: t8y2/dbx vs. AuditSoft

- **Nguồn đánh giá**: `https://github.com/t8y2/dbx` (v0.5.x, mã nguồn mở Apache-2.0)
- **Dự án hiện tại**: `AuditSoft` (`auditsoft-nkc`, v1.1.6)
- **Chế độ đánh giá**: `--compare` (Phân tích đối chuẩn kiến trúc, tính khả thi & tiềm năng ứng dụng)
- **Ngày thực hiện**: 2026-09-10

---

## 1. Tóm Tắt Tổng Quan (Executive Summary)

**`t8y2/dbx` là gì?**  
`dbx` là một công cụ quản lý cơ sở dữ liệu (Database Management Tool) đa nền tảng thế hệ mới, viết bằng **Rust & Tauri**, dung lượng siêu nhẹ (~20 MB), hỗ trợ hơn 90 hệ quản trị CSDL (MySQL, PostgreSQL, SQL Server, Oracle, SQLite, DuckDB, Redis, MongoDB, ClickHouse...). Dự án tích hợp sẵn MCP (Model Context Protocol) Server cho AI Coding Agent, trình duyệt dữ liệu trực quan (Data Grid, Data Diff, Lineage, Visual Query Plan) và các phiên bản Desktop / Web (Docker) / CLI.

**`AuditSoft` là gì?**  
`AuditSoft` là ứng dụng desktop (Electron + React 18 + TypeScript) chuyên biệt dành cho **Kiểm toán viên tài chính và Kế toán doanh nghiệp tại Việt Nam**, tập trung vào việc tự động hóa các nghiệp vụ kiểm toán theo chuẩn mực Việt Nam (VSA): Đối chiếu 2 sổ NKC, Bốc mẫu kiểm toán VSA 530, Chuyển đổi tờ khai thuế eTax XML TT 80/2021, Phân tích cơ bản VSA 520 (EBITDA 30%, VSA 550) và Hợp nhất giấy làm việc B410 / VACPA.

### Kết luận nhanh: `dbx` có giúp được `AuditSoft` không?

| Hướng tiếp cận | Khả thi | Đánh giá & Khuyến nghị |
| :--- | :---: | :--- |
| **1. Ghép mã nguồn trực tiếp (Port / Copy code)** | ❌ **KHÔNG** | Khác biệt hoàn toàn về ngôn ngữ (Rust vs. TypeScript) và nghiệp vụ cốt lõi (Quản trị CSDL dev vs. Nghiệp vụ kiểm toán tài chính). |
| **2. Tích hợp làm tiện ích nạp dữ liệu ERP (ERP Connector)** | ⭐ **RẤT TIỀM NĂNG** | Kế thừa ý tưởng kết nối trực tiếp CSDL kế toán doanh nghiệp (SQL Server/MISA, MySQL, PostgreSQL, Bravo, FAST) thay vì bắt người dùng xuất file Excel thủ công. |
| **3. Học hỏi Engine phân tích dữ liệu lớn (DuckDB/SQLite)** | ⭐⭐⭐ **GIÁ TRỊ CAO NHẤT** | `dbx` khai thác sức mạnh của **DuckDB/SQLite** để truy vấn dữ liệu dạng bảng tốc độ cao. AuditSoft có thể nhúng DuckDB (node-api / duckdb-wasm) để xử lý sổ NKC hàng triệu dòng thay cho mảng JavaScript V8 in-memory. |
| **4. Học hỏi UX Data Diff & Virtual Grid** | ⭐⭐ **TIỀM NĂNG** | Cải thiện bảng đối chiếu chênh lệch dữ liệu (NKC trước/sau kiểm toán) bằng giải pháp Virtualized Data Grid mượt mà như DB client. |
| **5. Công cụ bổ trợ onsite (Companion Tool)** | ⭐⭐ **THỰC TẾ** | Sử dụng `dbx` như công cụ độc lập khi KTV đi kiểm toán hiện trường để mở/khảo sát database backup (`.mdf`, `.sqlite`, `.duckdb`) của khách hàng trước khi đưa vào AuditSoft. |

---

## 2. Bảng So Sánh Đối Đầu (Head-to-Head Comparison)

| Tiêu chí | Nguồn (`t8y2/dbx`) | Dự án hiện tại (`AuditSoft`) | Phân tích & Đánh giá |
| :--- | :--- | :--- | :--- |
| **Mục tiêu sản phẩm** | Quản lý, truy vấn và quản trị CSDL cho Developer / DBA | Trợ lý tự động hóa kiểm toán tài chính & thuế cho KTV / Kế toán | **Khác biệt hoàn toàn**: Người dùng AuditSoft không biết viết SQL; họ cần nút bấm nghiệp vụ (B410, VSA 530, VSA 520). |
| **Tech Stack cốt lõi** | **Rust** (`dbx-core`, `tokio`, `sqlx`, `tower`) + **Tauri** | **TypeScript** + **Node.js** + **Electron 33** + **React 18** | **Không tương thích trực tiếp**: Không thể bê code Rust vào app Electron TS mà không sinh gánh nặng FFI / IPC phức tạp. |
| **Dung lượng đóng gói** | Siêu nhẹ (~15–20 MB nhờ Tauri dùng WebView2 có sẵn) | ~80–120 MB (Bộ cài NSIS/Portable đóng gói kèm Chromium V8) | **Bài học kiến trúc**: Về lâu dài, AuditSoft có thể nghiên cứu kiến trúc Tauri/Rust nếu muốn giảm kích thước app và tăng tốc độ. |
| **Nguồn dữ liệu đầu vào** | Kết nối mạng trực tiếp tới 90+ CSDL (TCP port, connection string) | File Excel cục bộ (`.xlsx`, `.xls`) và file XML thuế (`HTKK`, `eTax`) | **Khoảng trống cần mở rộng**: AuditSoft hiện bị phụ thuộc vào chất lượng xuất file Excel của phần mềm kế toán. |
| **Xử lý dữ liệu lớn** | Cơ chế stream, cursor, backend OLAP (DuckDB, ClickHouse) | Node.js `worker_threads` + Mảng in-memory JS (`NormalizedEntry[]`) | **Điểm AuditSoft cần học hỏi**: Khi NKC vượt quá 200.000 dòng, V8 Heap tốn nhiều RAM; tiếp cận OLAP (DuckDB) giải quyết triệt để bài toán này. |
| **Giao diện so sánh dữ liệu** | Data Diff giữa 2 bảng/query, hiển thị trực quan các dòng lệch | Tab "Đối Chiếu 2 Sổ NKC" (Lệch tiền, Thừa, Thiếu) | **Tương đồng logic**: Cả hai đều giải quyết bài toán Data Reconciliation, `dbx` có kinh nghiệm tối ưu render hàng chục nghìn cell. |
| **AI & Giao thức tích hợp** | Tích hợp sẵn MCP Server để Cursor / Claude Code truy vấn schema | Chưa có MCP server, các hàm tính toán chạy deterministic thuần | **Định hướng tương lai**: AuditSoft có thể mở MCP Server nội bộ để AI Agent hỗ trợ KTV đặt câu hỏi tự nhiên về dữ liệu kiểm toán. |
| **Môi trường vận hành** | Hỗ trợ Desktop, Docker Web server, CLI | 100% Offline Desktop (bảo mật dữ liệu tài chính theo VSA 200) | **Lưu ý an toàn**: `dbx` từng có CVE-2026-55642 trên bản web; AuditSoft chạy offline local hoàn toàn nên an toàn hơn. |

---

## 3. Đánh Giá Theo Khung Phản Biện (Challenge Framework)

### Câu hỏi 1: AuditSoft có nên tích hợp toàn bộ `dbx` vào làm một phân hệ trong phần mềm không?
- **Cách làm của `dbx`**: Xây dựng một trình quản lý CSDL vạn năng cho lập trình viên (viết câu lệnh SQL, quản lý kết nối, xem quan hệ bảng).
- **Thực tế của `AuditSoft`**: Kiểm toán viên và kế toán viên không muốn và không có kỹ năng quản trị CSDL hoặc viết câu lệnh `SELECT ... JOIN`. Họ chỉ quan tâm: *"Bút toán này sai ở đâu?", "Bốc mẫu 50 mẫu theo VSA 530 ra sao?", "Chỉ tiêu B4 thuế TNDN bao nhiêu?"*.
- **Rủi ro nếu làm theo nguồn**: Làm ứng dụng cồng kềnh, phân tán trọng tâm nghiệp vụ, gây quá tải giao diện cho người dùng phi kỹ thuật.
- **Khuyến nghị**: **KHÔNG tích hợp cả công cụ `dbx`**. Chỉ chắt lọc tư duy kết nối dữ liệu và xử lý engine.

### Câu hỏi 2: Có nên chuyển đổi cơ chế đọc dữ liệu của AuditSoft từ File Excel sang Database Connection giống `dbx`?
- **Cách làm của `dbx`**: Yêu cầu IP, Port, Username, Password, Database Name để kết nối và kéo dữ liệu.
- **Thực tế của `AuditSoft`**: Tại Việt Nam, 95% khách hàng được kiểm toán gửi dữ liệu cho công ty kiểm toán qua file Excel (Sổ NKC, Sổ Cái, Bảng CĐSPS). Nhiều doanh nghiệp không cho phép KTV cắm máy tính trực tiếp vào máy chủ CSDL vì lý do an ninh mạng nội bộ.
- **Rủi ro nếu làm theo nguồn**: Nếu AuditSoft chỉ hỗ trợ kết nối CSDL mà bỏ bê luồng Excel/XML thì phần mềm sẽ mất đi 90% tính hữu dụng trong thực tế.
- **Khuyến nghị**: Giữ **Excel và XML là kênh dữ liệu chính (Primary Source)**. Xem xét phát triển tính năng phụ (Add-on): *"Nạp nhanh từ CSDL MISA/FAST/SQL Server"* dành riêng cho kiểm toán nội bộ hoặc doanh nghiệp triển khai onsite.

### Câu hỏi 3: AuditSoft có nên thay thế in-memory JavaScript bằng Engine DuckDB/SQLite như `dbx`?
- **Cách làm của `dbx`**: Sử dụng DuckDB làm engine phân tích dữ liệu dạng cột (columnar) siêu nhanh cho dữ liệu local (Parquet, CSV, SQLite).
- **Thực tế của `AuditSoft`**: Hiện tại, khi người dùng nạp sổ NKC 200.000 dòng, AuditSoft nạp toàn bộ vào RAM dưới dạng mảng Object TypeScript. Cách này đơn giản nhưng chạm trần hiệu năng khi dữ liệu lên tới 500.000 – 1.000.000 dòng (dễ chạm V8 Out of Memory hoặc giật lag UI).
- **Rủi ro nếu không cải tiến**: Không xử lý được các cuộc kiểm toán của tập đoàn, doanh nghiệp bán lẻ lớn với hàng triệu dòng bút toán.
- **Khuyến nghị**: **NÊN ÁP DỤNG**. AuditSoft nên nghiên cứu đưa DuckDB (thư viện `@duckdb/node-api` hoặc `duckdb-wasm`) vào tầng Domain/Worker. Khi import file Excel, stream dữ liệu thẳng vào bảng tạm DuckDB, các phép tính VSA 520 (EBITDA, Pareto, quét bên liên quan) và VSA 530 sẽ chạy bằng SQL analytical cực kỳ nhanh (dưới 100ms cho 1 triệu dòng).

### Câu hỏi 4: Có nên chuyển đổi toàn bộ AuditSoft từ Electron sang Rust/Tauri giống `dbx` để đạt dung lượng 20MB?
- **Cách làm của `dbx`**: Viết bằng Tauri + Rust, chia sẻ core logic qua `dbx-core`, nhắm tới mục tiêu hiệu năng cao và binary siêu nhẹ.
- **Thực tế của `AuditSoft`**: AuditSoft đã có hàng chục nghìn dòng code TypeScript hoàn chỉnh: domain logic kiểm toán VSA, B410 COM worker PowerShell, parsers XML thuế TT 80, xuất ExcelJS, giao diện React Tailwind. Việc rewrite sang Rust sẽ tốn nhiều tháng làm việc và tiềm ẩn rủi ro hồi quy (regression) cực lớn.
- **Rủi ro nếu làm theo nguồn**: Cháy tiến độ dự án, đội chi phí phát triển mà không mang lại giá trị nghiệp vụ kiểm toán trực tiếp nào mới cho người dùng.
- **Khuyến nghị**: **GIỮ NGUYÊN Electron + TypeScript**. Tối ưu dung lượng Electron hiện tại (dùng electron-builder nsis tối ưu, tree-shaking, dọn dependencies) thay vì rewrite sang Tauri/Rust.

### Câu hỏi 5: AuditSoft có thể học hỏi gì từ MCP Server của `dbx`?
- **Cách làm của `dbx`**: Cung cấp một MCP Server chuẩn để các mô hình ngôn ngữ lớn (Claude, Cursor, Windsurf) giao tiếp với CSDL.
- **Thực tế của `AuditSoft`**: Hiện tại KTV dùng AuditSoft hoàn toàn bằng giao diện đồ họa. Nhưng xu hướng kiểm toán năm 2026 đòi hỏi KTV có thể "chat" với sổ sách: *"Tìm cho tôi tất cả các hóa đơn mua vào trên 50 triệu ngày chủ nhật"* hoặc *"Liệt kê danh sách các khoản tạm ứng quá hạn 6 tháng"*.
- **Rủi ro nếu làm sai**: Gửi dữ liệu tài chính mật của khách hàng lên cloud LLM là vi phạm nghiêm trọng chuẩn mực VSA 200 và hợp đồng bảo mật (NDA).
- **Khuyến nghị**: Nếu xây dựng MCP Server hoặc AI Assistant cho AuditSoft, phải tuân thủ nguyên tắc **Local-first / Privacy-first**: chỉ chạy với Local LLM (Ollama, on-device SLM) hoặc chỉ gửi câu hỏi cấu trúc (metadata/schema) mà không rò rỉ chi tiết số liệu tài chính nếu không có sự cho phép của KTV.

---

## 4. Ma Trận Quyết Định (Decision Matrix)

| Hạng mục xem xét | Cách làm của `dbx` | Cách làm hiện tại của `AuditSoft` | Quyết định & Khuyến nghị |
| :--- | :--- | :--- | :--- |
| **Ngôn ngữ & Runtime** | Rust + Tauri (~20MB) | TypeScript + Node.js + Electron (~90MB) | **Giữ nguyên TypeScript/Electron**. Tập trung hoàn thiện tính năng nghiệp vụ kiểm toán. |
| **Xử lý dữ liệu lớn** | DuckDB / SQLite (OLAP engine) | JavaScript Array in-memory | **Học hỏi & Áp dụng**: Tích hợp DuckDB vào worker thread để mở rộng khả năng xử lý lên >1.000.000 dòng. |
| **Nguồn nạp dữ liệu** | 90+ Hệ quản trị CSDL qua mạng | File Excel (.xlsx) & File XML thuế | **Mở rộng trong tương lai**: Giữ Excel/XML làm trọng tâm; nghiên cứu thêm tính năng nạp thẳng từ CSDL SQL Server của MISA/FAST. |
| **Trải nghiệm So sánh (Diff)** | Bảng Data Diff đa chiều, virtualized | Tab So khớp 2 sổ NKC (Lệch tiền/Thừa/Thiếu) | **Học hỏi UX**: Tham khảo cách dbx bố trí thanh cuộn ảo (virtual scrolling) và highlight chênh lệch để bảng NKC mượt hơn. |
| **AI Integration** | MCP Server cho AI Coding Agent | Xử lý thuật toán deterministic nội bộ | **Khảo sát cho Roadmap**: Tận dụng chuẩn MCP nếu sau này AuditSoft tích hợp trợ lý AI kiểm toán nội bộ. |

---

## 5. Kế Hoạch Hành Động Thực Tế (Actionable Takeaways)

Nếu bạn muốn tận dụng giá trị từ `t8y2/dbx` cho dự án `AuditSoft`, đây là lộ trình 3 bước khả thi nhất:

1. **Bước 1 (Ứng dụng ngay trong công việc Onsite - No Code needed)**:
   - Trang bị `dbx` (bản portable/desktop) cho đội ngũ kiểm toán viên khi đi onsite tại khách hàng.
   - Khi khách hàng dùng phần mềm kế toán chạy SQL Server (như MISA SME, FAST, Bravo), KTV có thể dùng `dbx` kết nối xem cấu trúc bảng và trích xuất đúng các cột mà AuditSoft cần một cách nhanh chóng.

2. **Bước 2 (Nâng cấp Engine phân tích - High Impact)**:
   - Nghiên cứu tích hợp **DuckDB** (thư viện `@duckdb/node-api`) vào `src/workers/` của AuditSoft.
   - Toàn bộ dữ liệu sổ Nhật ký chung (NKC) khi import sẽ được đẩy vào DuckDB in-memory table.
   - Các phép kiểm toán phức tạp: Tính EBITDA 30% (NĐ 132), Lọc bên liên quan (VSA 550), Phân nhóm Pareto, Bốc mẫu MUS (VSA 530) sẽ được thực thi bằng câu lệnh SQL nội bộ siêu tốc, giảm 80% RAM tiêu thụ.

3. **Bước 3 (Module nâng cao: MISA / SQL Server Direct Importer)**:
   - Trong lộ trình dài hạn, phát triển một phân hệ *"Kết nối CSDL kế toán nội bộ"* sử dụng các driver kết nối nhẹ (như `tedious` cho SQL Server, `better-sqlite3` cho SQLite) để KTV chỉ cần nhập thông tin server là kéo được sổ kế toán vào AuditSoft.
