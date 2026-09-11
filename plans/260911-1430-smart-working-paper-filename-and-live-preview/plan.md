# Kế Hoạch Chuẩn Hóa Tên 15 Giấy Làm Việc Theo Đợt Kiểm Toán & Tên Công Ty (D1/D2)

## 1. Bối Cảnh & Quy Chuẩn Đặt Tên (Exact Specification)
Theo chỉ đạo chính xác của Kiểm toán viên:
> *"áp dụng chung cho 15 file, ví dụ D100 - Tien - [Tên muốn để] D1 2026 - [Tên người thực hiện]. Chọn đợt kiểm, khi D2 2026 là Đợt 2 2026"*

### Quy tắc ghép tên file chuẩn kiểm toán:
$$\text{[Mã GLV]} - \text{[Tên phần hành]} - \text{\textbf{[Tên công ty lưu file]}} \ \text{\textbf{[Đợt kiểm toán]}} \ \text{\textbf{[Năm]}} - \text{[Tên KTV].xlsx}$$

### Ví dụ thực tế:
- **Khi chọn Đợt 1 (D1):**
  - `D100 - Tien - LONG RICH D1 2026 - Thinh.xlsx`
  - `D500 - HTK - LONG RICH D1 2026 - Thinh.xlsx`
  - `G100 - Doanh thu - LONG RICH D1 2026 - Thinh.xlsx`
  - `A - B - H - Master - LONG RICH D1 2026 - Thinh.xlsx`
  - `Leadsheet - LONG RICH D1 2026 - Thinh.xlsx`
- **Khi chọn Đợt 2 (D2):**
  - `D100 - Tien - LONG RICH D2 2026 - Thinh.xlsx`
  - `D500 - HTK - LONG RICH D2 2026 - Thinh.xlsx`
  - `G100 - Doanh thu - LONG RICH D2 2026 - Thinh.xlsx`
- **Khi chọn Cả năm (hoặc không chia đợt):**
  - `D100 - Tien - LONG RICH 2026 - Thinh.xlsx`

---

## 2. Thiết Kế Giao Diện Mới (Bước 2 — WorkingPaperPage)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ BƯỚC 2: Thông Tin Hồ Sơ Kiểm Toán (ADD)                                         │
│                                                                                 │
│ Tên Khách hàng / Doanh nghiệp (Pháp lý đầy đủ in trên GLV):                     │
│ [ Công ty Cổ phần May Mặc Gia Công Test                                       ] │
│                                                                                 │
│ ┌──────────────────────────────────────┬──────────────────────────────────────┐ │
│ │ 🏷️ Tên công ty khi lưu file:         │ 🎯 Chọn đợt kiểm toán:               │ │
│ │ [ LONG RICH                        ] │ [ D1 (Đợt 1) ] [ D2 (Đợt 2) ] [Năm]  │ │
│ └──────────────────────────────────────┴──────────────────────────────────────┘ │
│ 👁️ Tên file mẫu sẽ xuất: D100 - Tien - LONG RICH D2 2026 - Thinh.xlsx            │
│                                                                                 │
│ Niên độ khóa sổ:               KTV thực hiện:                                   │
│ [ 31/12/2026           ]       [ Đắc Thịnh           ]                          │
│                                                                                 │
│ Đợt 1 (Interim / Giữa kỳ):     Đợt 2 (Final / Cuối kỳ):                         │
│ [ 01/01 - 30/06/2026   ]       [ 01/07 - 31/12/2026  ]                          │
│                                                                                 │
│ Tên Công ty Kiểm toán:                                                          │
│ [ Công ty TNHH Kiểm toán BẮC ĐẨU                                              ] │
│                                                                                 │
│ Thư mục lưu kết quả:                                                            │
│ [ HoSoKiemToan_LONGRICH_D2_2026                                              ]📁│
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Lộ Trình Triển Khai (Phased Roadmap)

| Phase | Nhiệm vụ chính | File tác động |
| :--- | :--- | :--- |
| **Phase 1** | Mở rộng `EngagementInfo` (`companyShortName`, `auditRound`) & Cập nhật `generateOutputFileName` | `src/domain/workingpaper/types.ts`<br>`src/domain/workingpaper/WorkingPaperGenerator.ts`<br>`src/main/index.ts` |
| **Phase 2** | Thêm ô `Tên công ty khi lưu file`, Segmented control `Chọn đợt kiểm (D1/D2/Năm)` & Live Preview | `src/renderer/pages/WorkingPaperPage.tsx`<br>`src/renderer/state/slices/engagementSlice.ts` |
| **Phase 3** | Tự động phân tích tên file nguồn (ví dụ: `LONG RICH 2025 - D2 - sau dc.xlsx`) để tự điền `LONG RICH` và chọn `D2` | `src/renderer/pages/WorkingPaperPage.tsx` |
| **Phase 4** | Viết Unit Test kiểm tra format tên file D1/D2, tính cân đối và nghiệm thu | `tests/workingpaper.test.ts` |

## 4. Tiêu Chí Nghiệm Thu
- [ ] 15 file GLV sinh ra có cấu trúc chính xác: `[Mã] - [Tên] - [Tên công ty lưu file] [D1/D2] [Năm] - [TênKTV].xlsx`.
- [ ] Ruột bên trong các sheet Excel vẫn in đúng tên pháp lý đầy đủ (`clientName`).
- [ ] Nạp file có tên `LONG RICH 2025 - D2...` $\rightarrow$ Tự động điền `LONG RICH` và tự động chọn đợt `D2`.
- [ ] Thanh Live Preview trên giao diện thay đổi thời gian thực theo từng tương tác của KTV.
- [ ] 100% test suite và typecheck vượt qua không lỗi.
