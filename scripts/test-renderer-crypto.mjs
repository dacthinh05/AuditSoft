import { app, BrowserWindow } from 'electron'

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: false, contextIsolation: true } })
  const res = await win.webContents.executeJavaScript(`
    (async () => {
      try {
        const b64 = 'MCowBQYDK2VwAyEAOoDptMuej36M+mMrNKwoS4Rx2zCSlsDlGFOZQ0w4H+Y=';
        let b = b64.replace(/-/g, '+').replace(/_/g, '/');
        while (b.length % 4 !== 0) b += '=';
        const bin = atob(b);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        
        const key = await window.crypto.subtle.importKey('spki', bytes, { name: 'Ed25519' }, false, ['verify']);
        return { success: true, key: key ? 'imported' : 'null' };
      } catch (err) {
        return { success: false, error: err.name + ': ' + err.message };
      }
    })()
  `)
  console.log('RESULT_FROM_RENDERER:', JSON.stringify(res))
  app.quit()
})
