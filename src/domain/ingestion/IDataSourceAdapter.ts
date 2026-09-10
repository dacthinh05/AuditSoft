import type { JournalEntryRecord } from '../engine/IAuditDataEngine'

export type AccountingSoftwarePreset = 'MISA' | 'FAST' | 'BRAVO' | 'CUSTOM'

export interface DataSourceConnectionConfig {
  type: 'sql_server' | 'sqlite' | 'mysql'
  preset: AccountingSoftwarePreset
  host: string
  port: number
  database: string
  username: string
  password?: string
  fiscalYear: number
  customQuery?: string
  options?: {
    encrypt?: boolean
    trustServerCertificate?: boolean
    instanceName?: string
  }
}

export interface ConnectionTestResult {
  success: boolean
  message: string
  databases?: string[]
  serverVersion?: string
}

export interface IDataSourceAdapter {
  readonly name: string
  readonly supportedType: 'sql_server' | 'sqlite' | 'mysql'

  testConnection(config: DataSourceConnectionConfig): Promise<ConnectionTestResult>
  previewSample(config: DataSourceConnectionConfig, limit?: number): Promise<JournalEntryRecord[]>
  fetchJournalEntries(
    config: DataSourceConnectionConfig,
    onProgress?: (fetched: number) => void
  ): Promise<JournalEntryRecord[]>
}
