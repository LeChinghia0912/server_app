import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { getCart, updateCartItem, removeCartItem, setCartMethod } from '../api/cart'
import { formatCurrency, resolveImageFromProduct, placeholderSvg, normalizeVariant } from '../utils/product'
import { showToast } from '../utils/toast'
import { getProductByIdCached } from '../api/products'
import { isAuthenticated } from '../utils/auth'
import { createOrder } from '../api/orders'
import QRPayment from '../assets/images/QR_Payment.png'

export default function CartPage() {
  const [cart, setCart] = useState({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [productMap, setProductMap] = useState({})
  const [placing, setPlacing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [qrPreviewOpen, setQrPreviewOpen] = useState(false)
  const navigate = useNavigate()

  const PLACEHOLDER_IMG = useMemo(() => placeholderSvg(120, 160, 'No Image'), [])

  function getMaxStockForItem(item) {
    const norm = normalizeVariant(item?.variant)
    const candidates = [
      norm?.stock,
      item?.stock,
      item?.available,
      item?.inventory,
      item?.available_quantity,
      item?.variant?.stock,
      item?.variant?.quantity,
      item?.variant?.inventory,
    ]
    for (const v of candidates) {
      const n = Number(v)
      if (Number.isFinite(n) && n >= 0) return n
    }
    return Infinity
  }

  async function loadCart() {
    try {
      setLoading(true)
      if (!isAuthenticated()) {
        setCart({ items: [], total: 0, method: undefined })
        return
      }
      const data = await getCart()
      setCart({
        items: data?.items || [],
        total: data?.total || 0,
        method: (typeof data?.method === 'number') ? data.method : undefined,
      })
    } catch (e) {
      if (e?.status === 401) {
        setCart({ items: [], total: 0, method: undefined })
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

  // Initialize and persist method with backend contract: 1 = COD, 2 = ATM
  useEffect(() => {
    const m = cart?.method
    if (m === 2) setPaymentMethod('bank')
    else if (m === 1) setPaymentMethod('cod')
  }, [cart?.method])

  // Persist selection to backend when user changes it
  useEffect(() => {
    const numeric = paymentMethod === 'bank' ? 2 : 1
    if (!isAuthenticated()) return
    if (cart?.method === numeric) return
    ;(async () => {
      try {
        await setCartMethod(numeric)
        setCart(prev => ({ ...prev, method: numeric }))
      } catch (_) {}
    })()
  }, [paymentMethod])

  // Fetch product details (name, image) for items that only have product id
  useEffect(() => {
    const ids = Array.from(new Set((cart.items || []).map(i => i?.variant?.product_id || i?.product?.id).filter(Boolean)))
    const missing = ids.filter(id => !productMap[id])
    if (missing.length === 0) return
    let cancelled = false
    async function loadProducts() {
      try {
        const results = await Promise.allSettled(missing.map(id => getProductByIdCached(id)))
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

  // Debounced quantity updates to reduce rapid API calls when typing
  const qtyTimers = useMemo(() => new Map(), [])
  async function changeQty(item, nextQty) {
    if (nextQty < 0) return
    const maxStock = getMaxStockForItem(item)
    const capped = Number.isFinite(maxStock) ? Math.min(nextQty, maxStock) : nextQty
    setUpdatingId(item.id)
    // optimistic UI update
    setCart(prev => {
      const items = (prev.items || []).map(it => it.id === item.id ? { ...it, quantity: capped } : it)
      const total = items.reduce((s, it) => s + (it.price ?? it.variant?.price ?? 0) * (it.quantity||0), 0)
      return { items, total, method: prev.method }
    })
    // debounce network call per item
    const key = item.id
    clearTimeout(qtyTimers.get(key))
    const timer = setTimeout(async () => {
      try {
        const data = await updateCartItem(item.id, capped)
        setCart(prev => ({
          items: data?.items || [],
          total: data?.total || 0,
          method: (typeof data?.method === 'number') ? data.method : prev.method,
        }))
        window.dispatchEvent(new CustomEvent('cart:changed'))
      } catch (e) {
        showToast({ variant: 'danger', message: e?.message || 'Cập nhật số lượng thất bại' })
      } finally {
        setUpdatingId(null)
      }
    }, 350)
    qtyTimers.set(key, timer)
  }

  async function removeItem(item) {
    try {
      setUpdatingId(item.id)
      const data = await removeCartItem(item.id)
      setCart(prev => ({
        items: data?.items || [],
        total: data?.total || 0,
        method: (typeof data?.method === 'number') ? data.method : prev.method,
      }))
      window.dispatchEvent(new CustomEvent('cart:changed'))
    } catch (e) {
      showToast({ variant: 'danger', message: e?.message || 'Xóa sản phẩm thất bại' })
    } finally {
      setUpdatingId(null)
    }
  }

  const invalidItems = useMemo(() => {
    return (cart.items || []).filter(it => {
      const max = getMaxStockForItem(it)
      if (max === 0 && (it.quantity || 0) > 0) return true
      if (Number.isFinite(max) && (it.quantity || 0) > max) return true
      return false
    })
  }, [cart.items])

  async function placeOrder() {
    try {
      if (!isAuthenticated()) {
        showToast({ variant: 'warning', message: 'Vui lòng đăng nhập để đặt hàng' })
        navigate('/login')
        return
      }
      if ((cart.items || []).length === 0) {
        showToast({ variant: 'warning', message: 'Giỏ hàng trống' })
        return
      }
      if (invalidItems.length > 0) {
        showToast({ variant: 'warning', message: 'Một số sản phẩm vượt quá tồn kho hoặc đã hết hàng' })
        return
      }
      setPlacing(true)
      const payload = {
        payment_method: paymentMethod === 'bank' ? 2 : 1, // 1=COD, 2=ATM
      }
      const numericMethod = paymentMethod === 'bank' ? 2 : 1
      const order = await createOrder(payload)
      showToast({ message: 'Đặt hàng thành công' })
      // Clear local cart state; backend should also clear server cart
      setCart({ items: [], total: 0 })
      window.dispatchEvent(new CustomEvent('cart:changed'))
      // Navigate to orders management
      navigate('/user/orders')
    } catch (e) {
      showToast({ variant: 'danger', message: e?.message || 'Đặt hàng thất bại' })
    } finally {
      setPlacing(false)
    }
  }

  const bankInfo = useMemo(() => ({
    bankName: 'BIDV',
    accountName: 'LE CHI NGHIA',
    accountNumber: '5110918709',
    branch: 'CN PHU DIEN PGD ANH SON',
    ImageQR: QRPayment,
  }), [])

  const copyToClipboard = (text) => {
    try {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          showToast({ variant: 'success', message: 'Đã sao chép' })
        }).catch(() => {})
      }
    } catch (_) {}
  }

  return (
    <>
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
                      const maxStock = getMaxStockForItem(item)
                      const atMax = Number.isFinite(maxStock) && (item.quantity || 0) >= maxStock
                      const outOfStock = maxStock === 0
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
                              {Number.isFinite(maxStock) ? (
                                <div className={`small mt-1 ${outOfStock ? 'text-danger' : 'text-muted'}`}>{outOfStock ? 'Hết hàng' : `Còn ${maxStock} sp`}</div>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="text-center text-danger">{/* Optional discount display */}</td>
                        <td className="text-center">
                          <div className="input-group input-group-sm justify-content-center" style={{maxWidth:140}}>
                            <button className="btn btn-outline-secondary" type="button" aria-label="Giảm" disabled={updatingId===item.id || (item.quantity||0) <= 0}
                              onClick={() => changeQty(item, Math.max(0, (item.quantity||0) - 1))}>-</button>
                            <input className="form-control text-center" value={item.quantity}
                              onChange={(e)=> {
                                const raw = Math.max(0, Number.parseInt(e.target.value||'0')||0)
                                const max = getMaxStockForItem(item)
                                const val = Number.isFinite(max) ? Math.min(raw, max) : raw
                                changeQty(item, val)
                              }} />
                            <button className="btn btn-outline-secondary" type="button" aria-label="Tăng" disabled={updatingId===item.id || (Number.isFinite(maxStock) && atMax)}
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
            <div className="mb-3">
              <div className="fw-semibold mb-2">Phương thức thanh toán</div>
              <div className="d-flex flex-column gap-2">
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="paymentMethod" id="cart-pm-cod" value="cod" checked={paymentMethod==='cod'} onChange={() => setPaymentMethod('cod')} />
                  <label className="form-check-label" htmlFor="cart-pm-cod">Thanh toán khi nhận hàng (COD)</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="paymentMethod" id="cart-pm-bank" value="bank" checked={paymentMethod==='bank'} onChange={() => setPaymentMethod('bank')} />
                  <label className="form-check-label" htmlFor="cart-pm-bank">Chuyển khoản ngân hàng (Trả trước)</label>
                </div>
              </div>
              {paymentMethod === 'bank' ? (
                <div className="border rounded p-3 bg-light mt-2">
                  <div className="small text-muted mb-2">Thông tin chuyển khoản</div>
                  <div className="d-flex justify-content-between mb-2"><span>Ngân hàng</span><span className="fw-semibold">{bankInfo.bankName}</span></div>
                  <div className="d-flex justify-content-between mb-2"><span>Chủ tài khoản</span><span className="fw-semibold">{bankInfo.accountName}</span></div>
                  <div className="mb-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <span>Số tài khoản</span>
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-semibold">{bankInfo.accountNumber}</span>
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => copyToClipboard(bankInfo.accountNumber)}>Sao chép</button>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between mb-2"><span>Chi nhánh</span><span className="fw-semibold">{bankInfo.branch}</span></div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Ảnh QR</span>
                    <span className="fw-semibold">
                      <img src={bankInfo.ImageQR} alt="QR Payment" width="100" height="100" style={{cursor:'pointer', objectFit:'contain'}} role="button" onClick={() => setQrPreviewOpen(true)} />
                    </span>
                  </div>
                  <div className="small text-muted">Sau khi đặt hàng, vui lòng chuyển khoản theo thông tin trên và ghi rõ nội dung thanh toán.</div>
                </div>
              ) : null}
            </div>
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
            <button className="btn btn-dark w-100" disabled={placing || loading || cart.items.length === 0} onClick={placeOrder}>
              {placing ? 'ĐANG ĐẶT HÀNG...' : 'Đặt hàng'}
            </button>
          </div>
        </div>
      </div>
    </div>
    {qrPreviewOpen ? (
      <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{backgroundColor:'rgba(0,0,0,0.7)', zIndex:1050}} onClick={() => setQrPreviewOpen(false)}>
        <div className="position-relative p-2" onClick={(e)=> e.stopPropagation()}>
          <button type="button" className="btn btn-light position-absolute" style={{top:8, right:8}} aria-label="Đóng" onClick={() => setQrPreviewOpen(false)}>
            <i className="bi bi-x-lg"></i>
          </button>
          <img src={bankInfo.ImageQR} alt="QR Payment Preview" style={{maxWidth:'90vw', maxHeight:'85vh', objectFit:'contain'}} />
        </div>
      </div>
    ) : null}
    </>
  )
}


