import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  assertAuditDirectory,
  assertAuditFileReadable,
} from '../src/main/ipcFileGuard'
import { escapeSqlDate, escapeSqlInt, escapeSqlString } from '../src/domain/engine/DuckDbEngine'

describe('security-hotfix — H1 key cứng đã xóa', () => {
  it('DEFAULT_VIP_LICENSE_KEY không còn tồn tại trong source', () => {
    const src = fs.readFileSync(
      path.resolve('src/shared/license.ts'),
      'utf-8',
    )
    expect(src).not.toContain('DEFAULT_VIP_LICENSE_KEY')
  })
})

describe('security-hotfix — H4 jail đọc file IPC', () => {
  it('từ chối path không phải chuỗi, đuôi lạ, file không tồn tại', () => {
    expect(() => assertAuditFileReadable(null, 'workbook')).toThrow()
    expect(() => assertAuditFileReadable('', 'workbook')).toThrow()
    expect(() => assertAuditFileReadable('C:/Windows/wallet.dat', 'workbook')).toThrow()
    expect(() => assertAuditFileReadable('notes.exe', 'archive')).toThrow()
    expect(() => assertAuditFileReadable('khong-ton-tai-12345.xlsx', 'workbook')).toThrow()
    // .csv không được nạp qua kênh xml
    expect(() => assertAuditFileReadable('khai.csv', 'xml')).toThrow()
  })

  it('từ chối thư mục khi đòi file', () => {
    expect(() => assertAuditFileReadable(os.tmpdir(), 'workbook')).toThrow()
  })

  it('chấp nhận file audit thật', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'auditsec-'))
    const xlsx = path.join(dir, 'nkc.xlsx')
    const xml = path.join(dir, 'tokhai.xml')
    fs.writeFileSync(xlsx, 'x')
    fs.writeFileSync(xml, 'x')
    expect(assertAuditFileReadable(xlsx, 'workbook')).toBe(path.resolve(xlsx))
    expect(assertAuditFileReadable(xml, 'archive')).toBe(path.resolve(xml))
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('gate thư mục htkk: trống → undefined, file → throw, thư mục thật → pass', () => {
    expect(assertAuditDirectory(undefined)).toBeUndefined()
    expect(assertAuditDirectory('')).toBeUndefined()
    expect(() => assertAuditDirectory('C:/Windows/notepad.exe')).toThrow()
    expect(assertAuditDirectory(os.tmpdir())).toBe(path.resolve(os.tmpdir()))
  })
})

describe('security-hotfix — H5 escape SQL', () => {
  it("quote-doubling trung hòa O'Brien và chuỗi tấn công", () => {
    expect(escapeSqlString("O'Brien")).toBe("'O''Brien'")
    expect(escapeSqlString("x'); DROP TABLE journal_entries; --")).toBe(
      "'x''); DROP TABLE journal_entries; --'",
    )
    expect(escapeSqlString(null)).toBe("''")
  })

  it('ngày chỉ cho YYYY-MM-DD, còn lại NULL', () => {
    expect(escapeSqlDate('2026-01-15')).toBe("'2026-01-15'")
    expect(escapeSqlDate("2026-01-01' OR '1'='1")).toBe('NULL')
    expect(escapeSqlDate(null)).toBe('NULL')
  })

  it('source_row ngoài khoảng về 0', () => {
    expect(escapeSqlInt(42)).toBe('42')
    expect(escapeSqlInt(Number.NaN)).toBe('0')
    expect(escapeSqlInt(1.5)).toBe('0')
  })
})
