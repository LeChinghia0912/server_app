import { useMemo } from 'react'

export default function OrdersPage() {
  // UI-only: show demo orders; replace with real data later
  const orders = useMemo(() => (
    [
      { id: 'DH001', date: '10/01/2025', total: 499000, status: 'Đang xử lý' },
      { id: 'DH002', date: '12/01/2025', total: 259000, status: 'Hoàn tất' },
    ]
  ), [])

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
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{o.date}</td>
                    <td>{o.status}</td>
                    <td className="text-end">{Number(o.total).toLocaleString('vi-VN')}₫</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}


