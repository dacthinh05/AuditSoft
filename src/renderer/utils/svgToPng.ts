/**
 * Chuyển đổi phần tử SVGSVGElement thành chuỗi Base64 hình ảnh PNG độ nét cao (2x DPI)
 * để nhúng trực tiếp vào workbook Excel hoặc xuất báo cáo.
 */
export async function svgElementToPngBase64(
  svgEl: SVGSVGElement,
  scale = 2,
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    try {
    const clonedSvg = svgEl.cloneNode(true) as SVGSVGElement

    // Lấy kích thước thật của phần tử
    const bbox = svgEl.getBoundingClientRect()
    const width = Math.max(300, Math.round(bbox.width || 800))
    const height = Math.max(150, Math.round(bbox.height || 300))

    clonedSvg.setAttribute('width', `${width}`)
    clonedSvg.setAttribute('height', `${height}`)
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(clonedSvg)
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = width * scale
        canvas.height = height * scale

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          URL.revokeObjectURL(url)
          reject(new Error('Không thể khởi tạo 2D Canvas context'))
          return
        }

        // Vẽ nền trắng sạch sẽ để khi dán vào Excel không bị đen/trong suốt
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        ctx.scale(scale, scale)
        ctx.drawImage(img, 0, 0, width, height)

        const dataUrl = canvas.toDataURL('image/png', 0.95)
        URL.revokeObjectURL(url)
        resolve(dataUrl)
      } catch (err) {
        URL.revokeObjectURL(url)
        reject(err)
      }
    }

    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(new Error(`Lỗi tải ảnh SVG: ${String(e)}`))
    }
    img.src = url
  } catch (err) {
    reject(err instanceof Error ? err : new Error(String(err)))
  }
})
}
