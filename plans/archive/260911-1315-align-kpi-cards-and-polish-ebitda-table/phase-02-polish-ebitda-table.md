# Giai đoạn 2: Tinh chỉnh typography và layout bảng Bóc Tách EBITDA

## Nhiệm vụ
1. Cấu hình độ rộng các cột trong bảng `Bóc Tách Lãi Vay & EBITDA (Nghị định 132/2020/NĐ-CP)`:
   - Cột 1 (Khoản Mục): `width: '45%'`, canh lề trái.
   - Cột 2 (Căn Cứ): `width: '25%'`, canh lề trái, màu trung tính dễ nhìn.
   - Cột 3 (Số Tiền VNĐ): `width: '30%'`, canh lề phải.
2. Tinh chỉnh font số tài chính:
   - Áp dụng `fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"`, `fontVariantNumeric: 'tabular-nums'`, `letterSpacing: '-0.01em'`.
   - Màu số bình thường: `#0f172a`, `fontWeight: 600`.
   - Dòng EBITDA: Nền `#eff6ff`, border `#bfdbfe`, text xanh `#1d4ed8`, `fontWeight: 700`.
   - Dòng Lãi vay vượt trần (Chỉ tiêu B4): Highlight rõ ràng, căn phải chuẩn, hiển thị `0 đ` hoặc số vượt trần màu đỏ/xanh rõ nét.
3. Thêm padding hợp lý (`padding: '8px 12px'`) và đường line phân tách viền mỏng `#f1f5f9` để mắt dễ quét hàng ngang.

## File chỉnh sửa
- `src/renderer/components/Analytics/GlAnalyticsTab.tsx`
