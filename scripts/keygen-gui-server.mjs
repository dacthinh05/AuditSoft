/**
 * AUDITSOFT KEYGEN STUDIO — LOCAL STANDALONE WEB SERVER & GUI
 * Tác giả: Thịnh Lynx (0817.567.008 - MB Bank)
 * Node.js Pure ESM - Không phụ thuộc third-party package
 */

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { exec } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const KEYS_DIR = path.resolve(__dirname, 'keys')
const PRIV_KEY_PATH = path.join(KEYS_DIR, 'master_private_key.pem')
const PUB_KEY_PATH = path.join(KEYS_DIR, 'master_public_key.pem')
const HISTORY_FILE = path.join(KEYS_DIR, 'keygen_history.json')

// Khóa công khai đối soát (trùng khớp với src/shared/license.ts)
const MASTER_PUBLIC_KEY_BASE64 = 'MCowBQYDK2VwAyEAOoDptMuej36M+mMrNKwoS4Rx2zCSlsDlGFOZQ0w4H+Y='

function getOrGeneratePrivateKey() {
  if (fs.existsSync(PRIV_KEY_PATH)) {
    return fs.readFileSync(PRIV_KEY_PATH, 'utf8')
  }
  if (!fs.existsSync(KEYS_DIR)) {
    fs.mkdirSync(KEYS_DIR, { recursive: true })
  }
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519')
  const privPem = privateKey.export({ type: 'pkcs8', format: 'pem' })
  const pubPem = publicKey.export({ type: 'spki', format: 'pem' })
  fs.writeFileSync(PRIV_KEY_PATH, privPem, 'utf8')
  fs.writeFileSync(PUB_KEY_PATH, pubPem, 'utf8')
  return privPem
}

function verifyKeyWithPublic(licenseKey) {
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

function generateLicense(machineId, customerName, plan = 'LIFETIME', days = 0) {
  const privPem = getOrGeneratePrivateKey()
  let cleanMachineId = machineId.trim().toUpperCase()
  // Chuẩn hóa định dạng AS-XXXX-XXXX-XXXX nếu khách dán dính AS hoặc gạch nối lệch
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

  // Mẫu tin nhắn Zalo gửi khách
  const expStr = expiresAt > 0 ? `Hạn dùng: ${new Date(expiresAt * 1000).toLocaleDateString('vi-VN')} (${days} ngày)` : 'Hạn dùng: VĨNH VIỄN (Không giới hạn thời gian)'
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

  return {
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
}

function getHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'))
    }
  } catch {}
  return []
}

function saveToHistory(record) {
  try {
    const list = getHistory()
    list.unshift(record)
    // Giữ tối đa 50 bản ghi gần nhất
    const trimmed = list.slice(0, 50)
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2), 'utf8')
  } catch (err) {
    console.error('Lỗi ghi file history:', err)
  }
}

const HTML_PAGE = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AuditSoft Keygen Studio — Bộ Tạo Bản Quyền VIP</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --card-border: #334155;
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --accent: #10b981;
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: var(--bg); color: var(--text); padding: 24px 16px; min-height: 100vh; display: flex; flex-direction: column; align-items: center; }
    .container { max-width: 900px; width: 100%; display: flex; flex-direction: column; gap: 24px; }
    
    /* Header */
    .header { display: flex; align-items: center; justify-content: space-between; background: var(--card-bg); border: 1px solid var(--card-border); padding: 20px 24px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3); }
    .logo-area { display: flex; align-items: center; gap: 14px; }
    .badge-icon { background: linear-gradient(135deg, #2563eb, #7c3aed); width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: #fff; box-shadow: 0 4px 12px rgba(37,99,235,0.4); }
    .title h1 { font-size: 20px; font-weight: 700; color: #fff; }
    .title p { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
    .author-badge { background: #0284c71a; color: #38bdf8; border: 1px solid #0284c740; padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; }

    /* Form Section */
    .card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 16px; padding: 24px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.25); }
    .card-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; color: #e2e8f0; }
    
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } }
    
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group.full { grid-column: 1 / -1; }
    label { font-size: 13px; font-weight: 600; color: #cbd5e1; }
    input, select { background: #0f172a; border: 1px solid #475569; border-radius: 10px; color: #fff; padding: 12px 14px; font-size: 14px; outline: none; transition: border-color 0.15s; }
    input:focus, select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(59,130,246,0.2); }
    
    .plan-pills { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 4px; }
    .pill-btn { background: #0f172a; border: 1px solid #475569; color: #cbd5e1; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
    .pill-btn:hover { border-color: #94a3b8; }
    .pill-btn.active { background: #2563eb26; border-color: #3b82f6; color: #60a5fa; font-weight: 600; }
    
    .submit-btn { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; border: none; padding: 14px; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; margin-top: 20px; width: 100%; transition: all 0.2s; box-shadow: 0 4px 14px rgba(37,99,235,0.4); display: flex; align-items: center; justify-content: center; gap: 8px; }
    .submit-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.6); }

    /* Result Area */
    .result-box { display: none; background: #091322; border: 1px solid #1e3a8a; border-radius: 14px; padding: 20px; margin-top: 24px; }
    .result-box.active { display: block; animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    
    .result-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .badge-verified { background: #064e3b; color: #34d399; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; border: 1px solid #059669; }
    
    .key-display { background: #020617; border: 1px solid #334155; border-radius: 8px; padding: 12px; font-family: monospace; font-size: 13px; color: #38bdf8; word-break: break-all; margin-bottom: 16px; user-select: all; }
    
    .btn-group { display: flex; gap: 12px; flex-wrap: wrap; }
    .action-btn { flex: 1; padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.15s; }
    .btn-copy-key { background: #10b981; color: #fff; }
    .btn-copy-key:hover { background: #059669; }
    .btn-copy-zalo { background: #0284c7; color: #fff; }
    .btn-copy-zalo:hover { background: #0369a1; }
    
    /* History Table */
    .table-wrap { overflow-x: auto; margin-top: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
    th { color: var(--text-muted); font-weight: 600; padding: 10px 12px; border-bottom: 1px solid var(--card-border); }
    td { padding: 12px; border-bottom: 1px solid #1e293b; color: #cbd5e1; }
    tr:hover td { background: #1e293b80; }
    .copy-sm-btn { background: #334155; color: #e2e8f0; border: none; padding: 4px 8px; border-radius: 6px; font-size: 11px; cursor: pointer; }
    .copy-sm-btn:hover { background: #475569; }
    
    /* Toast */
    .toast { position: fixed; bottom: 24px; right: 24px; background: #10b981; color: white; padding: 12px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; box-shadow: 0 10px 25px rgba(0,0,0,0.5); opacity: 0; pointer-events: none; transition: opacity 0.2s, transform 0.2s; transform: translateY(10px); }
    .toast.show { opacity: 1; transform: translateY(0); }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo-area">
        <div class="badge-icon">AS</div>
        <div class="title">
          <h1>AuditSoft Keygen Studio</h1>
          <p>Bộ Ký Số & Cấp Bản Quyền Bất Đối Xứng (Ed25519) Cho Khách Hàng</p>
        </div>
      </div>
      <div class="author-badge">👑 Thịnh Lynx — 0817.567.008</div>
    </div>

    <!-- Main Card -->
    <div class="card">
      <div class="card-title">📝 Thông Tin Cấp Bản Quyền Mới</div>
      <div class="form-grid">
        <div class="form-group">
          <label>Mã Máy Khách Hàng (Machine ID) <span style="color:#ef4444">*</span></label>
          <input type="text" id="machineId" placeholder="Ví dụ: AS-9F2A-88B1-C410" autofocus autocomplete="off">
        </div>
        <div class="form-group">
          <label>Tên Khách Hàng / Đơn Vị</label>
          <input type="text" id="customerName" value="Kiểm toán viên VIP" placeholder="Tên KTV hoặc Công ty kiểm toán">
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

      <!-- Result Area -->
      <div class="result-box" id="resultBox">
        <div class="result-header">
          <div style="font-weight:700; color:#38bdf8; font-size:14px;">🎉 LICENSE KEY HOÀN TẤT:</div>
          <div class="badge-verified">✓ Ed25519 SIGNATURE VERIFIED</div>
        </div>
        <div class="key-display" id="keyDisplay"></div>
        <div class="btn-group">
          <button class="action-btn btn-copy-key" id="btnCopyKey">📋 1-Click Copy License Key</button>
          <button class="action-btn btn-copy-zalo" id="btnCopyZalo">💬 Copy Mẫu Tin Nhắn Gửi Zalo</button>
        </div>
      </div>
    </div>

    <!-- History Card -->
    <div class="card">
      <div class="card-title">📜 Lịch Sử 50 Key Vừa Cấp Gần Nhất</div>
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
            <tr><td colspan="6" style="text-align:center; color:var(--text-muted);">Đang tải lịch sử...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="toast" id="toast">Đã copy vào Clipboard!</div>

  <script>
    let currentPlan = 'LIFETIME';
    let currentDays = 0;
    let lastGeneratedData = null;

    // Quản lý nút chọn gói
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

    async function loadHistory() {
      try {
        const res = await fetch('/api/history');
        const list = await res.json();
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
              <button class="copy-sm-btn" onclick="copyText('\${item.licenseKey}', 'Đã copy Key lịch sử!')">Copy Key</button>
            </td>
          </tr>\`;
        }).join('');
      } catch (err) {
        console.error(err);
      }
    }

    async function copyText(text, msg = 'Đã copy vào Clipboard!') {
      try {
        await navigator.clipboard.writeText(text);
        showToast(msg);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast(msg);
      }
    }

    document.getElementById('btnSubmit').addEventListener('click', async () => {
      const machineId = document.getElementById('machineId').value.trim();
      const customerName = document.getElementById('customerName').value.trim();

      if (!machineId) {
        alert('Vui lòng nhập Machine ID của khách hàng!');
        document.getElementById('machineId').focus();
        return;
      }

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            machineId,
            customerName,
            plan: currentPlan,
            days: currentDays
          })
        });

        const data = await res.json();
        if (!data.success) {
          alert('Lỗi tạo key: ' + data.message);
          return;
        }

        lastGeneratedData = data;
        document.getElementById('keyDisplay').innerText = data.licenseKey;
        document.getElementById('resultBox').classList.add('active');

        // Tự động copy ngay Key vào clipboard
        await copyText(data.licenseKey, '⚡ Đã tạo và tự động Copy License Key!');
        loadHistory();
      } catch (err) {
        alert('Không thể kết nối đến server Keygen: ' + err.message);
      }
    });

    document.getElementById('btnCopyKey').addEventListener('click', () => {
      if (lastGeneratedData) {
        copyText(lastGeneratedData.licenseKey, '✓ Đã copy License Key!');
      }
    });

    document.getElementById('btnCopyZalo').addEventListener('click', () => {
      if (lastGeneratedData) {
        copyText(lastGeneratedData.zaloMessage, '✓ Đã copy Mẫu tin nhắn Zalo gửi khách!');
      }
    });

    // Enter to submit
    document.getElementById('machineId').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('btnSubmit').click();
    });

    loadHistory();
  </script>
</body>
</html>
`

const PORT = 7890

const server = http.createServer((req, res) => {
  // CORS & Security headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const parsedUrl = new URL(req.url || '/', `http://127.0.0.1:${PORT}`)
  const pathname = parsedUrl.pathname

  if (pathname === '/favicon.ico') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html' || pathname === '/keygen')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(HTML_PAGE)
    return
  }

  if (req.method === 'GET' && pathname === '/api/history') {
    const list = getHistory()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(list))
    return
  }
  if (req.method === 'POST' && parsedUrl.pathname === '/api/generate') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const { machineId, customerName, plan, days } = JSON.parse(body)
        if (!machineId) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: false, message: 'Thiếu Machine ID' }))
          return
        }

        const result = generateLicense(machineId, customerName, plan, days)
        saveToHistory(result)

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: true, ...result }))
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: false, message: String(err) }))
      }
    })
    return
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' })
  res.end('Not Found')
})

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${PORT}`
  console.log(`
══════════════════════════════════════════════════════════════════════
  🚀 AUDITSOFT KEYGEN STUDIO ĐÃ KHỞI CHẠY THÀNH CÔNG!
══════════════════════════════════════════════════════════════════════
  Trình duyệt đang tự động mở: ${url}
  Nếu trình duyệt chưa mở, hãy nhấp vào liên kết trên.
  (Nhấn Ctrl + C để dừng công cụ khi không dùng nữa)
══════════════════════════════════════════════════════════════════════
`)

  // Tự động mở trình duyệt trên Windows
  if (process.platform === 'win32') {
    exec(`start "" "${url}"`)
  }
})
