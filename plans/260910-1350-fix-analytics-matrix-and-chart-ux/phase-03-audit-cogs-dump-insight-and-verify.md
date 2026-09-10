# Phase 03: Bổ Sung Nhận Diện Rủi Ro Dồn Giá Vốn Cuối Năm (VSA 330/520) & Nghiệm Thu

## 1. Mục Tiêu
Nâng cấp thuật toán phân tích xu hướng trong `src/domain/analytics/Trend12MAnalyzer.ts` và giao diện `GlAnalyticsTab.tsx` để nhận diện chính xác "bệnh kinh niên" của kế toán Việt Nam: **Dồn giá vốn vào Tháng 12**, đưa ra nhận định kiểm toán sắc sảo thay vì để người dùng bối rối trước số liệu dị dạng.

## 2. Các Thay Đổi Chi Tiết

### 1. Nâng cấp Engine `src/domain/analytics/Trend12MAnalyzer.ts`:
- Bổ sung kiểm tra đặc thù dồn giá vốn cuối kỳ:
  ```ts
  const cogsRow = rows.find(r => r.key === 'COGS_632');
  if (cogsRow) {
    const cogsDec = moneyToNumber(cogsRow.months[11]);
    const cogsYear = moneyToNumber(cogsRow.total);
    if (cogsYear > 0 && (cogsDec / cogsYear) > 0.70) {
      warningNotes.push(
        `Phát hiện hiện tượng dồn giá vốn vào Tháng 12 (${(cogsDec / cogsYear * 100).toFixed(1)}% cả năm). Cần rà soát vi phạm Nguyên tắc Phù hợp (Matching Principle - VSA 330/520) hoặc thiếu trích trước giá vốn các tháng trước.`
      );
    }
  }
  ```

### 2. Hiển thị Banner Cảnh Báo Chuyên Sâu Trên Giao Diện:
- Khi phát hiện hiện tượng dồn giá vốn cuối năm, hiển thị thẻ cảnh báo nổi bật màu cam hổ phách ở ngay dưới biểu đồ tương quan:
  `Lưu ý kiểm toán: Doanh nghiệp không kết chuyển giá vốn đều theo từng tháng mà dồn 99.6% giá vốn (75 tỷ) vào Tháng 12. Điều này làm sai lệch biên lãi gộp các tháng 1–11 (ảo ở mức 100%) và gây biến động đột biến ở tháng 12. Kiểm toán viên cần thực hiện thủ tục kiểm tra trích trước chi phí và cắt niên độ (Cut-off VSA 560).`

### 3. Nghiệm Thu & Kiểm Thử Toàn Diện:
- Chạy `npm run typecheck` đạt 0 lỗi.
- Chạy toàn bộ test suites (`accounting-analytics-engines.test.ts`, `analytics.test.ts`, `volume.test.ts`).
- Kiểm tra hiển thị thực tế không còn emoji thừa thãi, giao diện đạt chuẩn SaaS chuyên nghiệp.

## 3. Tiêu Chí Nghiệm Thu
- Cảnh báo xuất hiện tự động khi dữ liệu có dấu hiệu dồn giá vốn tháng 12.
- Giải thích rõ ràng nguyên nhân thay vì để KTV cảm giác phần mềm "phân tích chưa ổn".
- Toàn bộ bài test và typecheck đạt 100% PASS.
