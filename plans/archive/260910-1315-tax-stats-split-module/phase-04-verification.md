# Phase 4: Verification

## Goal
Toàn bộ thay đổi xanh: type, lint, tests, build.

## Steps
1. `npm run typecheck` — 0 errors (web/node/tests).
2. `npm run lint` — 0 errors/warnings.
3. `npm test` — 47+ files pass (hub-navigation đã cập nhật 6 modules).
4. `npm run build` — Vite + node + workers bundle thành công.
5. Smoke thủ công (`npm run dev`): Hub → 6 cards; Phân Tích GL-only; Thuế drop XML + CTA khi thiếu NKC.

## Acceptance
4 lệnh trên pass 100%; không regression flow cũ (B410, đối chiếu, sampling, QTT03).
