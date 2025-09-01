import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCart } from '../api/cart'
import { getProductById } from '../api/products'
import { resolveImageFromProduct, formatCurrency, placeholderSvg, normalizeVariant } from '../utils/product'
import { isAuthenticated } from '../utils/auth'

const CART_THUMB_PLACEHOLDER = placeholderSvg(64, 86, 'No Image')

export default function CartPanel({ open, onClose, children, title = 'Giỏ hàng' }) {
  const [cart, setCart] = useState({ items: [], total: 0 })
  const [loading, setLoading] = useState(false)
  const [productMap, setProductMap] = useState({})

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      // Load cart when opening
      let cancelled = false
      async function load() {
        try {
          setLoading(true)
          if (!isAuthenticated()) { setCart({ items: [], total: 0 }); return }
          const data = await getCart()
          if (!cancelled) setCart({ items: data?.items || [], total: data?.total || 0 })
        } catch (_) {}
        finally { if (!cancelled) setLoading(false) }
      }
      load()
    
      // Listen for external cart changes
      const onChanged = () => {
        if (!isAuthenticated()) { setCart({ items: [], total: 0 }); return }
        getCart().then(data => setCart({ items: data?.items || [], total: data?.total || 0 })).catch(() => {})
      }
      window.addEventListener('cart:changed', onChanged)
      return () => { document.body.style.overflow = ''; window.removeEventListener('cart:changed', onChanged) }
    } else {
      document.body.style.overflow = ''
    }
  }, [open])

  // Load basic product info for thumbnails and names
  useEffect(() => {
    if (!open) return
    const ids = Array.from(new Set((cart.items || []).map(i => i?.variant?.product_id || i?.product?.id).filter(Boolean)))
    const missing = ids.filter(id => !productMap[id])
    if (missing.length === 0) return
    let cancelled = false
    async function loadProducts() {
      try {
        const results = await Promise.allSettled(missing.map(id => getProductById(id)))
        const next = { ...productMap }
        results.forEach((r, idx) => {
          const pid = missing[idx]
          if (r.status === 'fulfilled') {
            const data = r.value?.data || r.value
            next[pid] = data
          }
        })
        if (!cancelled) setProductMap(next)
      } catch (_) {}
    }
    loadProducts()
    return () => { cancelled = true }
  }, [open, cart.items, productMap])

  return (
    <>
      <div
        className={`cart-overlay ${open ? 'show' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`cart-panel ${open ? 'open' : ''}`}
        role="dialog"
        aria-labelledby="cartPanelTitle"
        aria-modal="true"
      >
        <div className="cart-panel__header d-flex align-items-center justify-content-between">
          <h6 id="cartPanelTitle" className="m-0">{title}</h6>
          <button type="button" className="btn btn-link text-dark p-0" aria-label="Đóng" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="cart-panel__body">
          {children || (
            <>
              {loading && (
                <div className="text-center text-muted small py-4">Đang tải...</div>
              )}
              {!loading && (!cart.items || cart.items.length === 0) && (
                <div className="text-center text-muted small py-4">Chưa có sản phẩm</div>
              )}
              {!loading && cart.items && cart.items.length > 0 && (
                <ul className="list-unstyled m-0">
                  {cart.items.map((item) => {
                    const norm = normalizeVariant(item?.variant)
                    const productId = norm.productId || item?.product?.id
                    const product = productMap[productId]
                    const img = resolveImageFromProduct(product || {}) || CART_THUMB_PLACEHOLDER
                    const name = product?.name || product?.title || `Sản phẩm #${productId}`
                    return (
                      <li key={item.id} className="d-flex align-items-center gap-2 py-2 border-bottom">
                        <img src={img} alt={name} width="64" height="86" style={{objectFit:'cover'}} />
                        <div className="flex-grow-1">
                          <div className="small fw-semibold text-truncate" title={name}>{name}</div>
                          <div className="text-muted small">Màu: {norm.colorName} • Size: {norm.sizeName}</div>
                          <div className="text-muted small">x{item.quantity} • {formatCurrency(item.price ?? norm.price ?? 0)}</div>
                        </div>
                        <div className="small fw-bold text-nowrap">{formatCurrency(item.line_total || (item.quantity * (item.price || norm.price || 0)))}</div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </>
          )}
        </div>
        <div className="cart-panel__footer">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <span className="fw-semibold">Tổng cộng:</span>
            <span className="fw-bold">{formatCurrency(cart?.total || 0)}</span>
          </div>
          <Link to="/cart" className="btn btn-dark w-100" onClick={onClose}>Xem giỏ hàng</Link>
        </div>
      </aside>
    </>
  )
}


