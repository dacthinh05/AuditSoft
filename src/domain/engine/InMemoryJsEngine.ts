import type { EngineStats, IAuditDataEngine, JournalEntryRecord } from './IAuditDataEngine'

/**
 * Động cơ dữ liệu thuần JavaScript (Pure In-Memory V8 Engine)
 * Đóng vai trò Fallback an toàn 100%, bảo đảm ứng dụng hoạt động thông suốt
 * ngay cả khi môi trường không có DuckDB hoặc native runtime.
 */
export class InMemoryJsEngine implements IAuditDataEngine {
  public readonly engineType = 'in_memory_js'
  public readonly isAccelerated = false

  private records: JournalEntryRecord[] = []
  private loadStartTime = 0
  private totalLoadTimeMs = 0

  public async initialize(): Promise<void> {
    this.records = []
  }

  public async destroy(): Promise<void> {
    this.records = []
  }

  public async bulkInsert(
    newRecords: JournalEntryRecord[],
    onProgress?: (inserted: number, total: number) => void
  ): Promise<number> {
    this.loadStartTime = Date.now()
    const total = newRecords.length
    const chunkSize = 10000

    for (let i = 0; i < total; i += chunkSize) {
      const chunk = newRecords.slice(i, i + chunkSize)
      this.records.push(...chunk)
      if (onProgress) {
        onProgress(Math.min(i + chunk.length, total), total)
      }
    }

    this.totalLoadTimeMs = Date.now() - this.loadStartTime
    return this.records.length
  }

  public async getRowCount(): Promise<number> {
    return this.records.length
  }

  public async getTotalAmount(): Promise<bigint> {
    let sum = 0n
    for (const r of this.records) {
      sum += r.amount
    }
    return sum
  }

  public async getStats(): Promise<EngineStats> {
    return {
      engineType: this.engineType,
      isAccelerated: this.isAccelerated,
      totalRows: this.records.length,
      totalAmount: await this.getTotalAmount(),
      loadTimeMs: this.totalLoadTimeMs,
    }
  }

  public async clear(): Promise<void> {
    this.records = []
    this.totalLoadTimeMs = 0
  }

  public getRecords(): JournalEntryRecord[] {
    return this.records
  }

  /**
   * Bộ thực thi truy vấn SQL tương thích cho In-Memory JS:
   * Hỗ trợ các mẫu câu truy vấn kiểm toán cơ bản của AuditSoft.
   */
  public async query<T = Record<string, unknown>>(sql: string, _params?: unknown[]): Promise<T[]> {
    const normalized = sql.trim().toUpperCase()

    // 1. SELECT COUNT(*), SUM(amount) FROM journal_entries
    if (normalized.includes('COUNT(*)') && normalized.includes('SUM(AMOUNT)')) {
      return [
        {
          count: this.records.length,
          total_amount: (await this.getTotalAmount()).toString(),
        } as unknown as T,
      ]
    }

    // 2. EBITDA queries
    if (normalized.includes('TOTAL_INTEREST_EXPENSE') && normalized.includes('TOTAL_INTEREST_INCOME')) {
      return [this.calculateEbitdaComponents() as unknown as T]
    }

    // 3. Pareto queries: GROUP BY partner_code ORDER BY total_amount DESC
    if (normalized.includes('GROUP BY PARTNER_CODE') || normalized.includes('GROUP BY 1')) {
      const isSales = normalized.includes("511%") || normalized.includes("CREDIT_ACCOUNT LIKE '511%'")
      return this.calculatePareto(isSales) as unknown as T[]
    }

    // 4. Trend 12M: GROUP BY month, account_group
    if (normalized.includes('EXTRACT(MONTH') || normalized.includes('MONTH') && normalized.includes('ACCOUNT_GROUP')) {
      return this.calculate12MTrend() as unknown as T[]
    }

    // 5. Related party scans
    if (normalized.includes("DEBIT_ACCOUNT LIKE '128%'") || normalized.includes("CREDIT_ACCOUNT LIKE '341%'")) {
      return this.scanRelatedParties() as unknown as T[]
    }

    // 6. Generic SELECT * FROM journal_entries LIMIT N
    const limitMatch = normalized.match(/LIMIT\s+(\d+)/)
    const limit = limitMatch?.[1] ? parseInt(limitMatch[1], 10) : 50
    return this.records.slice(0, limit).map((r) => ({
      id: r.id,
      entry_date: r.entryDate,
      doc_no: r.docNo,
      doc_date: r.docDate,
      description: r.description,
      debit_account: r.debitAccount,
      credit_account: r.creditAccount,
      amount: r.amount.toString(),
      partner_code: r.partnerCode,
      partner_name: r.partnerName,
      source_row: r.sourceRow,
    })) as unknown as T[]
  }

  // --- Các helper mô phỏng kết quả SQL trên JS Array ---

  private calculateEbitdaComponents(): Record<string, string> {
    const interestExpenseRegex = /lãi\s+vay|tiền\s+vay|interest|vay\s+ngân\s+hàng/i
    const interestIncomeRegex = /lãi\s+(tiền\s+gửi|cho\s+vay|tài\s+khoản|tiết\s+kiệm)/i

    let totalInterestExpense = 0n
    let totalInterestIncome = 0n
    let totalDepreciation = 0n

    for (const r of this.records) {
      if (r.debitAccount.startsWith('635')) {
        const descMatch = interestExpenseRegex.test(r.description)
        const creditPair =
          r.creditAccount.startsWith('111') ||
          r.creditAccount.startsWith('112') ||
          r.creditAccount.startsWith('338') ||
          r.creditAccount.startsWith('341')
        if (descMatch || creditPair || r.debitAccount.startsWith('6351')) {
          totalInterestExpense += r.amount
        }
      }

      if (r.creditAccount.startsWith('515')) {
        const descMatch = interestIncomeRegex.test(r.description)
        const debitPair =
          r.debitAccount.startsWith('111') ||
          r.debitAccount.startsWith('112') ||
          r.debitAccount.startsWith('128')
        if (descMatch || debitPair || r.creditAccount.startsWith('5151')) {
          totalInterestIncome += r.amount
        }
      }

      if (r.debitAccount.startsWith('214') || r.creditAccount.startsWith('214')) {
        totalDepreciation += r.amount
      }
    }

    return {
      total_interest_expense: totalInterestExpense.toString(),
      total_interest_income: totalInterestIncome.toString(),
      total_depreciation: totalDepreciation.toString(),
    }
  }

  private calculatePareto(isSales: boolean): Record<string, unknown>[] {
    const partnerMap = new Map<string, { name: string; total: bigint }>()

    for (const r of this.records) {
      const match = isSales
        ? r.creditAccount.startsWith('511')
        : (r.debitAccount.startsWith('15') || r.debitAccount.startsWith('6')) && r.creditAccount.startsWith('331')

      if (match) {
        const code = r.partnerCode || 'CHUA_MA'
        const existing = partnerMap.get(code)
        if (existing) {
          existing.total += r.amount
          if (!existing.name && r.partnerName) existing.name = r.partnerName
        } else {
          partnerMap.set(code, { name: r.partnerName || code, total: r.amount })
        }
      }
    }

    const sorted = Array.from(partnerMap.entries())
      .map(([code, data]) => ({ partner_code: code, partner_name: data.name, total_amount: data.total }))
      .sort((a, b) => (b.total_amount > a.total_amount ? 1 : b.total_amount < a.total_amount ? -1 : 0))

    let grandTotal = 0n
    for (const item of sorted) grandTotal += item.total_amount

    let runningTotal = 0n
    return sorted.slice(0, 50).map((item) => {
      runningTotal += item.total_amount
      const sharePct = Number((item.total_amount * 10000n) / grandTotal) / 100
      const cumPct = Number((runningTotal * 10000n) / grandTotal) / 100
      return {
        partner_code: item.partner_code,
        partner_name: item.partner_name,
        total_amount: item.total_amount.toString(),
        share_pct: sharePct,
        cumulative_pct: cumPct,
        is_top_80: cumPct <= 80.0,
      }
    })
  }

  private calculate12MTrend(): Record<string, unknown>[] {
    const matrix = new Map<string, bigint>()

    for (const r of this.records) {
      if (!r.entryDate) continue
      const parts = r.entryDate.split('-')
      const monthStr = parts[1]
      if (!monthStr) continue
      const month = parseInt(monthStr, 10)
      if (isNaN(month) || month < 1 || month > 12) continue

      const prefix = r.debitAccount.slice(0, 3)
      if (['632', '641', '642', '635', '811'].includes(prefix)) {
        const key = `${month}_${prefix}`
        matrix.set(key, (matrix.get(key) || 0n) + r.amount)
      }
    }

    const results: Record<string, unknown>[] = []
    for (const [key, total] of matrix.entries()) {
      const [m, acc] = key.split('_')
      if (!m || !acc) continue
      results.push({
        month: parseInt(m, 10),
        account_group: acc,
        total_amount: total.toString(),
      })
    }
    return results.sort((a, b) => (a.month as number) - (b.month as number))
  }

  private scanRelatedParties(): Record<string, unknown>[] {
    const suspicious: Record<string, unknown>[] = []
    for (const r of this.records) {
      const match =
        (r.debitAccount.startsWith('128') ||
          r.creditAccount.startsWith('341') ||
          r.creditAccount.startsWith('3388')) &&
        r.amount >= 100000000n // >= 100M

      if (match) {
        suspicious.push({
          id: r.id,
          doc_no: r.docNo,
          entry_date: r.entryDate,
          debit_account: r.debitAccount,
          credit_account: r.creditAccount,
          amount: r.amount.toString(),
          partner_code: r.partnerCode,
          partner_name: r.partnerName,
          description: r.description,
        })
      }
    }
    return suspicious
  }
}
