import type { EngineStats, IAuditDataEngine, JournalEntryRecord } from './IAuditDataEngine'
import { DUCKDB_JOURNAL_SCHEMA_DDL, JOURNAL_ENTRIES_TABLE_NAME } from './schema'

/**
 * Động cơ dữ liệu nhúng DuckDB In-Process OLAP
 * Chạy trên nền tảng DuckDB C++ native hoặc WASM.
 * Tận dụng định dạng lưu trữ dạng cột (columnar storage) và vectorization để đạt tốc độ truy vấn gấp 30-50x.
 */
export class DuckDbEngine implements IAuditDataEngine {
  public readonly engineType = 'duckdb'
  public readonly isAccelerated = true

  private dbInstance: unknown = null
  private connection: unknown = null
  private rowCount = 0
  private loadStartTime = 0
  private totalLoadTimeMs = 0

  /** Kiểm tra xem môi trường hiện tại có hỗ trợ nạp DuckDB hay không */
  public static async isAvailable(): Promise<boolean> {
    try {
      // Thử nạp động gói duckdb nếu có
      // @ts-expect-error dynamic optional check
      const module = await import('@duckdb/node-api').catch(() => null)
      return module !== null
    } catch {
      return false
    }
  }

  public async initialize(): Promise<void> {
    this.loadStartTime = Date.now()
    try {
      // @ts-expect-error dynamic optional check
      const duckdbModule = await import('@duckdb/node-api').catch(() => null)
      if (!duckdbModule) {
        throw new Error('Gói @duckdb/node-api chưa được cài đặt hoặc không khả dụng.')
      }

      const instance = await duckdbModule.DuckDBInstance.create(':memory:')
      this.dbInstance = instance
      this.connection = await instance.connect()

      // Khởi tạo Schema DDL
      await this.run(DUCKDB_JOURNAL_SCHEMA_DDL)
    } catch (err) {
      throw new Error(`Khởi tạo DuckDbEngine thất bại: ${(err as Error).message}`)
    }
  }

  public async destroy(): Promise<void> {
    if (this.connection) {
      // @ts-expect-error close connection
      if (typeof this.connection.close === 'function') {
        // @ts-expect-error close connection
        await this.connection.close()
      }
      this.connection = null
    }
    this.dbInstance = null
    this.rowCount = 0
  }

  public async bulkInsert(
    records: JournalEntryRecord[],
    onProgress?: (inserted: number, total: number) => void
  ): Promise<number> {
    if (!this.connection) {
      throw new Error('DuckDbEngine chưa được khởi tạo.')
    }

    const total = records.length
    const chunkSize = 10000

    for (let i = 0; i < total; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize)
      
      // Tạo bulk insert statement
      const valuesSql = chunk
        .map((r) => {
          const escDesc = (r.description || '').replace(/'/g, "''")
          const escDoc = (r.docNo || '').replace(/'/g, "''")
          const escPCode = (r.partnerCode || '').replace(/'/g, "''")
          const escPName = (r.partnerName || '').replace(/'/g, "''")
          const dateVal = r.entryDate ? `'${r.entryDate}'` : 'NULL'
          const docDateVal = r.docDate ? `'${r.docDate}'` : 'NULL'
          return `('${r.id}', ${dateVal}, '${escDoc}', ${docDateVal}, '${escDesc}', '${r.debitAccount}', '${r.creditAccount}', ${r.amount.toString()}, '${escPCode}', '${escPName}', ${r.sourceRow})`
        })
        .join(',\n')

      const insertSql = `INSERT INTO ${JOURNAL_ENTRIES_TABLE_NAME} (id, entry_date, doc_no, doc_date, description, debit_account, credit_account, amount, partner_code, partner_name, source_row) VALUES ${valuesSql};`
      await this.run(insertSql)

      this.rowCount += chunk.length
      if (onProgress) {
        onProgress(Math.min(i + chunk.length, total), total)
      }
    }

    this.totalLoadTimeMs = Date.now() - this.loadStartTime
    return this.rowCount
  }

  public async query<T = Record<string, unknown>>(sql: string, _params?: unknown[]): Promise<T[]> {
    if (!this.connection) {
      throw new Error('DuckDbEngine chưa được khởi tạo.')
    }
    const conn = this.connection as { runAndReadAll: (s: string) => Promise<{ getRows: () => unknown[] }> }
    const reader = await conn.runAndReadAll(sql)
    const rows = reader.getRows() as T[]
    return rows
  }

  public async getRowCount(): Promise<number> {
    const res = await this.query<{ count: number }>(`SELECT COUNT(*) AS count FROM ${JOURNAL_ENTRIES_TABLE_NAME};`)
    return res[0]?.count ?? this.rowCount
  }

  public async getTotalAmount(): Promise<bigint> {
    const res = await this.query<{ total: string }>(`SELECT COALESCE(SUM(amount), 0)::VARCHAR AS total FROM ${JOURNAL_ENTRIES_TABLE_NAME};`)
    return BigInt(res[0]?.total ?? '0')
  }

  public async getStats(): Promise<EngineStats> {
    return {
      engineType: this.engineType,
      isAccelerated: this.isAccelerated,
      totalRows: await this.getRowCount(),
      totalAmount: await this.getTotalAmount(),
      loadTimeMs: this.totalLoadTimeMs,
    }
  }

  public async clear(): Promise<void> {
    if (this.connection) {
      await this.run(`DELETE FROM ${JOURNAL_ENTRIES_TABLE_NAME};`)
    }
    this.rowCount = 0
    this.totalLoadTimeMs = 0
  }

  private async run(sql: string): Promise<void> {
    // @ts-expect-error run SQL directly
    await this.connection.run(sql)
  }
}
