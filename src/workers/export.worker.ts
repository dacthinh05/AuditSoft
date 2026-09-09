import { parentPort, workerData } from 'node:worker_threads'
import fs from 'node:fs'
import path from 'node:path'
import { buildReportWorkbook } from '../infrastructure/excel/exportWorkbook'
import type { ExportRunRequest } from '../shared/ipc'

if (!parentPort) {
  throw new Error('export.worker chỉ chạy trong worker_threads')
}
const port: NonNullable<typeof parentPort> = parentPort

const startedAt = Date.now()

function post(percent: number): void {
  port.postMessage({
    type: 'progress',
    payload: { phase: 'exporting', processed: percent, total: 100, percent, elapsedMs: Date.now() - startedAt },
  })
}

async function main(): Promise<void> {
  try {
    const req = workerData as ExportRunRequest
    if (!req.outPath) throw new Error('Thiếu đường dẫn xuất file (outPath)')

    post(5)
    const wb = buildReportWorkbook({ result: req.result, excludeKetChuyen: req.excludeKetChuyen })
    post(70)

    fs.mkdirSync(path.dirname(req.outPath), { recursive: true })
    await wb.xlsx.writeFile(req.outPath)
    post(100)

    port.postMessage({ type: 'done', payload: { ok: true, outPath: req.outPath } })
  } catch (err) {
    port.postMessage({ type: 'error', message: err instanceof Error ? err.message : String(err) })
  }
}

void main()
