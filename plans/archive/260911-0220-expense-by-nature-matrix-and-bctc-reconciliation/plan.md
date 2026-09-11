---
title: "Module Phân Tích Chi Phí Theo Yếu Tố 12 Tháng (Expense By Nature) & Bảng Cân Đối Thuyết Minh BCTC"
description: "Xây dựng phân hệ bóc tách 5 yếu tố chi phí (NVL, Nhân công, Khấu hao, Dịch vụ mua ngoài, Chi phí khác) theo 12 tháng từ Sổ NKC, tự động lập Bảng kiểm tra cân đối Thuyết minh BCTC khớp đúng 100% công thức kiểm toán (Yếu tố chi phí + Biến động kho 154/155 = Tổng kết chuyển 911; Chênh lệch = 0), hiển thị trực quan trên Dashboard VSA 520 và điền tự động vào Sheet THUYET-MINH của file Master A-B-H."
status: completed
priority: P1
effort: 2.5h
branch: main
tags:
  - analytics
  - expense-by-nature
  - 12m-matrix
  - bctc-thuyet-minh
  - reconciliation
  - vsa520
created: 2026-09-11
---

# Kế Hoạch: Module Phân Tích Chi Phí Theo Yếu Tố 12M & Bảng Cân Đối Thuyết Minh BCTC

## 1. Bối Cảnh & Công Thức Cân Đối Vàng
- **Thuyết minh BCTC chuẩn mực (Thông tư 200 / VAS 01 — Mục Chi phí SXKD theo yếu tố):**
  Doanh nghiệp bắt buộc phải phân loại toàn bộ chi phí hoạt động thành 5 yếu tố cơ bản:
  1. Chi phí nguyên liệu, vật liệu (NVL): TK 621, hoặc chi phí vật tư từ 6272, 6412, 6422.
  2. Chi phí nhân công: TK 622, hoặc chi phí lương từ 6271, 6411, 6421.
  3. Chi phí khấu hao TSCĐ: Khấu hao trích từ TK 214 vào 6274, 6414, 6424.
  4. Chi phí dịch vụ mua ngoài: Điện, nước, viễn thông, thuê ngoài từ 6277, 6417, 6427.
  5. Chi phí khác bằng tiền: Tiếp khách, công tác phí, lệ phí từ 6278, 6418, 6428.
- **Phương trình đối chiếu kiểm toán (Audit Cross-Check Formula — Khớp 100% Ảnh người dùng):**
  $$\text{Tổng Chi Phí 5 Yếu Tố} = \text{NVL} + \text{Nhân công} + \text{Khấu hao} + \text{Dịch vụ ngoài} + \text{Chi phí khác}$$
  $$\text{Tổng CPSXKD trong kỳ} = \text{Tổng Yếu Tố} + (\text{Dở dang 154 ĐK} - \text{154 CK}) + (\text{Thành phẩm 155 ĐK} - \text{155 CK})$$
  $$\text{Tổng Chi Phí Kết Chuyển 911} = \text{Bút toán Nợ 911 / Có 632, 641, 642}$$
  $$\rightarrow \mathbf{\text{Độ lệch (YẾU TỐ CHI PHÍ)}} = \text{Tổng CPSXKD trong kỳ} - \text{Tổng Chi Phí Kết Chuyển 911} = \mathbf{0\ \text{đ}}!$$

## 2. Mục Tiêu (Outcome)
1. **Lõi tính toán `ExpenseByNatureEngine.ts`:**
   - Bóc tách chính xác 5 yếu tố chi phí theo từng tháng $1 \rightarrow 12$ từ sổ NKC.
   - Bóc tách số dư đầu năm và cuối năm của TK 154 (Dở dang) và TK 155 (Thành phẩm) từ CDFS.
   - Bóc tách tổng chi phí kết chuyển sang TK 911 (hoặc tổng phát sinh 632 + 641 + 642).
   - Kiểm tra cân đối tự động: Nếu độ lệch $= 0$, gắn cờ `isBalanced: true`.
2. **Component Giao Diện `ExpenseByNatureTable.tsx` trên Dashboard VSA 520:**
   - Hiển thị 2 khối chuyên nghiệp:
     * Khối 1: **Ma Trận Chi Phí Theo Yếu Tố 12 Tháng** (12 tháng x 5 yếu tố + Tổng yếu tố).
     * Khối 2: **Bảng Kiểm Tra Cân Đối Thuyết Minh BCTC** (khớp chuẩn 100% giao diện trong ảnh của anh, với các dòng cộng/trừ 154, 155 và dòng **YẾU TỐ CHI PHÍ = 0**).
3. **Điền tự động vào Sheet `THUYET-MINH` của file Master `A - B - H`:**
   - Đổ các số liệu này vào đúng các dòng 190 đến 204 của Sheet `THUYET-MINH` để file Master tự động nhảy ra kết quả đối chiếu chênh lệch $= 0$.

---

## 3. Lộ Trình Triển Khai (Phases)

| Phase | Nhiệm vụ chính | Files tác động |
| :--- | :--- | :--- |
| **Phase 1** | Xây dựng Module Lõi `ExpenseByNatureEngine.ts` & Types | `src/domain/analytics/ExpenseByNatureEngine.ts`<br>`src/domain/analytics/types.ts` |
| **Phase 2** | Xây dựng UI Component `ExpenseByNatureTable.tsx` & tích hợp vào Tab Analytics | `src/renderer/components/Analytics/ExpenseByNatureTable.tsx`<br>`src/renderer/components/Analytics/GlAnalyticsTab.tsx`<br>`src/renderer/styles.css` |
| **Phase 3** | Cập nhật `ABH_MasterFiller.ts` đổ vào Sheet `THUYET-MINH` | `src/domain/workingpaper/fillers/ABH_MasterFiller.ts` |
| **Phase 4** | Viết Unit Tests, kiểm thử toàn diện và nghiệm thu | `tests/expense-by-nature.test.ts`<br>`tests/workingpaper.test.ts` |
