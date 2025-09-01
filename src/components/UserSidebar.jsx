import React from 'react'
import { NavLink } from 'react-router-dom'

export default function UserSidebar({ profile, onLogout }) {
  return (
    <div className="card h-100">
      <div className="card-body">
        <div className="d-flex align-items-center mb-3">
          <div
            className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3"
            style={{ width: 40, height: 40 }}
          >
            <i className="bi bi-person" />
          </div>
          <div>
            <div className="fw-semibold">{profile?.name || profile?.fullName || 'Khách hàng'}</div>
          </div>
        </div>
        <div className="list-group list-group-flush small">
          <NavLink to="/user" className={({ isActive }) => `list-group-item list-group-item-action${isActive ? ' active' : ''}`} end>
            <i className="bi bi-person me-2" /> Thông tin tài khoản
          </NavLink>
          <NavLink to="/user/orders" className={({ isActive }) => `list-group-item list-group-item-action${isActive ? ' active' : ''}`}>
            <i className="bi bi-bag me-2" /> Quản lý đơn hàng
          </NavLink>
          <NavLink to="/user/addresses" className={({ isActive }) => `list-group-item list-group-item-action${isActive ? ' active' : ''}`}>
            <i className="bi bi-geo-alt me-2" /> Số địa chỉ
          </NavLink>
          <button type="button" className="list-group-item list-group-item-action">
            <i className="bi bi-eye me-2" /> Sản phẩm đã xem
          </button>
          <button type="button" className="list-group-item list-group-item-action">
            <i className="bi bi-heart me-2" /> Sản phẩm yêu thích
          </button>
          <button type="button" className="list-group-item list-group-item-action">
            <i className="bi bi-chat-dots me-2" /> Hỏi đáp sản phẩm
          </button>
          <button type="button" className="list-group-item list-group-item-action">
            <i className="bi bi-life-preserver me-2" /> Hỗ trợ - IVY
          </button>
        </div>
        <div className="d-grid mt-3">
          <button className="btn btn-outline-dark" onClick={onLogout}>Đăng xuất</button>
        </div>
      </div>
    </div>
  )
}


