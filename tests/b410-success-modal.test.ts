import { describe, it, expect } from 'vitest'
import { IPC, AUDIT_CHANNELS } from '../src/shared/ipc'

describe('B410 Success Modal & IPC Channel Contracts', () => {
  it('định nghĩa đầy đủ IPC channel và mapping cho showItemInFolder', () => {
    expect(IPC.showItemInFolder).toBe('auditsoft/showItemInFolder')
    expect(AUDIT_CHANNELS.showItemInFolder).toBe('auditsoft/showItemInFolder')
  })

  it('xử lý trích xuất tên file chính xác từ đường dẫn Windows và POSIX', () => {
    const winPath = 'D:\\Desktop\\Project\\5. AuditSoft\\B410\\Output_Cuori_Consolidated.xlsx'
    const posixPath = '/home/user/auditsoft/B410/Output_Master.xlsx'

    const winFileName = winPath.split(/[\\/]/).pop() || winPath
    const posixFileName = posixPath.split(/[\\/]/).pop() || posixPath

    expect(winFileName).toBe('Output_Cuori_Consolidated.xlsx')
    expect(posixFileName).toBe('Output_Master.xlsx')
  })

  it('xử lý trích xuất thư mục cha fallback chính xác khi mở folder', () => {
    const winPath = 'D:\\Desktop\\Project\\5. AuditSoft\\B410\\Output_Cuori_Consolidated.xlsx'
    const posixPath = '/home/user/auditsoft/B410/Output_Master.xlsx'

    const winFolder = winPath.replace(/[\\/][^\\/]+$/, '')
    const posixFolder = posixPath.replace(/[\\/][^\\/]+$/, '')

    expect(winFolder).toBe('D:\\Desktop\\Project\\5. AuditSoft\\B410')
    expect(posixFolder).toBe('/home/user/auditsoft/B410')
  })
})
