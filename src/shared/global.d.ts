import type { AuditBridgeApi } from './ipc'

declare global {
  interface Window {
    auditsoft: AuditBridgeApi
  }
}

export {}
