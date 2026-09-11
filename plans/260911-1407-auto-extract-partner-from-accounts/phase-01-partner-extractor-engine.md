---
id: "phase-01"
name: "Xây dựng thuật toán bóc tách đối tượng PartnerExtractor"
plan: "plans/260911-1407-auto-extract-partner-from-accounts/plan.md"
status: "pending"
---

# Pha 1: Xây dựng thuật toán bóc tách đối tượng PartnerExtractor

## 1. Mục Tiêu
Tạo module độc lập `src/domain/analytics/PartnerExtractor.ts` xử lý việc nhận diện và bóc tách mã/tên đối tác từ tài khoản kế toán và diễn giải.

## 2. Các Mẫu Tài Khoản Phổ Biến Cần Hỗ Trợ
- **Công nợ phải trả (331)**:
  * `3311ABC` $\rightarrow$ Mã: `ABC`, TK chuẩn: `3311`
  * `3311_DBL` $\rightarrow$ Mã: `DBL`, TK chuẩn: `3311`
  * `331.VINAMILK` $\rightarrow$ Mã: `VINAMILK`, TK chuẩn: `331`
- **Công nợ phải thu (131)**:
  * `1311SH` $\rightarrow$ Mã: `SH`, TK chuẩn: `1311`
  * `1311-HLVT` $\rightarrow$ Mã: `HLVT`, TK chuẩn: `1311`
- **Tạm ứng & Phải thu khác (141, 1388, 3388)**:
  * `1411THINH` $\rightarrow$ Mã: `THINH`, TK chuẩn: `1411`
  * `1388_CTYA` $\rightarrow$ Mã: `CTYA`, TK chuẩn: `1388`

## 3. Thuật Toán Chi Tiết
```typescript
export interface ExtractedPartner {
  partnerCode: string | null
  partnerName: string | null
  cleanAccount: string
}

export function extractPartnerInfo(
  account: string,
  desc?: string,
  cdfsNamesMap?: Map<string, string>,
): ExtractedPartner {
  // 1. Kiểm tra nếu account bắt đầu bằng các đầu tài khoản đối tượng: 131, 331, 141, 138, 338
  // 2. Tách phần số chuẩn (3-4 chữ số đầu) và phần đuôi chữ cái/ký tự đặc biệt
  // 3. Nếu có phần đuôi chữ cái -> Lấy làm partnerCode
  // 4. Tra cứu cdfsNamesMap theo account gốc để lấy tên công ty đầy đủ
  // 5. Nếu không có CDFS -> Quét regex trong desc tìm tên công ty (CÔNG TY, CTY, TNHH, CP...)
}
```

## 4. Tiêu Chí Nghiệm Thu
- [ ] Hàm xử lý chính xác các trường hợp tài khoản có đuôi chữ, dấu gạch nối, dấu chấm.
- [ ] Không làm sai lệch các tài khoản số thuần túy (như `1111`, `1121`, `152`, `6421`).
