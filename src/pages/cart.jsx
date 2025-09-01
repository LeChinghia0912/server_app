import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { getCart, updateCartItem, removeCartItem } from '../api/cart'
import { formatCurrency, resolveImageFromProduct, placeholderSvg, normalizeVariant } from '../utils/product'
import { showToast } from '../utils/toast'
import { getProductById } from '../api/products'
import { isAuthenticated } from '../utils/auth'

export default function CartPage() {
  const [cart, setCart] = useState({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [productMap, setProductMap] = useState({})

  const PLACEHOLDER_IMG = useMemo(() => placeholderSvg(120, 160, 'No Image'), [])

  async function loadCart() {
    try {
      setLoading(true)
      if (!isAuthenticated()) {
        setCart({ items: [], total: 0 })
        return
      }
      const data = await getCart()
      setCart({ items: data?.items || [], total: data?.total || 0 })
    } catch (e) {
      if (e?.status === 401) {
        setCart({ items: [], total: 0 })
      } else {
        showToast({ variant: 'danger', message: e?.message || 'Không tải được giỏ hàng' })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCart()
    const onAuth = () => loadCart()
    window.addEventListener('auth:change', onAuth)
    return () => window.removeEventListener('auth:change', onAuth)
  }, [])

  // Fetch product details (name, image) for items that only have product id
  useEffect(() => {
    const ids = Array.from(new Set((cart.items || []).map(i => i?.variant?.product_id || i?.product?.id).filter(Boolean)))
    const missing = ids.filter(id => !productMap[id])
    if (missing.length === 0) return
    let cancelled = false
    async function loadProducts() {
      try {
        const results = await Promise.allSettled(missing.map(id => getProductById(id)))
        const nextMap = { ...productMap }
        results.forEach((r, idx) => {
          const pid = missing[idx]
          if (r.status === 'fulfilled') {
            const data = r.value?.data || r.value
            nextMap[pid] = data
          }
        })
        if (!cancelled) setProductMap(nextMap)
      } catch (_) {}
    }
    loadProducts()
    return () => { cancelled = true }
  }, [cart.items, productMap])

  async function changeQty(item, nextQty) {
    if (nextQty < 0) return
    try {
      setUpdatingId(item.id)
      const data = await updateCartItem(item.id, nextQty)
      setCart({ items: data?.items || [], total: data?.total || 0 })
      window.dispatchEvent(new CustomEvent('cart:changed'))
    } catch (e) {
      showToast({ variant: 'danger', message: e?.message || 'Cập nhật số lượng thất bại' })
    } finally {
      setUpdatingId(null)
    }
  }

  async function removeItem(item) {
    try {
      setUpdatingId(item.id)
      const data = await removeCartItem(item.id)
      setCart({ items: data?.items || [], total: data?.total || 0 })
      window.dispatchEvent(new CustomEvent('cart:changed'))
    } catch (e) {
      showToast({ variant: 'danger', message: e?.message || 'Xóa sản phẩm thất bại' })
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="cart-page">
      <div className="row g-4">
        <div className="col-12">
          <div className="d-flex align-items-center gap-3 small text-muted mb-2">
            <span className="fw-semibold">Giỏ hàng</span>
            <i className="bi bi-dot"></i>
            <span>Đặt hàng</span>
            <i className="bi bi-dot"></i>
            <span>Thanh toán</span>
            <i className="bi bi-dot"></i>
            <span>Hoàn thành đơn</span>
          </div>
        </div>

        <div className="col-12 col-lg-8">
          <div className="bg-white p-3 p-md-4 rounded-2 shadow-sm">
            <h5 className="mb-3">Giỏ hàng của bạn <span className="text-danger">{cart.items.length} Sản Phẩm</span></h5>

            <div className="table-responsive">
              <table className="table align-middle m-0">
                <thead className="text-uppercase small text-muted">
                  <tr>
                    <th className="fw-semibold">Tên sản phẩm</th>
                    <th className="fw-semibold text-center">Chiết khấu</th>
                    <th className="fw-semibold text-center">Số lượng</th>
                    <th className="fw-semibold text-end">Tổng tiền</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5}>Đang tải giỏ hàng...</td></tr>
                  ) : cart.items.length === 0 ? (
                    <tr><td colSpan={5} className="text-center text-muted">Giỏ hàng trống</td></tr>
                  ) : (
                    cart.items.map((item) => {
                      const norm = normalizeVariant(item?.variant)
                      const productId = norm.productId || item?.product?.id
                      const product = productMap[productId]
                      const imgSrc = resolveImageFromProduct(product || {}) || PLACEHOLDER_IMG
                      const productName = product?.name || product?.title || ''
                      return (
                      <tr key={item.id}>
                        <td>
                          <div className="d-flex gap-3">
                            <img src={imgSrc} alt={productName || `Product ${productId}`} width="120" height="160" style={{objectFit:'cover'}} />
                            <div>
                              <div className="fw-semibold">{productName || `Sản phẩm #${productId}`}</div>
                              <div className="text-muted small">Mã biến thể: {norm.id}</div>
                              <div className="text-muted small mt-1">Màu sắc: {norm.colorName}</div>
                              <div className="text-muted small mt-1">Size: {norm.sizeName}</div>
                              <div className="text-muted small mt-1">Đơn giá: {formatCurrency(item.price ?? norm.price ?? 0)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-center text-danger">{/* Optional discount display */}</td>
                        <td className="text-center">
                          <div className="input-group input-group-sm justify-content-center" style={{maxWidth:140}}>
                            <button className="btn btn-outline-secondary" type="button" aria-label="Giảm" disabled={updatingId===item.id}
                              onClick={() => changeQty(item, Math.max(0, (item.quantity||0) - 1))}>-</button>
                            <input className="form-control text-center" value={item.quantity}
                              onChange={(e)=> {
                                const val = Math.max(0, Number.parseInt(e.target.value||'0')||0)
                                changeQty(item, val)
                              }} />
                            <button className="btn btn-outline-secondary" type="button" aria-label="Tăng" disabled={updatingId===item.id}
                              onClick={() => changeQty(item, (item.quantity||0) + 1)}>+</button>
                          </div>
                        </td>
                        <td className="text-end fw-bold">{formatCurrency(item.line_total || (item.quantity*(item.price || norm.price || 0)))}</td>
                        <td className="text-center">
                          <button className="btn btn-link text-danger p-0" aria-label="Xóa" disabled={updatingId===item.id} onClick={() => removeItem(item)}><i className="bi bi-trash3"></i></button>
                        </td>
                      </tr>
                    )})
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3">
              <Link className="btn btn-outline-dark" to="/">&larr; Tiếp tục mua hàng</Link>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="bg-white p-3 p-md-4 rounded-2 shadow-sm position-sticky" style={{top:16}}>
            <h6 className="mb-3">Tổng tiền giỏ hàng</h6>
            <div className="d-flex justify-content-between mb-2">
              <span>Tổng sản phẩm</span>
              <span>{cart.items.length}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>Tổng tiền hàng</span>
              <span>{formatCurrency(cart.items.reduce((s,i)=> s + (i.price ?? i.variant?.price ?? 0) * (i.quantity||0), 0))}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>Thành tiền</span>
              <span className="fw-semibold">{formatCurrency(cart.total || 0)}</span>
            </div>
            <div className="d-flex justify-content-between mb-3">
              <span>Tạm tính</span>
              <span className="fw-semibold">{formatCurrency(cart.total || 0)}</span>
            </div>
            <div className="small text-danger mb-3">
              Sản phẩm nằm trong chương trình KM giảm giá trên 50% không hỗ trợ đổi trả
            </div>
            <button className="btn btn-dark w-100">Đặt hàng</button>
          </div>
        </div>
      </div>
    </div>
  )
}


