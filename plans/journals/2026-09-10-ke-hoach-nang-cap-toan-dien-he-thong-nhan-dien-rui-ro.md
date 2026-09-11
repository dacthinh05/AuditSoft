# Journal: Lập Kế Hoạch Nâng Cấp Toàn Diện Hệ Thống Nhận Diện Rủi Ro Kiểm Toán

- **Date**: 2026-09-10
- **Author**: AuditSoft Engineering
- **Plan**: `plans/260910-1000-core-audit-risk-engine-upgrade` (Validated OK, 4 phases)

## 1. Bối Cảnh & Vấn Đề
Người dùng đặt câu hỏi chuyên môn sâu về nghề kiểm toán: "Rủi ro thường sai chỗ nào, hãy nâng cấp toàn diện hệ thống nhận diện rủi ro?".
Qua khảo sát thực tế và phân tích codebase, hệ thống cảnh báo tự động thường gặp 3 lỗi lớn:
1. **Dương tính giả**: Bút toán kết chuyển 911 ngày 31/12 bị gắn cờ "bất thường cuối kỳ"; biến động số học nhỏ từ 1tr lên 3tr (+200%) gây báo động đỏ rác.
2. **Âm tính giả**: Bỏ lọt bẫy quỹ tiền mặt ảo (tồn quỹ lớn nhưng vẫn đi vay chịu lãi), cặp tài khoản cấm (mua TSCĐ bằng tiền mặt, xóa nợ 131 vào chi phí), ghi âm doanh thu Có 511, treo chi phí vào 242/241 để giấu lỗ.
3. **Mù trọng yếu**: Chưa áp dụng triệt để nguyên tắc trọng yếu kép (MoM % $\times$ Giá trị tuyệt đối $\ge$ CTT).

## 2. Giải Pháp Triển Khai (Phương Án A)
Quy hoạch 4 giai đoạn cụ thể:
1. **Phase 1**: Khử dương tính giả — loại trừ bút toán kết chuyển 911 khỏi các thuật toán rủi ro cuối kỳ; áp dụng cổng trọng yếu kép vào `Trend12MAnalyzer`.
2. **Phase 2**: Xây dựng 4 bẫy kiểm toán trọng yếu mới trong `src/main/risks/rules/FraudAuditRules.ts`: Quỹ tiền mặt ảo, Cặp TK đối ứng cấm, Ghi âm doanh thu 511, Treo chi phí giấu lỗ.
3. **Phase 3**: Phân tầng mức độ rủi ro CRITICAL / HIGH / MEDIUM / LOW, gắn nhãn chuẩn mực VSA 240, 330, 520 và nâng cấp UI rủi ro.
4. **Phase 4**: Viết unit tests kiểm chứng từng bẫy, kiểm tra hồi quy 60+ test files, typecheck và build production 100% Pass.
