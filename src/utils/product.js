export const UPLOAD_PREFIX = '/uploads'

export function resolveImageFromProduct(product) {
  const raw = product?.image_url
  let source = ''
  if (typeof raw === 'string') {
    source = raw
  } else if (raw && typeof raw === 'object') {
    source = raw.url || raw.src || raw.path || ''
  }
  source = String(source).replace(/\\\\/g, '/')
  if (!source) return ''
  if (/^https?:\/\//i.test(source)) return source
  if (source.startsWith('//')) return 'http:' + source
  if (source.startsWith(UPLOAD_PREFIX)) return source
  if (source.startsWith('/')) return source
  if (source.startsWith('uploads')) return '/' + source
  return `${UPLOAD_PREFIX}/${source}`
}

export function formatCurrency(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toLocaleString('vi-VN') + 'đ'
  }
  const numeric = Number.parseFloat(value)
  if (Number.isFinite(numeric)) return numeric.toLocaleString('vi-VN') + 'đ'
  return String(value ?? '')
}

export function normalizeProduct(product) {
  const priceValue =
    typeof product.price === 'string'
      ? Number.parseFloat(product.price) || 0
      : product.price ?? 0
  return {
    id: product.id ?? product._id ?? product.uuid,
    name: product.name ?? product.title ?? 'No name',
    description: product.description ?? '',
    price: priceValue,
    stock: product.stock ?? product.quantity ?? 0,
    category:
      typeof product.category === 'string'
        ? product.category
        : product.category?.name ?? '',
    image: resolveImageFromProduct(product),
  }
}

export function placeholderSvg(width, height, text = 'No Image') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="${Math.max(
    12,
    Math.floor(Math.min(width, height) / 40)
  )}" fill="#9aa0a6">${text}</text></svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}


