import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getOrderById } from '../api/orders'
import { showToast } from '../utils/toast'
import { formatCurrency, resolveImageFromProduct, normalizeVariant } from '../utils/product'
import { getProductById } from '../api/products'
import { getUserById } from '../api/users'

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState(null)
  const [productMap, setProductMap] = useState({})
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const data = await getOrderById(id)
        if (!cancelled) setOrder(data)
      } catch (e) {
        showToast({ variant: 'danger', message: e?.message || 'Không tải được đơn hàng' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  // Resolve products for images/names if not embedded
  const itemList = useMemo(() => {
    const raw = order?.items || order?.order_items || order?.lines || []
    return Array.isArray(raw) ? raw : []
  }, [order])

  useEffect(() => {
    const productIds = Array.from(new Set(itemList.map(i => {
      const v = i.variant || i.product_variant || i.item || {}
      const norm = normalizeVariant(v)
      return norm.productId || i.product_id || i.product?.id
    }).filter(Boolean)))
    const missing = productIds.filter(pid => !productMap[pid])
    if (missing.length === 0) return
    let cancelled = false
    async function loadProducts() {
      try {
        const results = await Promise.allSettled(missing.map(pid => getProductById(pid)))
        const map = { ...productMap }
        results.forEach((r, idx) => {
          const pid = missing[idx]
          if (r.status === 'fulfilled') {
            const data = r.value?.data || r.value
            map[pid] = data
          }
        })
        if (!cancelled) setProductMap(map)
      } catch (_) {}
    }
    loadProducts()
    return () => { cancelled = true }
  }, [itemList, productMap])

  const orderId = order?.code || order?.order_code || order?.id
  const created = order?.createdAt || order?.created_at
  const dateStr = created ? new Date(created).toLocaleString('vi-VN') : ''
  const status = order?.status || order?.state || 'Đang xử lý'
  const total = order?.total || order?.total_amount || order?.amount || 0

  const shipping = useMemo(() => {
    const raw = order?.shipping_address || order?.shippingAddress || order?.address || order?.delivery_address || order?.shipping || {}
    if (!raw) return {}
    if (typeof raw === 'string') {
      return { fullAddress: raw }
    }
    const name = raw.full_name || raw.fullname || raw.name || raw.recipient_name || raw.receiver_name || order?.receiver_name || order?.customer?.name
    const phone = raw.phone || raw.phone_number || raw.mobile || raw.tel || order?.receiver_phone || order?.customer?.phone
    const email = raw.email || order?.customer?.email
    const street = raw.address_line1 || raw.address1 || raw.street || raw.line1 || raw.address
    const ward = raw.ward || raw.ward_name
    const district = raw.district || raw.district_name
    const city = raw.city || raw.city_name || raw.province || raw.province_name
    const country = raw.country || raw.country_name
    const postalCode = raw.zip || raw.zipcode || raw.postal_code
    const note = raw.note || order?.note
    const fullAddress = raw.full_address || raw.address_text || [street, ward, district, city].filter(Boolean).join(', ')
    return { name, phone, email, street, ward, district, city, country, postalCode, note, fullAddress }
  }, [order])

  // Load order owner profile to show user's saved address
  useEffect(() => {
    const userId = order?.user_id || order?.userId || order?.user?.id || order?.customer_id || order?.customer?.id
    if (!userId) return
    let cancelled = false
    async function loadUser() {
      try {
        const profile = await getUserById(userId)
        if (!cancelled) setUserProfile(profile?.data || profile)
      } catch (_) {}
    }
    loadUser()
    return () => { cancelled = true }
  }, [order])

  const accountAddress = useMemo(() => {
    const p = userProfile
    if (!p) return null
    const pickLine = (a) => a?.addressLine || a?.address || [a?.street, a?.ward, a?.district, a?.province || a?.city].filter(Boolean).join(', ')
    const pickName = (a) => a?.fullName || a?.receiverName || p?.name || p?.fullName
    const pickPhone = (a) => a?.phone || a?.phoneNumber || p?.phone
    if (Array.isArray(p?.addresses) && p.addresses.length) {
      const def = p.addresses.find(x => x.isDefault || x.default) || p.addresses[0]
      return { name: pickName(def), phone: pickPhone(def), addressLine: pickLine(def) }
    }
    const hasSingle = p?.address || p?.ward || p?.district || p?.province || p?.city
    if (hasSingle) {
      const addressLine = [p?.address, p?.ward, p?.district, p?.province || p?.city].filter(Boolean).join(', ')
      return { name: p?.name || p?.fullName, phone: p?.phone, addressLine }
    }
    return null
  }, [userProfile])

  return (
    <div className="container py-4">
      <button className="btn btn-link px-0 mb-3" onClick={() => navigate(-1)}>
        <i className="bi bi-arrow-left"></i> Quay lại
      </button>
      {loading ? (
        <div>Đang tải...</div>
      ) : !order ? (
        <div className="text-danger">Không tìm thấy đơn hàng</div>
      ) : (
        <>
          <h3 className="mb-3">Đơn hàng #{orderId}</h3>

          <div className="row g-4">
            <div className="col-12 col-lg-8">
              <div className="card">
                <div className="card-body">
                  <h6 className="mb-3">Sản phẩm</h6>
                  <div className="table-responsive">
                    <table className="table align-middle m-0">
                      <thead>
                        <tr>
                          <th>Sản phẩm</th>
                          <th className="text-center">SL</th>
                          <th className="text-end">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itemList.map((it, idx) => {
                          const variant = it.variant || it.product_variant || it.item
                          const norm = normalizeVariant(variant || {})
                          const pid = norm.productId || it.product_id || it.product?.id
                          const product = productMap[pid]
                          const name = product?.name || product?.title || `Sản phẩm #${pid}`
                          const img = resolveImageFromProduct(product || {})
                          const qty = it.quantity || it.qty || 0
                          const unitPrice = it.price || it.unit_price || norm.price || 0
                          const lineTotal = it.line_total || it.total || unitPrice * qty
                          return (
                            <tr key={idx}>
                              <td>
                                <div className="d-flex gap-3">
                                  {img ? <img src={img} alt={name} width="64" height="64" style={{objectFit:'cover'}} /> : null}
                                  <div>
                                    <div className="fw-semibold">{name}</div>
                                    {norm.colorName ? <div className="text-muted small">Màu: {norm.colorName}</div> : null}
                                    {norm.sizeName ? <div className="text-muted small">Size: {norm.sizeName}</div> : null}
                                  </div>
                                </div>
                              </td>
                              <td className="text-center">{qty}</td>
                              <td className="text-end">{formatCurrency(lineTotal)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-4">
              <div className="card">
                <div className="card-body">
                  <h6 className="mb-3">Thông tin đơn</h6>
                  <div className="d-flex justify-content-between mb-2"><span>Mã đơn</span><span className="fw-semibold">{orderId}</span></div>
                  <div className="d-flex justify-content-between mb-2"><span>Ngày tạo</span><span>{dateStr}</span></div>
                  <div className="d-flex justify-content-between mb-2"><span>Trạng thái</span><span>{status}</span></div>
                  <div className="d-flex justify-content-between mb-2"><span>Tổng tiền</span><span className="fw-semibold">{formatCurrency(total)}</span></div>
                  <hr />
                  {accountAddress ? (
                    <>
                      <hr />
                      <h6 className="mb-2">Địa chỉ giao hàng</h6>
                      <div className="small text-muted">
                        {accountAddress?.name ? <div>{accountAddress.name}</div> : null}
                        {accountAddress?.phone ? <div>{accountAddress.phone}</div> : null}
                        <div>{accountAddress?.addressLine}</div>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}


