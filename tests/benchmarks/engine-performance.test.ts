import { describe, expect, it } from 'vitest'
import { InMemoryJsEngine } from '../../src/domain/engine/InMemoryJsEngine'
import type { JournalEntryRecord } from '../../src/domain/engine/IAuditDataEngine'
import { SqlAnalyticsService } from '../../src/domain/analytics/sql/SqlAnalyticsService'

describe('Phase 5: Performance Benchmarking Test Suite', () => {
  it('Benchmark 50.000 dòng bút toán: Nạp dữ liệu và thực thi 4 bộ query kiểm toán', async () => {
    const engine = new InMemoryJsEngine()
    await engine.initialize()

    const count = 50_000
    const records: JournalEntryRecord[] = []

    const startGen = performance.now()
    for (let i = 1; i <= count; i++) {
      const month = (i % 12) + 1
      const monthStr = month < 10 ? `0${month}` : `${month}`
      records.push({
        id: `bench_${i}`,
        entryDate: `2024-${monthStr}-15`,
        docNo: `PC_${i}`,
        docDate: `2024-${monthStr}-15`,
        description: i % 5 === 0 ? 'Chi trả lãi vay ngân hàng định kỳ' : `Nghiệp vụ hạch toán ${i}`,
        debitAccount: i % 5 === 0 ? '6351' : i % 2 === 0 ? '1561' : '6421',
        creditAccount: i % 3 === 0 ? '1121' : '331',
        amount: BigInt((i % 1000 + 1) * 100_000), // 100k - 100M
        partnerCode: `PARTNER_${i % 100}`,
        partnerName: `Đối tác kiểm toán ${i % 100}`,
        sourceRow: i,
      })
    }
    const genTime = performance.now() - startGen

    // 1. Đo thời gian Bulk Ingestion
    const startInsert = performance.now()
    const inserted = await engine.bulkInsert(records)
    const insertTime = performance.now() - startInsert

    expect(inserted).toBe(count)
    expect(insertTime).toBeLessThan(1000) // Dưới 1 giây cho 50.000 dòng

    // 2. Đo thời gian thực thi EBITDA Analysis
    const startEbitda = performance.now()
    const ebitdaRes = await SqlAnalyticsService.runEbitdaAnalysis(engine, null)
    const ebitdaTime = performance.now() - startEbitda

    expect(ebitdaRes.ebitda).toBeDefined()
    expect(ebitdaTime).toBeLessThan(200) // Dưới 200ms

    // 3. Đo thời gian thực thi Pareto 80/20
    const startPareto = performance.now()
    const paretoRes = await SqlAnalyticsService.runParetoAnalysis(engine)
    const paretoTime = performance.now() - startPareto

    expect(paretoRes.topCustomers).toBeDefined()
    expect(paretoTime).toBeLessThan(200)

    // 4. Đo thời gian thực thi Ma trận 12 Tháng
    const start12M = performance.now()
    const trendRes = await SqlAnalyticsService.run12MTrendAnalysis(engine)
    const trendTime = performance.now() - start12M

    expect(trendRes.rows.length).toBe(5)
    expect(trendTime).toBeLessThan(100)

    // 5. Thống kê tổng hợp
    const stats = await engine.getStats()
    expect(stats.totalRows).toBe(count)

    console.log(`[Benchmark 50k Rows] Sinh dữ liệu: ${genTime.toFixed(1)}ms | Nạp DB: ${insertTime.toFixed(1)}ms | EBITDA: ${ebitdaTime.toFixed(1)}ms | Pareto: ${paretoTime.toFixed(1)}ms | 12M: ${trendTime.toFixed(1)}ms`)

    await engine.destroy()
  })
})
