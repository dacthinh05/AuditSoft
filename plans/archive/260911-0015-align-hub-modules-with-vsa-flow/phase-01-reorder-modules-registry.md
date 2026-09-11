# Phase 1: Sắp xếp lại thứ tự & Đánh số mã MODULES_REGISTRY

## Mục tiêu
Đưa các module vào đúng trật tự thời gian và luồng nghiệp vụ kiểm toán thực tế: Đầu vào $\rightarrow$ Đánh giá rủi ro/Phân tích $\rightarrow$ Chọn mẫu chi tiết $\rightarrow$ Tổng hợp báo cáo/GLV $\rightarrow$ Tiện ích phụ trợ.

## Chi tiết thay đổi trong `src/renderer/config/modulesRegistry.ts`:
1. **01** - `reconcile_nkc`: Đối Chiếu 2 Sổ NKC (Nạp dữ liệu nguồn ① & ②)
2. **02** - `analytics_vsa520`: Phân Tích Sổ NKC — VSA 520 & Đồ Thị Tương Quan
3. **03** - `tax_stats_vsa520`: Thống Kê Thuế GTGT/TNCN & Đối Chiếu Sổ NKC
4. **04** - `tax_risk_scanner`: Rà Soát Rủi Ro Chi Phí Thuế & B4 QTT 03/TNDN (NĐ 181)
5. **05** - `sampling_vsa530`: Chọn Mẫu VSA 530 — Bốc Mẫu Kiểm Toán Chuyên Sâu
6. **06** - `wp_generator`: Lập 15 Giấy Làm Việc Tự Động (Working Papers)
7. **07** - `b410`: Tổng Hợp B410 — Bảng Tổng Hợp Sai Sót Kiểm Toán
8. **08** - `etax_qtt03`: Chuyển Đổi Tờ Khai eTax — Nâng Cấp TT 80 XML 2.9.4
9. **09** - `ai_audit_copilot`: Trợ Lý AI Soát Xét Báo Cáo Tài Chính (Coming soon)
