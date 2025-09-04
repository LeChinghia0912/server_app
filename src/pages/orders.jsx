import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyOrders } from '../api/orders'
import { showToast } from '../utils/toast'
import { formatCurrency } from '../utils/product'

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const list = await getMyOrders()
        if (!cancelled) setOrders(list)
      } catch (e) {
        showToast({ variant: 'danger', message: e?.message || 'Không tải được danh sách đơn hàng' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="container py-4">
      <h3 className="mb-3">Quản lý đơn hàng</h3>
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th className="text-end">Tổng tiền</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4}>Đang tải...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={4} className="text-muted text-center">Chưa có đơn hàng</td></tr>
                ) : (
                  orders.map((o) => {
                    const id = o.code || o.order_code || o.id
                    const created = o.createdAt || o.created_at || o.date
                    const status = o.status || o.state || 'Đang xử lý'
                    const total = o.total || o.total_amount || o.amount || 0
                    const dateStr = created ? new Date(created).toLocaleDateString('vi-VN') : ''
                    return (
                      <tr key={String(id)}>
                        <td>
                          <Link to={`/user/orders/${encodeURIComponent(id)}`}>#{id}</Link>
                        </td>
                        <td>{dateStr}</td>
                        <td>{status}</td>
                        <td className="text-end">{formatCurrency(total)}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}


