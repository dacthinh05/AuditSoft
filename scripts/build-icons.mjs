import fs from 'node:fs'
import path from 'node:path'
import { app, BrowserWindow, ipcMain } from 'electron'

const SIZES = [256, 128, 64, 48, 32, 24, 16]

app.disableHardwareAcceleration()

app.whenReady().then(async () => {
  try {
    const buildDir = path.resolve('build')
    const svgPath = path.join(buildDir, 'icon.svg')
    const pngPath = path.join(buildDir, 'icon.png')
    const icoPath = path.join(buildDir, 'icon.ico')

    const svgContent = fs.readFileSync(svgPath, 'utf8')

    const win = new BrowserWindow({
      width: 600,
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    })

    const tempHtml = path.join(buildDir, '_temp_icon_render.html')
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: transparent; overflow: hidden; }
        </style>
      </head>
      <body>
        <div id="container" style="display:none;">${svgContent}</div>
        <canvas id="canvas"></canvas>
        <script>
          const { ipcRenderer } = require('electron');

          async function renderAll(sizes) {
            const svgEl = document.querySelector('#container svg');
            const svgData = new XMLSerializer().serializeToString(svgEl);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            const img = new Image();
            img.src = url;
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
            });

            const results = [];
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');

            for (const size of sizes) {
              canvas.width = size;
              canvas.height = size;
              ctx.clearRect(0, 0, size, size);
              ctx.drawImage(img, 0, 0, size, size);

              const dataUrl = canvas.toDataURL('image/png');
              const base64 = dataUrl.replace(/^data:image\\/png;base64,/, '');
              results.push({ size, base64 });
            }

            URL.revokeObjectURL(url);
            ipcRenderer.send('render-complete', results);
          }

          ipcRenderer.on('start-render', (event, sizes) => {
            renderAll(sizes).catch(err => {
              ipcRenderer.send('render-error', err.message);
            });
          });
        </script>
      </body>
      </html>
    `

    fs.writeFileSync(tempHtml, htmlContent, 'utf8')

    const renderPromise = new Promise((resolve, reject) => {
      ipcMain.once('render-complete', (event, results) => resolve(results))
      ipcMain.once('render-error', (event, errorMsg) => reject(new Error(errorMsg)))
    })

    await win.loadFile(tempHtml)
    win.webContents.send('start-render', SIZES)

    const results = await renderPromise
    if (fs.existsSync(tempHtml)) fs.unlinkSync(tempHtml)

    const pngBuffers = results.map(r => ({
      size: r.size,
      buffer: Buffer.from(r.base64, 'base64')
    }))

    // Write 256x256 PNG
    const p256 = pngBuffers.find(p => p.size === 256)
    if (p256) {
      fs.writeFileSync(pngPath, p256.buffer)
      console.log(`✓ Saved ${pngPath} (256x256, ${p256.buffer.length} bytes)`)
    }

    // Build multi-res ICO
    const count = pngBuffers.length
    const headerSize = 6
    const dirEntrySize = 16
    let offset = headerSize + count * dirEntrySize

    const header = Buffer.alloc(headerSize)
    header.writeUInt16LE(0, 0)
    header.writeUInt16LE(1, 2)
    header.writeUInt16LE(count, 4)

    const dirEntries = []
    const imageBuffers = []

    for (const { size, buffer } of pngBuffers) {
      const entry = Buffer.alloc(dirEntrySize)
      entry.writeUInt8(size >= 256 ? 0 : size, 0)
      entry.writeUInt8(size >= 256 ? 0 : size, 1)
      entry.writeUInt8(0, 2)
      entry.writeUInt8(0, 3)
      entry.writeUInt16LE(1, 4)
      entry.writeUInt16LE(32, 6)
      entry.writeUInt32LE(buffer.length, 8)
      entry.writeUInt32LE(offset, 12)

      dirEntries.push(entry)
      imageBuffers.push(buffer)
      offset += buffer.length
    }

    const icoBuffer = Buffer.concat([header, ...dirEntries, ...imageBuffers])
    fs.writeFileSync(icoPath, icoBuffer)
    console.log(`✓ Saved ${icoPath} with sizes [${SIZES.join(', ')}] (${icoBuffer.length} bytes)`)

    win.destroy()
    app.quit()
  } catch (err) {
    console.error('Failed to generate icons:', err)
    process.exit(1)
  }
})
