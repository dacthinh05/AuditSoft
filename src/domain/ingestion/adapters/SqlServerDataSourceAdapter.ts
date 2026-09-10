import { Connection, Request } from 'tedious'
type TediousConfig = ConstructorParameters<typeof Connection>[0]
import type { JournalEntryRecord } from '../../engine/IAuditDataEngine'
import type {
  ConnectionTestResult,
  DataSourceConnectionConfig,
  IDataSourceAdapter,
} from '../IDataSourceAdapter'
import { buildMisaExtractionQuery } from '../templates/MisaTemplate'
import { buildFastExtractionQuery } from '../templates/FastTemplate'
import { buildBravoExtractionQuery } from '../templates/BravoTemplate'

export class SqlServerDataSourceAdapter implements IDataSourceAdapter {
  public readonly name = 'Microsoft SQL Server (MISA / FAST / BRAVO)'
  public readonly supportedType = 'sql_server'

  /**
   * Tạo cấu hình kết nối Tedious từ DataSourceConnectionConfig
   */
  private makeTediousConfig(config: DataSourceConnectionConfig): TediousConfig {
    return {
      server: config.host,
      authentication: {
        type: 'default',
        options: {
          userName: config.username || '',
          password: config.password || '',
        },
      },
      options: {
        port: config.port || 1433,
        database: config.database,
        encrypt: config.options?.encrypt ?? false,
        trustServerCertificate: config.options?.trustServerCertificate ?? true,
        instanceName: config.options?.instanceName,
        rowCollectionOnRequestCompletion: true,
        connectTimeout: 10000,
        requestTimeout: 60000,
      },
    }
  }

  /**
   * Mở kết nối có Promise
   */
  private connect(tediousConfig: TediousConfig): Promise<Connection> {
    return new Promise((resolve, reject) => {
      const conn = new Connection(tediousConfig)
      conn.on('connect', (err) => {
        if (err) {
          reject(err)
        } else {
          resolve(conn)
        }
      })
      conn.on('error', (err) => {
        // Tránh unhandled error event
        console.error('SQL Server Connection Error:', err.message)
      })
      conn.connect()
    })
  }

  /**
   * Kiểm tra kết nối tới SQL Server và lấy danh sách Database có sẵn
   */
  public async testConnection(config: DataSourceConnectionConfig): Promise<ConnectionTestResult> {
    const tediousConfig = this.makeTediousConfig(config)
    let conn: Connection | null = null

    try {
      conn = await this.connect(tediousConfig)

      const databases: string[] = []
      let serverVersion = ''

      // 1. Kiểm tra version và databases
      await new Promise<void>((resolve, reject) => {
        const sql = `
          SELECT @@VERSION AS version;
          SELECT name FROM sys.databases WHERE state = 0 ORDER BY name;
        `
        const req = new Request(sql, (err) => {
          if (err) reject(err)
          else resolve()
        })
        req.on('row', (columns: { value: unknown }[]) => {
          const col0 = columns[0]
          if (col0 && columns.length === 1) {
            const val = String(col0.value || '')
            if (val.includes('Microsoft SQL Server')) {
              serverVersion = val.split('\n')[0]?.trim() || ''
            } else if (val) {
              databases.push(val)
            }
          }
        })

        conn?.execSql(req)
      })

      return {
        success: true,
        message: `Kết nối thành công tới ${config.host}:${config.port || 1433}`,
        databases,
        serverVersion,
      }
    } catch (err) {
      return {
        success: false,
        message: `Kết nối thất bại: ${(err as Error).message}`,
      }
    } finally {
      if (conn) {
        conn.close()
      }
    }
  }

  /**
   * Lựa chọn câu truy vấn dựa trên Preset phần mềm kế toán
   */
  private resolveQuery(config: DataSourceConnectionConfig, limit?: number): string {
    if (config.customQuery && config.customQuery.trim()) {
      return config.customQuery
    }
    switch (config.preset) {
      case 'MISA':
        return buildMisaExtractionQuery(config.fiscalYear, limit)
      case 'FAST':
        return buildFastExtractionQuery(config.fiscalYear, limit)
      case 'BRAVO':
        return buildBravoExtractionQuery(config.fiscalYear, limit)
      default:
        return buildMisaExtractionQuery(config.fiscalYear, limit)
    }
  }

  /**
   * Xem trước 10 dòng chứng từ
   */
  public async previewSample(
    config: DataSourceConnectionConfig,
    limit = 10
  ): Promise<JournalEntryRecord[]> {
    const tediousConfig = this.makeTediousConfig(config)
    let conn: Connection | null = null

    try {
      conn = await this.connect(tediousConfig)
      const sql = this.resolveQuery(config, limit)
      const records: JournalEntryRecord[] = []

      await new Promise<void>((resolve, reject) => {
        const req = new Request(sql, (err) => {
          if (err) reject(err)
          else resolve()
        })

        req.on('row', (columns: { metadata: { colName: string }; value: unknown }[]) => {
          const row: Record<string, unknown> = {}
          for (const col of columns) {
            if (col && col.metadata) row[col.metadata.colName] = col.value
          }

          records.push({
            id: String(row.id || `row_${records.length + 1}`),
            entryDate: row.entry_date ? String(row.entry_date) : null,
            docNo: String(row.doc_no || ''),
            docDate: row.doc_date ? String(row.doc_date) : null,
            description: String(row.description || ''),
            debitAccount: String(row.debit_account || ''),
            creditAccount: String(row.credit_account || ''),
            amount: BigInt(String(row.amount || '0')),
            partnerCode: String(row.partner_code || ''),
            partnerName: String(row.partner_name || ''),
            sourceRow: Number(row.source_row || records.length + 1),
          })
        })

        conn?.execSql(req)
      })

      return records
    } finally {
      if (conn) {
        conn.close()
      }
    }
  }

  /**
   * Tải toàn bộ chứng từ kế toán của năm tài chính
   */
  public async fetchJournalEntries(
    config: DataSourceConnectionConfig,
    onProgress?: (fetched: number) => void
  ): Promise<JournalEntryRecord[]> {
    const tediousConfig = this.makeTediousConfig(config)
    let conn: Connection | null = null

    try {
      conn = await this.connect(tediousConfig)
      const sql = this.resolveQuery(config)
      const records: JournalEntryRecord[] = []

      await new Promise<void>((resolve, reject) => {
        const req = new Request(sql, (err) => {
          if (err) reject(err)
          else resolve()
        })
        req.on('row', (columns: { metadata: { colName: string }; value: unknown }[]) => {
          const row: Record<string, unknown> = {}
          for (const col of columns) {
            if (col && col.metadata) row[col.metadata.colName] = col.value
          }

          records.push({
            id: String(row.id || `row_${records.length + 1}`),
            entryDate: row.entry_date ? String(row.entry_date) : null,
            docNo: String(row.doc_no || ''),
            docDate: row.doc_date ? String(row.doc_date) : null,
            description: String(row.description || ''),
            debitAccount: String(row.debit_account || ''),
            creditAccount: String(row.credit_account || ''),
            amount: BigInt(String(row.amount || '0')),
            partnerCode: String(row.partner_code || ''),
            partnerName: String(row.partner_name || ''),
            sourceRow: Number(row.source_row || records.length + 1),
          })

          if (onProgress && records.length % 5000 === 0) {
            onProgress(records.length)
          }
        })

        conn?.execSql(req)
      })

      if (onProgress) {
        onProgress(records.length)
      }

      return records
    } finally {
      if (conn) {
        conn.close()
      }
    }
  }
}
