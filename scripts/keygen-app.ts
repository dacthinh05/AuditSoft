import { app, BrowserWindow, ipcMain, clipboard } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'

const KEYS_DIR = path.resolve(__dirname, 'keys')
const PRIV_KEY_PATH = path.join(KEYS_DIR, 'master_private_key.pem')
const PUB_KEY_PATH = path.join(KEYS_DIR, 'master_public_key.pem')
const HISTORY_FILE = path.join(KEYS_DIR, 'keygen_history.json')

const MASTER_PUBLIC_KEY_BASE64 = 'MCowBQYDK2VwAyEAOoDptMuej36M+mMrNKwoS4Rx2zCSlsDlGFOZQ0w4H+Y='

function getOrGeneratePrivateKey(): string {
  if (fs.existsSync(PRIV_KEY_PATH)) {
    return fs.readFileSync(PRIV_KEY_PATH, 'utf8')
  }
  if (!fs.existsSync(KEYS_DIR)) {
    fs.mkdirSync(KEYS_DIR, { recursive: true })
  }
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519')
  const privPem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string
  const pubPem = publicKey.export({ type: 'spki', format: 'pem' }) as string
  fs.writeFileSync(PRIV_KEY_PATH, privPem, 'utf8')
  fs.writeFileSync(PUB_KEY_PATH, pubPem, 'utf8')
  return privPem
}

function verifyKeyWithPublic(licenseKey: string) {
  try {
    if (!licenseKey.startsWith('ASKEY-')) return { valid: false, message: 'Sai tiền tố ASKEY-' }
    const raw = licenseKey.slice(6)
    const dotIdx = raw.lastIndexOf('.')
    if (dotIdx === -1) return { valid: false, message: 'Cấu trúc key không hợp lệ' }
    const payloadB64 = raw.slice(0, dotIdx)
    const sigB64 = raw.slice(dotIdx + 1)

    const payloadBytes = Buffer.from(payloadB64, 'base64url')
    const signature = Buffer.from(sigB64, 'base64url')

    const pubKeyObj = crypto.createPublicKey({
      key: Buffer.from(MASTER_PUBLIC_KEY_BASE64, 'base64'),
      format: 'der',
      type: 'spki',
    })

    const valid = crypto.verify(null, payloadBytes, pubKeyObj, signature)
    if (!valid) return { valid: false, message: 'Chữ ký số Ed25519 không khớp' }
    const payload = JSON.parse(payloadBytes.toString('utf8'))
    return { valid: true, payload }
  } catch (err) {
    return { valid: false, message: String(err) }
  }
}

function generateLicense(machineId: string, customerName: string, plan = 'LIFETIME', days = 0) {
  const privPem = getOrGeneratePrivateKey()
  let cleanMachineId = machineId.trim().toUpperCase()
  cleanMachineId = cleanMachineId.replace(/^AS\s*/i, '').replace(/[^A-Z0-9]/g, '')
  if (cleanMachineId.length === 12) {
    cleanMachineId = `AS-${cleanMachineId.slice(0, 4)}-${cleanMachineId.slice(4, 8)}-${cleanMachineId.slice(8, 12)}`
  } else if (!cleanMachineId.startsWith('AS-')) {
    cleanMachineId = `AS-${cleanMachineId}`
  }

  const cleanCustomer = customerName ? customerName.trim() : 'Kiểm toán viên VIP'
  let expiresAt = 0
  let finalPlan = plan

  if (days > 0) {
    expiresAt = Math.floor(Date.now() / 1000) + days * 86400
    if (finalPlan === 'LIFETIME') finalPlan = 'ANNUAL'
  }

  const payload = {
    m: cleanMachineId,
    n: cleanCustomer,
    t: finalPlan,
    exp: expiresAt,
    iat: Math.floor(Date.now() / 1000),
  }

  const jsonBytes = Buffer.from(JSON.stringify(payload), 'utf8')
  const signature = crypto.sign(null, jsonBytes, privPem)
  const licenseKey = `ASKEY-${jsonBytes.toString('base64url')}.${signature.toString('base64url')}`

  const verify = verifyKeyWithPublic(licenseKey)

  const expStr = expiresAt > 0 
    ? `Hạn dùng: ${new Date(expiresAt * 1000).toLocaleDateString('vi-VN')} (${days} ngày)` 
    : 'Hạn dùng: VĨNH VIỄN (Không giới hạn thời gian)'

  const zaloMessage = `Dạ chào ${cleanCustomer}, AuditSoft xin gửi Mã kích hoạt bản quyền của bạn:

🔑 MÃ KÍCH HOẠT:
${licenseKey}

📌 THÔNG TIN ĐĂNG KÝ:
- Mã máy: ${cleanMachineId}
- Gói: ${finalPlan}
- ${expStr}

👉 HƯỚNG DẪN KÍCH HOẠT:
1. Mở phần mềm AuditSoft NKC
2. Nhấn vào biểu tượng "Bản quyền" hoặc hình Khiên ở góc trên bên phải
3. Dán toàn bộ mã khóa trên vào ô "Mã kích hoạt (License Key)"
4. Nhấn "Kích hoạt bản quyền ngay" để hoàn tất.

Chúc bạn có mùa kiểm toán hiệu quả và thuận lợi cùng AuditSoft!`

  const record = {
    machineId: cleanMachineId,
    customerName: cleanCustomer,
    plan: finalPlan,
    days,
    expiresAt,
    expStr,
    licenseKey,
    valid: verify.valid,
    zaloMessage,
    createdAt: new Date().toISOString(),
  }

  saveToHistory(record)
  return record
}

function getHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'))
    }
  } catch {}
  return []
}

interface KeygenRecord {
  machineId: string
  customerName: string
  plan: string
  days: number
  expiresAt: number
  expStr: string
  licenseKey: string
  valid: boolean
  zaloMessage: string
  createdAt: string
}

function saveToHistory(record: KeygenRecord) {
  try {
    const list = getHistory()
    list.unshift(record)
    const trimmed = list.slice(0, 100)
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2), 'utf8')
  } catch (err) {
    console.error('Lỗi ghi file history:', err)
  }
}

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>AuditSoft Keygen Studio Pro</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --card-border: #1f2937;
      --primary: #2563eb;
      --primary-hover: #1d4ed8;
      --success: #10b981;
      --text: #f9fafb;
      --text-muted: #9ca3af;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 24px; min-height: 100vh; }
    .container { max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
    .header { display: flex; align-items: center; justify-content: space-between; background: var(--card-bg); border: 1px solid var(--card-border); padding: 18px 24px; border-radius: 14px; }
    .logo-area { display: flex; align-items: center; gap: 14px; }
    .badge-icon { background: linear-gradient(135deg, #2563eb, #7c3aed); width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; color: #fff; box-shadow: 0 4px 12px rgba(37,99,235,0.4); }
    .title h1 { font-size: 19px; font-weight: 700; }
    .title p { font-size: 12px; color: var(--text-muted); margin-top: 3px; }
    .author-badge { background: rgba(37,99,235,0.15); color: #60a5fa; border: 1px solid rgba(37,99,235,0.3); padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
    
    .card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 14px; padding: 22px; }
    .card-title { font-size: 15px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; color: #e5e7eb; }
    
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group.full { grid-column: 1 / -1; }
    label { font-size: 13px; font-weight: 600; color: #d1d5db; }
    input { background: #030712; border: 1px solid #374151; border-radius: 8px; color: #fff; padding: 10px 14px; font-size: 14px; outline: none; transition: border-color 0.15s; }
    input:focus { border-color: var(--primary); box-shadow: 0 0 0 2px rgba(37,99,235,0.2); }
    
    .plan-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
    .pill-btn { background: #030712; border: 1px solid #374151; color: #d1d5db; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
    .pill-btn:hover { border-color: #6b7280; }
    .pill-btn.active { background: rgba(37,99,235,0.2); border-color: #3b82f6; color: #60a5fa; font-weight: 600; }
    
    .submit-btn { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; border: none; padding: 13px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; margin-top: 18px; width: 100%; transition: all 0.2s; box-shadow: 0 4px 12px rgba(37,99,235,0.3); }
    .submit-btn:hover { background: #1d4ed8; transform: translateY(-1px); }

    .result-box { display: none; background: #030712; border: 1px solid #1e3a8a; border-radius: 12px; padding: 18px; margin-top: 20px; }
    .result-box.active { display: block; animation: fadeIn 0.2s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
    
    .result-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .badge-verified { background: rgba(16,185,129,0.15); color: #34d399; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; border: 1px solid rgba(16,185,129,0.4); }
    
    .key-display { background: #090d16; border: 1px solid #1f2937; border-radius: 8px; padding: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; color: #38bdf8; word-break: break-all; margin-bottom: 14px; user-select: all; }
    
    .btn-group { display: flex; gap: 10px; }
    .action-btn { flex: 1; padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; display: flex; align-items: center; justify-content: center; gap: 6px; }
    .btn-copy-key { background: #10b981; color: #fff; }
    .btn-copy-key:hover { background: #059669; }
    .btn-copy-zalo { background: #0284c7; color: #fff; }
    .btn-copy-zalo:hover { background: #0369a1; }
    
    .table-wrap { overflow-x: auto; margin-top: 8px; max-height: 280px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
    th { color: var(--text-muted); font-weight: 600; padding: 10px 12px; border-bottom: 1px solid var(--card-border); position: sticky; top: 0; background: var(--card-bg); }
    td { padding: 10px 12px; border-bottom: 1px solid #1f2937; color: #d1d5db; }
    tr:hover td { background: rgba(255,255,255,0.02); }
    .copy-sm-btn { background: #1f2937; color: #e5e7eb; border: 1px solid #374151; padding: 4px 10px; border-radius: 6px; font-size: 11px; cursor: pointer; }
    .copy-sm-btn:hover { background: #374151; }
    
    .toast { position: fixed; bottom: 20px; right: 20px; background: #10b981; color: white; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; box-shadow: 0 8px 20px rgba(0,0,0,0.4); opacity: 0; pointer-events: none; transition: all 0.2s; transform: translateY(10px); }
    .toast.show { opacity: 1; transform: translateY(0); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-area">
        <div class="badge-icon">AS</div>
        <div class="title">
          <h1>AuditSoft Keygen Studio Pro</h1>
          <p>Ứng Dụng Ký Số & Cấp Bản Quyền Độc Lập (Ed25519 Engine)</p>
        </div>
      </div>
      <div class="author-badge">Thịnh Lynx • MB Bank: 0817.567.008</div>
    </div>

    <div class="card">
      <div class="card-title">📝 Cấp Bản Quyền Mới Cho Khách Hàng</div>
      <div class="form-grid">
        <div class="form-group">
          <label>Mã Máy Khách Hàng (Machine ID) <span style="color:#ef4444">*</span></label>
          <input type="text" id="machineId" placeholder="Ví dụ: AS-DB2F-0C2C-74AF" autofocus autocomplete="off">
        </div>
        <div class="form-group">
          <label>Tên Khách Hàng / Đơn Vị</label>
          <input type="text" id="customerName" value="Thịnh Lynx" placeholder="Tên KTV hoặc Công ty kiểm toán">
        </div>
        <div class="form-group full">
          <label>Chọn Gói Bản Quyền</label>
          <div class="plan-pills">
            <button type="button" class="pill-btn active" data-plan="LIFETIME" data-days="0">🌟 Vĩnh Viễn (Lifetime VIP)</button>
            <button type="button" class="pill-btn" data-plan="ANNUAL" data-days="365">📅 1 Năm (365 Ngày)</button>
            <button type="button" class="pill-btn" data-plan="ENTERPRISE" data-days="0">🏢 Doanh Nghiệp (Enterprise)</button>
            <button type="button" class="pill-btn" data-plan="PRO" data-days="30">⏳ Dùng Thử 30 Ngày</button>
          </div>
        </div>
      </div>

      <button class="submit-btn" id="btnSubmit">
        <span>⚡ KÝ SỐ & TẠO LICENSE KEY NGAY</span>
      </button>

      <div class="result-box" id="resultBox">
        <div class="result-header">
          <div style="font-weight:700; color:#38bdf8; font-size:14px;">🎉 LICENSE KEY HOÀN TẤT:</div>
          <div class="badge-verified">✓ ED25519 VERIFIED</div>
        </div>
        <div class="key-display" id="keyDisplay"></div>
        <div class="btn-group">
          <button class="action-btn btn-copy-key" id="btnCopyKey">📋 1-Click Copy Key</button>
          <button class="action-btn btn-copy-zalo" id="btnCopyZalo">💬 Copy Mẫu Gửi Zalo</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">📜 Lịch Sử Bản Quyền Đã Cấp</div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Khách hàng</th>
              <th>Mã máy</th>
              <th>Gói</th>
              <th>Hạn dùng</th>
              <th style="text-align:right;">Thao tác</th>
            </tr>
          </thead>
          <tbody id="historyBody">
            <tr><td colspan="6" style="text-align:center; color:var(--text-muted);">Đang tải...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    const { ipcRenderer } = require('electron');
    let currentPlan = 'LIFETIME';
    let currentDays = 0;
    let lastGeneratedData = null;

    document.querySelectorAll('.pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPlan = btn.getAttribute('data-plan');
        currentDays = parseInt(btn.getAttribute('data-days'), 10) || 0;
      });
    });

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.innerText = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2500);
    }

    async function copyText(text, msg) {
      await ipcRenderer.invoke('copy-text', text);
      showToast(msg);
    }

    async function loadHistory() {
      const list = await ipcRenderer.invoke('get-history');
      const tbody = document.getElementById('historyBody');
      if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:20px;">Chưa có key nào được tạo.</td></tr>';
        return;
      }
      tbody.innerHTML = list.map(item => {
        const d = new Date(item.createdAt);
        const timeStr = d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'});
        return \`<tr>
          <td>\${timeStr}</td>
          <td style="font-weight:600; color:#fff;">\${item.customerName}</td>
          <td style="font-family:monospace; color:#38bdf8;">\${item.machineId}</td>
          <td><span style="background:#1e3a8a; color:#60a5fa; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600;">\${item.plan}</span></td>
          <td>\${item.expStr || 'Vĩnh viễn'}</td>
          <td style="text-align:right;">
            <button class="copy-sm-btn" onclick="copyText('\${item.licenseKey}', '✓ Đã copy Key!')">Copy Key</button>
          </td>
        </tr>\`;
      }).join('');
    }

    document.getElementById('btnSubmit').addEventListener('click', async () => {
      const machineId = document.getElementById('machineId').value.trim();
      const customerName = document.getElementById('customerName').value.trim();

      if (!machineId) {
        alert('Vui lòng nhập Machine ID của khách hàng!');
        document.getElementById('machineId').focus();
        return;
      }

      const res = await ipcRenderer.invoke('generate-key', {
        machineId,
        customerName,
        plan: currentPlan,
        days: currentDays
      });

      lastGeneratedData = res;
      document.getElementById('keyDisplay').innerText = res.licenseKey;
      document.getElementById('resultBox').classList.add('active');

      await copyText(res.licenseKey, '⚡ Đã tạo & Tự động Copy License Key!');
      loadHistory();
    });

    document.getElementById('btnCopyKey').addEventListener('click', () => {
      if (lastGeneratedData) copyText(lastGeneratedData.licenseKey, '✓ Đã copy License Key!');
    });

    document.getElementById('btnCopyZalo').addEventListener('click', () => {
      if (lastGeneratedData) copyText(lastGeneratedData.zaloMessage, '✓ Đã copy Mẫu tin nhắn Zalo!');
    });

    document.getElementById('machineId').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('btnSubmit').click();
    });

    loadHistory();
  </script>
</body>
</html>`

function createWindow() {
  const win = new BrowserWindow({
    width: 950,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    title: 'AuditSoft Keygen Studio Pro',
    backgroundColor: '#090d16',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(HTML_CONTENT)}`)
}

app.whenReady().then(() => {
  ipcMain.handle('generate-key', (_event, { machineId, customerName, plan, days }) => {
    return generateLicense(machineId, customerName, plan, days)
  })

  ipcMain.handle('get-history', () => {
    return getHistory()
  })

  ipcMain.handle('copy-text', (_event, text: string) => {
    clipboard.writeText(text)
    return true
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
