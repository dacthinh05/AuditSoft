---
title: "Phase 1: Port TaxRecord XML Parsers & Data Types"
description: "Tái sử dụng và porting bộ công cụ đọc tờ khai thuế XML/ZIP từ dự án TaxRecord sang AuditSoft, bao gồm VatXmlParser (01/GTGT), PitXmlParser (05/KK, 05/QTT), LocalXmlIngestionEngine và thiết lập kiểu dữ liệu BigInt an toàn."
status: planned
priority: P1
effort: "6h"
created: 2026-09-10
---

# Phase 1: Port TaxRecord XML Parsers & Data Types

## 1. Mục Tiêu
Tái sử dụng các module đã kiểm chứng thực tế từ dự án `D:\Desktop\Project\1. TaxRecord` để mang khả năng nhận diện, giải nén và phân tích tờ khai thuế XML (Thuế GTGT và Thuế TNCN) vào `AuditSoft` mà không cần viết lại từ đầu.

## 2. Danh Sách Tệp Cần Tạo & Nguồn Tham Chiếu

| Tệp Mới Trong AuditSoft | Nguồn Từ TaxRecord | Trách Nhiệm |
|-------------------------|-------------------|-------------|
| `src/shared/types/taxAnalytics.ts` | `src/shared/vatAnalyticsTypes.ts` & `pitAnalyticsTypes.ts` | Khai báo các interface `VatDeclarationSnapshot`, `PitDeclarationSnapshot`, `VatIndicatorItem`, `TaxFilingItem` với tiền tệ `bigint`. |
| `src/domain/etax/parsers/VatXmlParser.ts` | `src/main/scanner/VatXmlParser.ts` | Parser tờ khai 01/GTGT: bóc tách chỉ tiêu [22] đến [43] chuẩn TT80 và TT cũ. |
| `src/domain/etax/parsers/PitXmlParser.ts` | `src/main/scanner/PitXmlParser.ts` | Parser tờ khai 05/KK-TNCN và 05/QTT-TNCN: bóc tách chỉ tiêu [16], [21], [26], [29], [31], [40], [41]. |
| `src/domain/etax/ingestion/ZipExtractor.ts` | `src/main/files/ZipExtractor.ts` | Giải nén file `.zip` chứa các tờ khai thuế vào thư mục tạm an toàn (`os.tmpdir()`), ngăn chặn path traversal. |
| `src/domain/etax/ingestion/LocalXmlIngestionEngine.ts` | `src/main/files/LocalXmlIngestionEngine.ts` | Nhận danh sách đường dẫn file (hoặc thư mục), tự động lọc file `.xml` và `.zip`, gọi parser thích hợp. |
| `tests/vat-pit-xml-parsers.test.ts` | - | Bộ unit test kiểm chứng độ chính xác khi đọc XML mẫu. |

## 3. Chi Tiết Kỹ Thuật & Code Snippets

### 3.1. Hợp đồng dữ liệu `taxAnalytics.ts`
```ts
export type TaxPeriodType = 'MONTH' | 'QUARTER' | 'YEAR' | 'UNKNOWN';
export type TaxDeclarationType = 'ORIGINAL' | 'SUPPLEMENTAL';

export interface VatIndicatorItem {
  code: string; // "22", "23", "24", "25", "26", "27", "28", "29", "34", "35", "40", "43"
  name: string;
  rawValue: string;
  numericValue: bigint;
}

export interface VatDeclarationSnapshot {
  taxpayerId: string;
  taxpayerName: string;
  formCode: string; // "01/GTGT"
  periodLabel: string; // "Q1/2025", "01/2025"
  year: number;
  periodKey: string; // "2025-Q1", "2025-M01"
  declarationType: TaxDeclarationType;
  supplementalNo: number; // 0 nếu chính thức, 1, 2, 3... nếu bổ sung
  submittedAt?: string;
  indicators: Record<string, VatIndicatorItem>;
  rawXml?: string;
}

export interface PitDeclarationSnapshot {
  taxpayerId: string;
  formCode: string; // "05/KK-TNCN" | "05/QTT-TNCN"
  periodLabel: string;
  year: number;
  periodKey: string;
  declarationType: TaxDeclarationType;
  supplementalNo: number;
  isFinalization: boolean; // true nếu là quyết toán năm 05/QTT
  ct16_tongSoNguoiLaoDong: bigint;
  ct21_tongThuNhapChiuThue: bigint;
  ct26_tongThuNhapChiuThueKhauTru: bigint;
  ct29_tongThueTncnDaKhauTru: bigint;
  ct31_qtt_tongThueDaKhauTruTrongNam?: bigint;
  ct40_qtt_tongThuePhaiNopTrongNam?: bigint;
}
```

### 3.2. Cài đặt phụ thuộc
- Kiểm tra `package.json` của `AuditSoft`: nếu chưa có `adm-zip`, cài đặt bổ sung:
  ```bash
  npm i adm-zip
  npm i -D @types/adm-zip
  ```

### 3.3. Tinh chỉnh từ TaxRecord sang AuditSoft
- Bỏ các phụ thuộc liên quan đến mạng / HTTP Portal (`TaxPortalClient`, `LegacyFilingClient`, Captcha...) chỉ giữ lại phần thuần túy phân tích file cục bộ (Offline / Local Ingestion).
- Chuẩn hóa hàm parse số tiền `parseMoneyToBigInt(str: string): bigint`:
  ```ts
  export function parseMoneyToBigInt(val: unknown): bigint {
    if (val == null) return 0n;
    const clean = String(val).replace(/[,.\s]/g, '').trim();
    if (!clean || clean === '-' || isNaN(Number(clean))) return 0n;
    try {
      return BigInt(clean);
    } catch {
      return 0n;
    }
  }
  ```

## 4. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
1. Cài đặt thành công `adm-zip` mà không làm vỡ build của Electron.
2. `VatXmlParser.parseVatXml()` đọc đúng toàn bộ các chỉ tiêu [22] -> [43] từ chuỗi XML của Thông tư 80/2021/TT-BTC.
3. `PitXmlParser.parsePitXml()` đọc đúng số lao động [16], thu nhập chịu thuế [21], thuế khấu trừ [29] từ tờ khai `05/KK-TNCN` và `05/QTT-TNCN`.
4. `LocalXmlIngestionEngine.ingestFiles()` nhận cả file `.xml` lẫn file `.zip`, tự động giải nén và phân loại trả về danh sách các bản khai VAT và PIT đã được chuẩn hóa.
5. Chạy lệnh kiểm thử `npm test tests/vat-pit-xml-parsers.test.ts` đạt kết quả 100% Pass.
