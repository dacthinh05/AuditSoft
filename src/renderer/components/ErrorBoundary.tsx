import { Component, type ErrorInfo, type ReactNode } from 'react'
import { IconAlert } from './Icons'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[AuditSoft ErrorBoundary caught error]:', error, errorInfo)
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  private handleGoHome = (): void => {
    this.setState({ hasError: false, error: null })
    window.location.hash = ''
    window.dispatchEvent(new CustomEvent('auditsoft:navigate-home'))
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            padding: '30px 20px',
            textAlign: 'center',
            color: '#0f172a',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#b91c1c',
              marginBottom: '16px',
            }}
          >
            <IconAlert size={28} />
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px', color: '#0f172a' }}>
            {this.props.fallbackTitle || 'Đã xảy ra lỗi không mong muốn tại phân hệ này'}
          </h2>

          <p
            style={{
              fontSize: '13px',
              color: '#64748b',
              maxWidth: '520px',
              lineHeight: 1.5,
              margin: '0 0 20px',
            }}
          >
            {this.state.error?.message || 'Không thể hiển thị nội dung giao diện. Dữ liệu của bạn vẫn an toàn.'}
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                background: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Thử lại phân hệ
            </button>

            <button
              type="button"
              onClick={this.handleGoHome}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2)',
              }}
            >
              Về Trang Chủ Tổng Quan
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
