---
title: "Phase 1: Thiết kế lại Typed JSON IR 3 Trụ Cột (3-Tier Pipeline)"
description: "Soạn thảo lại file docs/diagrams/auditsoft-architecture-map.json: 3 stages, 6 module nodes tương ứng 1-1 với Trang chủ, 5 dòng chảy thẳng một chiều."
status: completed
priority: P1
effort: "0.3h"
tags: ["json-ir", "archify", "dataflow", "stages"]
created: 2026-09-10
---

# Phase 1: Thiết kế lại Typed JSON IR 3 Trụ Cột (3-Tier Pipeline)

## Context & Objectives

Thay thế cấu trúc 4 stages và 12 nodes cũ bằng cấu trúc tinh gọn 3 stages và 6 nodes:

### 1. Cấu trúc 3 Stages (Cột)
1. `stage-ingest-reconcile`: "1. TIẾP NHẬN & ĐỐI CHIẾU SỔ SÁCH" (order: 0)
2. `stage-sampling`: "2. BỐC MẪU CHUẨN MỰC VSA 530" (order: 1)
3. `stage-reporting`: "3. BÁO CÁO & TỔNG HỢP HỒ SƠ" (order: 2)

### 2. Danh sách 6 Nodes (Module #01 -> #06)
- **Cột 1:**
  - `mod_reconcile`: "#02 Đối Chiếu 2 Sổ NKC" (role: "transform", input: 2 sổ NKC trước/sau kiểm toán)
  - `mod_analytics`: "#05 Phân Tích Cơ Bản & Rủi Ro" (role: "transform", input: NKC 12 tháng & Pareto đối tác)
  - `mod_etax`: "#04 Chuyển Đổi Tờ Khai eTax" (role: "transform", input: Tờ khai thuế XML QTT 03)
- **Cột 2:**
  - `mod_sampling`: "#03 Chọn Mẫu VSA 530" (role: "filter", bốc mẫu Key Items, MUS & Tự chọn rủi ro)
- **Cột 3:**
  - `mod_b410`: "#01 Tổng Hợp B410 Master" (role: "store", gộp tự động file sai sót chi tiết thành Master)
  - `mod_wp`: "#06 Lập 12 Giấy Làm Việc" (role: "sink", sinh bộ Working Papers hồ sơ mẫu VACPA)

### 3. Các Flows Chảy Thẳng (Không Chéo Cột)
1. `mod_reconcile` -> `mod_sampling`: "Bút toán chênh lệch trọng yếu"
2. `mod_analytics` -> `mod_sampling`: "Tháng biến động & Đối tác rủi ro cao"
3. `mod_etax` -> `mod_analytics`: "Dữ liệu thuế đối chiếu chéo"
4. `mod_sampling` -> `mod_b410`: "Danh sách mẫu & Sai sót phát hiện"
5. `mod_b410` -> `mod_wp`: "Đồng bộ số liệu vào hồ sơ VACPA"

## Verification
- File JSON hợp lệ theo schema `dataflow.schema.json`.
