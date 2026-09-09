import { parentPort, workerData } from 'node:worker_threads'
import { readSheetRowsDirect } from '../infrastructure/excel/readWorkbook'
import { readCsvMatrix } from '../infrastructure/excel/csvTable'
import { standardizeSource } from '../domain/pipeline/standardize'
import { runCorePipeline } from '../domain/pipeline/runPipeline'
import type { ProgressMessage, ProgressPhase, ReconcileResult } from '../domain/types'
import type { ReconcileRunRequest } from '../shared/ipc'

interface StartPayload {
  req: ReconcileRunRequest
}

if (!parentPort) {
  throw new Error('reconcile.worker chỉ chạy trong worker_threads')
}
const port: NonNullable<typeof parentPort> = parentPort

const { req } = workerData as StartPayload
const startedAt = Date.now()
let lastEmit = 0

function progressMessage(phase: ProgressPhase, processed: number, total: number): ProgressMessage {
  return {
    phase,
    processed,
    total,
    percent: total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0,
    elapsedMs: Date.now() - startedAt,
  }
}

function post(phase: ProgressPhase, processed: number, total: number): void {
  port.postMessage({ type: 'progress', payload: progressMessage(phase, processed, total) })
}

function postThrottled(phase: ProgressPhase, processed: number, total: number): void {
  const now = Date.now()
  if (now - lastEmit > 120) {
    lastEmit = now
    post(phase, processed, total)
  }
}

async function loadMatrix(
  filePath: string,
  sheetName: string,
  overrideRows: unknown[][] | undefined,
  onRows?: (p: number) => void,
): Promise<{ rows: unknown[][]; totalRows: number }> {
  if (overrideRows) return { rows: overrideRows, totalRows: overrideRows.length }
  if (filePath.toLowerCase().endsWith('.csv')) {
    const rows = await readCsvMatrix(filePath)
    return { rows, totalRows: rows.length }
  }
  return readSheetRowsDirect(filePath, sheetName, onRows)
}

async function main(): Promise<void> {
  try {
    post('reading_before', 0, 1)

    let beforeTotal = 1
    const beforeScan = await loadMatrix(req.before.filePath, req.before.sheetName, req.beforeRows, (p) => {
      if (beforeTotal < p) beforeTotal = p
      postThrottled('reading_before', p, beforeTotal)
    })
    beforeTotal = beforeScan.totalRows

    let afterTotal = 1
    const afterScan = await loadMatrix(req.after.filePath, req.after.sheetName, req.afterRows, (p) => {
      if (afterTotal < p) afterTotal = p
      postThrottled('reading_after', p, afterTotal)
    })
    afterTotal = afterScan.totalRows
    post('standardizing', 0, 1)

    const beforeStd = standardizeSource({
      rows: beforeScan.rows,
      firstDataRowIndex: req.before.headerRow,
      mapping: req.before.mapping,
    })
    const afterStd = standardizeSource({
      rows: afterScan.rows,
      firstDataRowIndex: req.after.headerRow,
      mapping: req.after.mapping,
    })
    post('reconciling', 60, 100)

    const core = runCorePipeline({
      before: req.before,
      after: req.after,
      beforeStandardized: beforeStd,
      afterStandardized: afterStd,
      options: {
        excludeKetChuyen: req.excludeKetChuyen,
        ignoreDescription: req.ignoreDescription,
        accountLevel: req.accountLevel,
      },
    })
    const result: ReconcileResult = {
      before: core.beforeStats,
      after: core.afterStats,
      beforeEntries: core.beforeEntries,
      afterEntries: core.afterEntries,
      diffRows: core.diffRows,
      summary: core.summary,
      inventory: core.inventory,
      groups: core.groups,
      entryTypeSummary: core.entryTypeSummary,
      bctc: core.bctc,
      errors: core.errors,
      matchedEqualCount: core.matchedEqualCount,
      startedAt,
      finishedAt: Date.now(),
    }

    post('reporting', 100, 100)
    port.postMessage({ type: 'done', payload: result })
  } catch (err) {
    port.postMessage({ type: 'error', message: err instanceof Error ? err.message : String(err) })
  }
}

void main()
