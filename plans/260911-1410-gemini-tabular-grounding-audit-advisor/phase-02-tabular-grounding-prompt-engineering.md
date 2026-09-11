---
phase: 2
title: "Thiết Kế Prompt Engineering Bảng Biểu Tabular Grounding & Anti-Hallucination"
status: completed
priority: P1
effort: 1h
files_modified:
  - src/main/services/GeminiService.ts
---

# Phase 2: Thiết Kế Prompt Engineering Bảng Biểu Tabular Grounding & Anti-Hallucination

## 1. Mục Tiêu

Viết lại toàn diện hàm `buildVsa520Prompt()` trong `src/main/services/GeminiService.ts` để cấu trúc toàn bộ dữ liệu đầu vào thành các Bảng Markdown chuẩn (Markdown Tables), đồng thời thiết lập hệ thống chỉ thị kiểm toán (Audit Directives) nghiêm ngặt nhằm chống ảo giác số liệu và gắn chặt kết quả đầu ra với các Giấy làm việc thực tế của KTV (A710, G353, E300).

## 2. Chi Tiết Các Bước Thực Hiện

### 2.1. Thiết lập 5 Bảng Dữ Liệu Markdown Chuẩn trong Prompt:
1. **BẢNG 1: KẾT QUẢ KINH DOANH SO SÁNH NIÊN ĐỘ (YOY B02)**
   - Cột: `| Khoản Mục BCTC | Năm Trước (N-1) | Năm Nay (N) | Chênh Lệch (VNĐ) | Tăng/Giảm (%) |`
   - Dòng: Doanh thu thuần (511), Giá vốn (632), Lợi nhuận gộp, Chi phí tài chính, Chi phí bán hàng (641), Chi phí QLDN (642), Lợi nhuận thuần từ HĐKD, LNTT.
2. **BẢNG 2: MA TRẬN 12 THÁNG — DOANH THU, GIÁ VỐN & CHI PHÍ SẢN XUẤT THỰC TẾ**
   - Cột: `| Tháng | Doanh Thu 511 | Giá Vốn 632 | Biên Gộp (%) | CPSX Phát Sinh | CPSX/DT (%) | Đánh Giá Sơ Bộ |`
   - Dòng: Tháng 01 đến Tháng 12 + Dòng Tổng Cả Năm. Đánh dấu cờ đỏ tại các tháng có bất thường (biên âm, dồn giá vốn cuối năm, chênh lệch CPSX vs 632).
3. **BẢNG 3: CHI PHÍ HOẠT ĐỘNG (OPEX 641 / 642)**
   - Trình bày tổng chi phí 641, 642, tỷ lệ OPEX/Doanh thu và bảng các tiểu khoản chi phí chiếm tỷ trọng lớn (Chi phí nhân viên, Khấu hao, Dịch vụ mua ngoài...).
4. **BẢNG 4: RỦI RO TUÂN THỦ THUẾ TNDN & CHI PHÍ LOẠI TRỪ CHỈ TIÊU B4**
   - Cột: `| Chuyên Đề Rủi Ro Thuế | Số Vụ / Giao Dịch | Tổng Giá Trị (VNĐ) | Rủi Ro & Cơ Sở Pháp Lý |`
   - Dòng: Chi tiền mặt $\ge 20$ triệu / $\ge 5$ triệu (NĐ 181/TT 78), Tiền phạt VPHC tài khoản 811, Chi phí không hóa đơn hợp pháp, Ước tính điều chỉnh tăng thu nhập chịu thuế (Chỉ tiêu B4) và Thuế TNDN truy thu tạm tính (20%).
5. **BẢNG 5: GIAO DỊCH BÊN LIÊN QUAN & RỦI RO TẬP TRUNG (PARETO)**
   - Danh sách bên liên quan cho vay/mượn 0% lãi hoặc tạm ứng kéo dài.
   - Tỷ trọng Top 5 khách hàng (% doanh thu) và Top 5 nhà cung cấp (% mua hàng).

### 2.2. Xây dựng Audit Grounding Directives (Chỉ thị Chống Ảo Giác):
- **Vai trò:** Senior Audit Partner (FCCA / CPA Việt Nam) với hơn 15 năm kinh nghiệm thực chiến theo VSA 520 và VAS / Thông tư 200.
- **Ràng buộc Grounding:**
  + Tuyệt đối chỉ sử dụng số liệu có trong các bảng được cung cấp. Cấm tự bịa đặt hoặc giả định các con số không tồn tại.
  + Nếu một bảng số liệu không có dữ liệu (ví dụ không có năm trước hoặc không phát sinh chi tiền mặt), ghi rõ *"Đơn vị không phát sinh hoặc chưa đủ dữ liệu để đánh giá"*.
  + Bắt buộc trích dẫn con số cụ thể kèm tháng/kỳ và tỷ lệ % chênh lệch khi đưa ra nhận xét phản biện.
- **Bối cảnh thực tế bổ sung:** Nếu có `auditorContextNote`, đưa vào phần bối cảnh đặc thù để AI kết hợp phân tích.

### 2.3. Chuẩn hóa Cấu trúc Đầu ra (Output Sections):
Yêu cầu đầu ra gồm 4 phần tương ứng các Giấy làm việc:
- `### I. ĐÁNH GIÁ TỔNG QUAN HIỆU QUẢ HOẠT ĐỘNG & BCTC (GIẤY LÀM VIỆC A710)`
- `### II. PHÂN TÍCH MA TRẬN GIÁ VỐN 12M & RỦI RO CUTOFF / NGUYÊN TẮC PHÙ HỢP (GIẤY LÀM VIỆC G353)`
- `### III. ĐÁNH GIÁ CHI PHÍ HOẠT ĐỘNG & RỦI RO THUẾ TNDN CHỈ TIÊU B4 (GIẤY LÀM VIỆC E300)`
- `### IV. THỦ TỤC KIỂM TOÁN CHI TIẾT ĐỀ XUẤT (VSA 500 / VSA 520)`

## 3. Tiêu Chí Nghiệm Thu (Pass Criteria)
- Prompt sinh ra đầy đủ 5 bảng Markdown chuẩn xác, căn lề thẳng hàng, không có `NaN`, không có `undefined`.
- Chỉ thị Grounding rõ ràng, bảo đảm Gemini phản hồi bám sát dữ liệu và phân chia đúng 4 phần chuẩn mực.
