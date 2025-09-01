import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { isAuthenticated } from '../utils/auth'

export default function Navbar({ onOpenCart }) {
  const [authed, setAuthed] = useState(isAuthenticated())

  useEffect(() => {
    function onAuthChange() { setAuthed(isAuthenticated()) }
    window.addEventListener('auth:change', onAuthChange)
    return () => window.removeEventListener('auth:change', onAuthChange)
  }, [])
  return (
    <header className="bg-white sticky-top header-shadow">
        <div className="container-fluid header-container py-4" style={{ paddingLeft: 44, paddingRight: 44 }}>
        <div className="row align-items-center g-2">
          {/* Left: category links */}
          <div className="col-12 col-lg-5 d-none d-lg-flex align-items-center">
            <nav aria-label="Primary">
              <ul className="nav gap-3 small text-uppercase fw-semibold nav-links">
                <li className="nav-item">
                  <a className="nav-link px-0" href="#">Nữ</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link px-0" href="#">Nam</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link px-0" style={{ color: '#FF0000' }} href="#">
                    Mừng Quốc Khánh | Sale Upto 50%
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link px-0" href="#">Bộ sưu tập</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link px-0" href="#">Về chúng tôi</a>
                </li>
              </ul>
            </nav>
          </div>

          {/* Center: logo */}
          <div className="col-12 col-lg-2 text-center">
            <Link className="d-inline-flex align-items-center" to="/">
              <img
                src="https://pubcdn.ivymoda.com/ivy2/images/logo.png"
                alt="Logo"
                height="30"
              />
            </Link>
          </div>

          {/* Right: search + actions */}
          <div className="col-12 col-lg-5 d-flex justify-content-lg-end align-items-center gap-3">
            <div className="flex-grow-1 d-none d-lg-block" style={{ maxWidth: 560 }}>
              <div className="input-group search-field">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="TÌM KIẾM SẢN PHẨM"
                  aria-label="Tìm kiếm sản phẩm"
                />
              </div>
            </div>
            <div className="d-flex align-items-center gap-3 action-icons">
              <a className="text-reset" href="#" aria-label="Trợ giúp">
                <i className="bi bi-headphones fs-5"></i>
              </a>
              <Link className="text-reset" to={authed ? '/user' : '/login'} aria-label="Tài khoản">
                <i className="bi bi-person fs-5"></i>
              </Link>
              <button type="button" className="position-relative text-reset btn p-0" aria-label="Giỏ hàng" onClick={onOpenCart}>
                <i className="bi bi-bag fs-5"></i>
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-dark text-white cart-badge"
                >
                  0
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}


