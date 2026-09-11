---
id: "phase-02"
name: "Tích hợp vào Pipeline chuẩn hóa dữ liệu (Standardize & Normalizer)"
plan: "plans/260911-1407-auto-extract-partner-from-accounts/plan.md"
status: "pending"
---

# Pha 2: Tích hợp vào Pipeline chuẩn hóa dữ liệu (Standardize & Normalizer)

## 1. Mục Tiêu
Tích hợp `PartnerExtractor` vào 2 luồng nạp dữ liệu chính của hệ thống:
1. `src/domain/pipeline/standardize.ts` (Dùng cho cả file import và clipboard trên Frontend).
2. `src/main/accounting/JournalNormalizer.ts` (Dùng cho ExcelImportService trên Backend/Main Process).

## 2. Các Bước Thực Hiện
1. Trong `standardize.ts`:
   - Nếu dòng bút toán có `partnerCodeRaw` bị trống:
     * Kiểm tra `debit` và `credit`.
     * Nếu một trong hai tài khoản thuộc nhóm công nợ (131, 331, 141...) có đuôi mã đối tác $\rightarrow$ Gán `partnerCode` và `partnerName` tương ứng.
2. Trong `JournalNormalizer.ts`:
   - Tương tự, nếu `objectCode` và `customerName` chưa có giá trị từ cột riêng $\rightarrow$ Tự động bóc tách từ `debit.code` hoặc `credit.code`.
   - Kết hợp với danh sách sheet `CDFS` (nếu có nạp) để ánh xạ tên công ty đầy đủ.

## 3. Tiêu Chí Nghiệm Thu
- [ ] Dòng bút toán sau khi qua normalize có trường `partnerCode` (hoặc `objectCode`) được điền tự động khi tài khoản có dạng `3311ABC`.
- [ ] Không làm phát sinh lỗi kiểu dữ liệu hoặc phá vỡ cấu trúc `JournalEntry`.
