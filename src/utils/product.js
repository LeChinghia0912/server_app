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


// Unified accessors and normalization helpers
export function normalizeVariant(variant) {
  if (!variant) return { id: undefined, productId: undefined, colorName: '', sizeName: '', price: 0 }
  const price = typeof variant.price === 'string' ? Number.parseFloat(variant.price) || 0 : variant.price ?? 0
  return {
    id: variant.id ?? variant._id ?? variant.uuid,
    productId: variant.product_id ?? variant.productId ?? variant.product?.id,
    colorName: (variant.color_name ?? variant.color?.name ?? variant.color ?? '').toString().trim(),
    sizeName: (variant.size_name ?? variant.size?.name ?? variant.size ?? '').toString().trim(),
    price,
  }
}

export function pickVariantsFromProduct(product) {
  const raw =
    product?.variants ||
    product?.product_variants ||
    product?.productVariants ||
    product?.variant_list ||
    product?.variations ||
    product?.options?.variants ||
    []
  const list = Array.isArray(raw) ? raw : []
  return list
}

export function extractColorOptionsFrom(productOrVariants, fallbackColors = []) {
  const variants = Array.isArray(productOrVariants) ? productOrVariants : pickVariantsFromProduct(productOrVariants)
  const set = new Set()
  variants.forEach(v => {
    const n = (v?.color_name ?? v?.color?.name ?? v?.color ?? '').toString().trim()
    if (n) set.add(n)
  })
  if (set.size > 0) return Array.from(set)
  return (fallbackColors || []).map(c => c?.name ?? c).filter(Boolean)
}

export function extractSizeOptionsFrom(productOrVariants, fallbackSizes = []) {
  const variants = Array.isArray(productOrVariants) ? productOrVariants : pickVariantsFromProduct(productOrVariants)
  const set = new Set()
  variants.forEach(v => {
    const n = (v?.size_name ?? v?.size?.name ?? v?.size ?? '').toString().trim()
    if (n) set.add(n)
  })
  if (set.size > 0) return Array.from(set)
  return (fallbackSizes || []).map(s => s?.name ?? s).filter(Boolean)
}

export function resolveVariantId({ variants, product, selectedColor, selectedSize }) {
  const list = Array.isArray(variants) && variants.length ? variants : pickVariantsFromProduct(product)
  if (!Array.isArray(list) || list.length === 0) {
    return product?.default_variant_id || product?.variant_id || product?.defaultVariantId || null
  }
  const normalized = list.map(normalizeVariant)
  const uniqueColors = new Set(normalized.map(v => v.colorName.toLowerCase()).filter(Boolean))
  const uniqueSizes = new Set(normalized.map(v => v.sizeName.toLowerCase()).filter(Boolean))
  const wantedColor = (selectedColor || '').toString().trim().toLowerCase()
  const wantedSize = (selectedSize || '').toString().trim().toLowerCase()
  const colorFilter = wantedColor || (uniqueColors.size === 1 ? Array.from(uniqueColors)[0] : '')
  const sizeFilter = wantedSize || (uniqueSizes.size === 1 ? Array.from(uniqueSizes)[0] : '')
  const matched = normalized.find(v => (!colorFilter || v.colorName.toLowerCase() === colorFilter) && (!sizeFilter || v.sizeName.toLowerCase() === sizeFilter))
  return matched?.id ?? normalized[0]?.id ?? null
}


