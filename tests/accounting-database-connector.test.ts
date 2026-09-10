import { describe, expect, it } from 'vitest'
import { buildMisaExtractionQuery } from '../src/domain/ingestion/templates/MisaTemplate'
import { buildFastExtractionQuery } from '../src/domain/ingestion/templates/FastTemplate'
import { buildBravoExtractionQuery } from '../src/domain/ingestion/templates/BravoTemplate'
import { SqlServerDataSourceAdapter } from '../src/domain/ingestion/adapters/SqlServerDataSourceAdapter'
import type { DataSourceConnectionConfig } from '../src/domain/ingestion/IDataSourceAdapter'

describe('Phase 3: Accounting Database Connector Test Suite', () => {
  it('1. Tạo câu truy vấn trích xuất dữ liệu chuẩn cho MISA SME/AMIS', () => {
    const query = buildMisaExtractionQuery(2024, 10)
    expect(query).toContain('SELECT TOP 10')
    expect(query).toContain('FROM GL_Voucher m')
    expect(query).toContain('INNER JOIN GL_VoucherDetail d ON m.RefID = d.RefID')
    expect(query).toContain('YEAR(m.RefDate) = 2024')
    expect(query).toContain('debit_account')
    expect(query).toContain('credit_account')
    expect(query).toContain('partner_code')
    expect(query).toContain('partner_name')

    const fullQuery = buildMisaExtractionQuery(2023)
    expect(fullQuery).not.toContain('TOP')
    expect(fullQuery).toContain('YEAR(m.RefDate) = 2023')
  })

  it('2. Tạo câu truy vấn trích xuất dữ liệu chuẩn cho FAST Accounting', () => {
    const query = buildFastExtractionQuery(2024, 50)
    expect(query).toContain('SELECT TOP 50')
    expect(query).toContain('FROM ct00')
    expect(query).toContain('YEAR(ngay_ct) = 2024')
    expect(query).toContain('debit_account')
    expect(query).toContain('credit_account')
  })

  it('3. Tạo câu truy vấn trích xuất dữ liệu chuẩn cho BRAVO ERP', () => {
    const query = buildBravoExtractionQuery(2024)
    expect(query).toContain('FROM B30AccDoc m')
    expect(query).toContain('INNER JOIN B30AccDocDetail d ON m.Id = d.ParentId')
    expect(query).toContain('YEAR(m.DocDate) = 2024')
    expect(query).toContain('debit_account')
  })

  it('4. SqlServerDataSourceAdapter xử lý lỗi kết nối an toàn và trả về thông báo rõ ràng khi host không tồn tại', async () => {
    const adapter = new SqlServerDataSourceAdapter()
    expect(adapter.supportedType).toBe('sql_server')
    expect(adapter.name).toContain('SQL Server')

    const dummyConfig: DataSourceConnectionConfig = {
      type: 'sql_server',
      preset: 'MISA',
      host: '127.0.0.99', // Host không tồn tại
      port: 65432,
      database: 'DUMMY_DB',
      username: 'sa',
      password: 'wrong_password',
      fiscalYear: 2024,
      options: {
        trustServerCertificate: true,
      },
    }

    const testResult = await adapter.testConnection(dummyConfig)
    expect(testResult.success).toBe(false)
    expect(testResult.message).toContain('Kết nối thất bại')
  })
})
