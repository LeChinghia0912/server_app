import { useState } from 'react'
import { showToast } from '../utils/toast'
import { useNavigate } from 'react-router-dom'
import { login as loginApi } from '../api/auth'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '', remember: false })
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  function onChange(e) {
    const { name, value, type, checked } = e.target
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!form.email || !form.password) {
      showToast({ variant: 'danger', title: 'Thiếu thông tin', message: 'Vui lòng nhập Email và Mật khẩu.' })
      return
    }
    setSubmitting(true)
    try {
      const res = await loginApi({ email: form.email, password: form.password, remember: form.remember })
      showToast({ variant: 'success', title: 'Thành công', message: 'Đăng nhập thành công.' })
      const role = (res?.role || res?.user?.role || res?.data?.role || res?.data?.user?.role || '').toString().toLowerCase()
      if (role === 'admin' || role === 'administrator') {
        try { navigate('/admin') } catch (_) { navigate('/') }
      } else {
        navigate('/')
      }
    } catch (err) {
      const msg = err.status === 401 ? 'Email hoặc mật khẩu không đúng.' : (err.message || 'Vui lòng thử lại.')
      showToast({ variant: 'danger', title: 'Đăng nhập thất bại', message: msg })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container login-page py-5">
      <div className="login-wrap mx-auto">
        <h2 className="text-center fw-semibold mb-2">Bạn đã có tài khoản </h2>
        <p className="text-center text-muted mb-4">
          Nếu bạn đã có tài khoản, hãy đăng nhập để tích lũy điểm thành viên
          và nhận được những ưu đãi tốt hơn!
        </p>
        <form className="login-form" onSubmit={onSubmit}>
          <div className="mb-3">
            <input
              type="email"
              className="form-control form-control-lg"
              placeholder="Email"
              name="email"
              value={form.email}
              onChange={onChange}
            />
          </div>
          <div className="mb-2">
            <input
              type="password"
              className="form-control form-control-lg"
              placeholder="Mật khẩu"
              name="password"
              value={form.password}
              onChange={onChange}
            />
          </div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="rememberMe" name="remember" checked={form.remember} onChange={onChange} />
              <label className="form-check-label" htmlFor="rememberMe">
                Ghi nhớ đăng nhập
              </label>
            </div>
            <a href="#" className="small">Quên mật khẩu?</a>
          </div>
          <div className="d-flex justify-content-between mb-3 small">
            <a href="#">Đăng nhập bằng mã QR</a>
            <a href="#">Đăng nhập bằng OTP</a>
            <a href="/register">Bạn chưa có tài khoản?</a>
          </div>
          <button type="submit" className="btn btn-dark btn-lg w-100 text-uppercase" disabled={submitting}>
            {submitting ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
