---
title: "Phase 4: UI Dashboard & PreliminaryAnalyticsPage"
description: "Xây dựng toàn bộ giao diện người dùng cho phân hệ Phân Tích Cơ Bản, tích hợp Tab 5 vào thanh điều hướng, cấu hình IPC Bridge và quản lý state trong Zustand Store."
status: planned
priority: P1
effort: "8h"
created: 2026-09-10
---

# Phase 4: UI Dashboard & PreliminaryAnalyticsPage

## 1. Mục Tiêu
Xây dựng giao diện trực quan, hiện đại và phản hồi tức thời cho kiểm toán viên trong `PreliminaryAnalyticsPage`:
1. Hiển thị bảng điều khiển rủi ro (KPI Cards) với cảnh báo đỏ khi lãi vay vượt trần 30% EBITDA theo Nghị định 132.
2. Hiển thị chi tiết bảng tính EBITDA, danh sách giao dịch nghi ngờ bên liên quan (0% lãi suất), bảng tỷ trọng Pareto khách hàng/nhà cung cấp và ma trận biến động 12 tháng.
3. Cung cấp vùng kéo thả (Dropzone) nhận nhanh file XML/ZIP tờ khai thuế GTGT và TNCN.
4. Hiển thị bảng thống kê tờ khai thuế và bảng đối chiếu chéo số liệu với sổ NKC.

## 2. Danh Sách Tệp Cần Tạo & Chỉnh Sửa

| Tệp | Trách Nhiệm |
|-----|-------------|
| `src/shared/ipc.ts` | Khai báo các kênh IPC: `analytics:run-gl-analysis`, `analytics:import-tax-xml`, `analytics:cross-reconcile`. |
| `src/main/ipc/analyticsHandlers.ts` | Đăng ký IPC handlers trong tiến trình Main, kết nối với các Domain Engines. |
| `src/renderer/state/store.ts` | Mở rộng Zustand Store: lưu trữ kết quả phân tích kế toán, danh sách tờ khai thuế đã nạp và kết quả đối chiếu chéo. |
| `src/renderer/components/Analytics/PreliminaryAnalyticsPage.tsx` | Trang phân tích chính, chứa bộ chuyển tab (`Phân tích Sổ NKC` vs `Thống kê Thuế`). |
| `src/renderer/components/Analytics/GlAnalyticsTab.tsx` | Tab phân tích sổ sách: 5 Thẻ KPI, Bảng EBITDA, Bảng Bên liên quan, Bảng Pareto Khách hàng/NCC, Ma trận 12 tháng. |
| `src/renderer/components/Analytics/TaxAnalyticsTab.tsx` | Tab thuế: Dropzone nạp file, Bảng Thống kê Thuế GTGT và TNCN, Bảng chênh lệch đối chiếu chéo. |
| `src/renderer/components/Analytics/TaxDropZone.tsx` | Component kéo thả file `.xml` hoặc `.zip` với hiệu ứng drag-over. |
| `src/renderer/App.tsx` | Bổ sung nút bấm Tab 5 `Phân Tích Cơ Bản` trên thanh điều hướng chính. |

## 3. Chi Tiết Triển Khai Giao Diện

### 3.1. Cập nhật `App.tsx` (Thanh điều hướng)
```tsx
<button
  type="button"
  className={`segmented-btn ${view === 'analytics' ? 'active' : ''}`}
  onClick={() => useApp.getState().setView('analytics')}
>
  <span className="step-badge">5</span>
  <span className="btn-label">Phân Tích Cơ Bản</span>
</button>
```

### 3.2. Cấu trúc State trong `src/renderer/state/store.ts`
```ts
interface AnalyticsState {
  glAnalyticsResult: GlAnalyticsResult | null;
  taxDeclarations: {
    vat: VatDeclarationSnapshot[];
    pit: PitDeclarationSnapshot[];
  };
  taxReconResult: TaxCrossReconciliationResult | null;
  isAnalyticsRunning: boolean;
  analyticsActiveSubTab: 'gl' | 'tax';
  
  setAnalyticsActiveSubTab: (tab: 'gl' | 'tax') => void;
  runGlAnalytics: () => Promise<void>;
  importTaxXmlFiles: (filePaths: string[]) => Promise<void>;
  runTaxCrossReconcile: () => Promise<void>;
}
```

### 3.3. 5 Thẻ KPI trong `GlAnalyticsTab.tsx`
1. **Lãi vay thuần**: Hiển thị số tiền phát sinh trong kỳ (TK 635 trừ TK 515).
2. **EBITDA**: Lợi nhuận thuần HĐKD + Lãi vay thuần + Khấu hao TK 214.
3. **Tỷ lệ Lãi vay / EBITDA**: Nếu $> 30\%$, thẻ đổi viền đỏ và hiển thị nhãn: `VƯỢT TRẦN 30%! Vượt [X] đ (Chỉ tiêu B4)`.
4. **Bên liên quan nghi ngờ**: Số lượng giao dịch vay/mượn không lãi suất.
5. **Tỷ trọng Top 5 Khách hàng**: Tỷ lệ % doanh thu đóng góp của 5 khách hàng lớn nhất.

### 3.4. Ma trận 12 tháng trong `GlAnalyticsTab.tsx`
- Bảng lưới gồm các hàng: Doanh thu (511), Mua hàng tồn kho (15x), Giá vốn (632), Chi phí bán hàng (641), Chi phí QLDN (642), Chi phí tài chính (635), Doanh thu tài chính (515), Chi phí khác (811).
- 12 Cột tháng (T1 đến T12) và Cột Tổng cả năm.
- Tự động highlight màu vàng/đỏ cho các ô tháng có biến động MoM $> 50\%$ kèm icon cảnh báo.

### 3.5. Dropzone & Bảng Đối Chiếu trong `TaxAnalyticsTab.tsx`
- Hỗ trợ kéo thả đồng thời nhiều tệp hoặc thư mục chứa các file XML/ZIP tờ khai thuế.
- Sau khi nạp, tự động hiển thị:
  + Bảng tổng hợp Thuế GTGT 4 Quý (Doanh thu [34], Thuế đầu vào [24]/[25], Thuế đầu ra [35], Thuế nộp [40], Khấu trừ chuyển kỳ sau [43]).
  + Bảng đối chiếu chéo với NKC: Doanh thu thuế vs Doanh thu 511, Thuế đầu ra vs Có 33311, Thuế đầu vào vs Nợ 1331.
  + Bảng tổng hợp Thuế TNCN: Số LĐ [16], Tổng TNCT [21], Thuế khấu trừ [29] vs Chi phí lương TK 334.

## 4. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
1. Bấm vào Tab 5 `Phân Tích Cơ Bản` chuyển view mượt mà, không bị chớp nháy.
2. Khi đã nạp sổ NKC từ Tab Setup, dữ liệu phân tích tự động hiển thị đầy đủ trên `GlAnalyticsTab`.
3. Khi kéo thả file XML thuế vào `TaxDropZone`, ứng dụng nhận diện và hiển thị các bảng thống kê thuế ngay lập tức.
4. Bảng đối chiếu chéo tính đúng các cột chênh lệch giữa Thuế và NKC.
5. Giao diện đáp ứng tốt cả màn hình laptop (1366x768) lẫn màn hình độ phân giải cao (Full HD / 2K), bảng cuộn ngang mượt mà.
