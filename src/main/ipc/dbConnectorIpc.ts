import { ipcMain } from 'electron'
import { SqlServerDataSourceAdapter } from '../../domain/ingestion/adapters/SqlServerDataSourceAdapter'
import type { DataSourceConnectionConfig } from '../../domain/ingestion/IDataSourceAdapter'

export function registerDbConnectorIpc(): void {
  const adapter = new SqlServerDataSourceAdapter()

  ipcMain.handle(
    'db:test-connection',
    async (_event, config: DataSourceConnectionConfig) => {
      return adapter.testConnection(config)
    }
  )

  ipcMain.handle(
    'db:preview-sample',
    async (_event, config: DataSourceConnectionConfig, limit?: number) => {
      return adapter.previewSample(config, limit || 10)
    }
  )

  ipcMain.handle(
    'db:fetch-entries',
    async (event, config: DataSourceConnectionConfig) => {
      return adapter.fetchJournalEntries(config, (fetched) => {
        event.sender.send('db:fetch-progress', { fetched })
      })
    }
  )
}
