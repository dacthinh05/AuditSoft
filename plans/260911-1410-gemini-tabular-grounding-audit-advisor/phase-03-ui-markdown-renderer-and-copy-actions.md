---
phase: 3
title: "Nâng Cấp UI Renderer: Hỗ Trợ Bảng Markdown, Ô Nhập Ngữ Cảnh & Copy Phân Đoạn"
status: completed
priority: P1
effort: 1h
files_modified:
  - src/renderer/components/Analytics/AiAuditAdvisorPanel.tsx
  - src/renderer/styles.css
---

# Phase 3: Nâng Cấp UI Renderer: Hỗ Trợ Bảng Markdown, Ô Nhập Ngữ Cảnh & Copy Phân Đoạn

## 1. Mục Tiêu

Nâng cấp giao diện `AiAuditAdvisorPanel.tsx` và styles trong `styles.css` để:
1. Render bảng Markdown (`| ... |`) thành các table HTML đẹp mắt, rõ ràng thay vì in text thô.
2. Bổ sung ô nhập ghi chú ngữ cảnh đặc thù cuộc kiểm toán (tùy chọn).
3. Bổ sung các nút sao chép nhanh 1-click theo từng Giấy làm việc tương ứng (A710, G353, E300) bên cạnh nút sao chép toàn bộ.

## 2. Chi Tiết Các Bước Thực Hiện

### 2.1. Nâng cấp Parser Markdown trong `AiAuditAdvisorPanel.tsx`:
- Viết lại hàm render Markdown:
  + Phát hiện và parse các khối Table (`| Tiêu đề 1 | Tiêu đề 2 |` $\rightarrow$ thẻ `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`).
  + Hỗ trợ định dạng số tiền hoặc tỷ lệ % trong bảng nổi bật, dễ đọc.
  + Hỗ trợ các thẻ Heading `###`, danh sách bullet `- `, `+ `, `* ` và in đậm `**text**`.

### 2.2. Bổ sung Ô Nhập Ngữ Cảnh Kiểm Toán (Context Note):
- Dưới phần Hero hoặc trong thanh công cụ trước khi bấm phân tích:
  + Bổ sung ô input nhỏ có thể thu gọn/mở rộng: *"Ghi chú bối cảnh kiểm toán (tùy chọn)"* (Placeholder: *"Ví dụ: Doanh nghiệp mở rộng nhà máy trong Quý 3, chi phí nguyên vật liệu sắt thép tăng cao..."*).
  + Giá trị này được lưu tạm thời hoặc truyền thẳng vào payload khi bấm phân tích.

### 2.3. Bổ sung Action Buttons Sao Chép Phân Đoạn (Segment Copy):
- Trong thanh Action Bar khi đã có kết quả phân tích:
  + Nút 1: `📋 Sao chép toàn bộ`
  + Nút 2: `📄 Copy A710 (Tổng quan BCTC)`
  + Nút 3: `📒 Copy G353 (Giá vốn & Cutoff)`
  + Nút 4: `⚖️ Copy E300 (Thuế & Chi phí)`
- Xử lý logic trích xuất đoạn tương ứng dựa trên các thẻ heading `### I.`, `### II.`, `### III.` để copy chuẩn xác vào Clipboard kèm visual feedback (icon tick xanh trong 2 giây).

### 2.4. Tinh chỉnh CSS trong `src/renderer/styles.css`:
- Thiết kế style cho `.ai-markdown-table`:
  + Border thanh lịch, header màu `#f8fafc` chữ đậm `#334155`, padding `8px 12px`, số liệu căn phải.
  + Dòng hover sáng nhẹ, responsive với thanh cuộn ngang khi bảng nhiều cột.
- Thiết kế style cho thanh công cụ copy phân đoạn `.ai-segment-copy-group`.

## 3. Tiêu Chí Nghiệm Thu (Pass Criteria)
- Bảng Markdown được render thành HTML Table chuẩn đẹp mắt, không bị vỡ giao diện.
- Bấm copy từng phân đoạn trích xuất đúng nội dung của từng phần mà không bị lẫn phần khác.
- Ô nhập bối cảnh hoạt động mượt mà, không giật lag.
