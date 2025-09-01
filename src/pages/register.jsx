import { useState, useMemo } from 'react'
import { register as registerApi } from '../api/auth'
import { showToast } from '../utils/toast'

export default function Register() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    birthday: '',
    gender: 'female',
    province: '',
    district: '',
    ward: '',
    address: '',
    password: '',
    confirmPassword: '',
    captcha: '',
    agree: false,
    newsletter: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [captchaSeed, setCaptchaSeed] = useState(0)

  // Simple client-side captcha
  const captchaText = useMemo(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let s = ''
    for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)]
    return s
  }, [captchaSeed])

  function onChange(e) {
    const { name, type, value, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.fullName || !form.email || !form.phone || !form.password) {
      setError('Vui lòng nhập đầy đủ các trường bắt buộc.')
      showToast({ variant: 'danger', title: 'Thiếu thông tin', message: 'Điền đủ các trường bắt buộc.' })
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.')
      showToast({ variant: 'warning', title: 'Mật khẩu không khớp', message: 'Vui lòng kiểm tra lại.' })
      return
    }
    if (!form.agree) {
      setError('Bạn cần đồng ý với điều khoản của IVY.')
      showToast({ variant: 'warning', title: 'Điều khoản', message: 'Bạn cần đồng ý với điều khoản.' })
      return
    }
    if (form.captcha.trim().toUpperCase() !== captchaText) {
      setError('Captcha không đúng.')
      showToast({ variant: 'danger', title: 'Sai Captcha', message: 'Vui lòng nhập lại mã bảo vệ.' })
      return
    }

    setSubmitting(true)
    try {
      // route backend: /v1/auth/register
      const genderMap = {
        'nữ': 'female', 'nu': 'female', 'female': 'female',
        'nam': 'male', 'male': 'male',
        'khác': 'other', 'khac': 'other', 'other': 'other'
      }
      const dobStr = form.birthday ? new Date(form.birthday).toISOString().slice(0, 10) : null
      const payload = {
        name: form.fullName,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone,
        birthday: dobStr,
        dateOfBirth: dobStr,
        birthDate: dobStr,
        dob: dobStr,
        gender: genderMap[(form.gender || '').toString().toLowerCase()] || 'other',
        province: form.province,
        district: form.district,
        ward: form.ward,
        address: form.address,
        newsletter: form.newsletter,
      }
      await registerApi(payload)
      setSuccess('Đăng ký thành công. Bạn có thể đăng nhập ngay bây giờ!')
      showToast({ variant: 'success', title: 'Thành công', message: 'Đăng ký thành công.' })
      // Reset all inputs
      setForm({
        fullName: '',
        email: '',
        phone: '',
        birthday: '',
        gender: 'female',
        province: '',
        district: '',
        ward: '',
        address: '',
        password: '',
        confirmPassword: '',
        captcha: '',
        agree: false,
        newsletter: false,
      })
      setCaptchaSeed(Date.now())
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại.')
      showToast({ variant: 'danger', title: 'Đăng ký thất bại', message: err.message || 'Vui lòng thử lại.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container register-page py-5">
      <h2 className="text-center fw-semibold mb-4 text-uppercase">Đăng ký</h2>
      <div className="register-wrap mx-auto">
        {error && <div className="alert alert-danger mb-3">{error}</div>}
        {success && <div className="alert alert-success mb-3">{success}</div>}
        <form onSubmit={onSubmit}>
        <div className="row g-4">
          <div className="col-lg-8">
            <h5 className="mb-3">Thông tin khách hàng</h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Họ Tên<span className="text-danger">*</span></label>
                <input name="fullName" value={form.fullName} onChange={onChange} type="text" className="form-control form-control-lg" placeholder="Họ tên..." />
              </div>
              <div className="col-md-6">
                <label className="form-label">Email<span className="text-danger">*</span></label>
                <input name="email" value={form.email} onChange={onChange} type="email" className="form-control form-control-lg" placeholder="Email..." />
              </div>
              <div className="col-md-6">
                <label className="form-label">Điện thoại<span className="text-danger">*</span></label>
                <input name="phone" value={form.phone} onChange={onChange} type="tel" className="form-control form-control-lg" placeholder="Điện thoại..." />
              </div>
              <div className="col-md-6">
                <label className="form-label">Ngày sinh<span className="text-danger">*</span></label>
                <input name="birthday" value={form.birthday} onChange={onChange} type="date" className="form-control form-control-lg" placeholder="Ngày sinh..." />
              </div>
              <div className="col-md-6">
                <label className="form-label">Giới tính<span className="text-danger">*</span></label>
                <select name="gender" value={form.gender} onChange={onChange} className="form-select form-select-lg">
                  <option value="female">Nữ</option>
                  <option value="male">Nam</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Tỉnh/TP<span className="text-danger">*</span></label>
                <input name="province" value={form.province} onChange={onChange} type="text" className="form-control form-control-lg" placeholder="Tỉnh/TP..." />
              </div>
              <div className="col-md-6">
                <label className="form-label">Quận/Huyện<span className="text-danger">*</span></label>
                <input name="district" value={form.district} onChange={onChange} type="text" className="form-control form-control-lg" placeholder="Quận/Huyện..." />
              </div>
              <div className="col-md-12">
                <label className="form-label">Phường/Xã<span className="text-danger">*</span></label>
                <input name="ward" value={form.ward} onChange={onChange} type="text" className="form-control form-control-lg" placeholder="Phường/Xã..." />
              </div>
              <div className="col-12">
                <label className="form-label">Địa chỉ<span className="text-danger">*</span></label>
                <textarea name="address" value={form.address} onChange={onChange} className="form-control" rows="4" placeholder="Địa chỉ..."></textarea>
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <h5 className="mb-3">Thông tin mật khẩu</h5>
            <div className="mb-3">
              <label className="form-label">Mật khẩu<span className="text-danger">*</span></label>
              <input name="password" value={form.password} onChange={onChange} type="password" className="form-control form-control-lg" placeholder="Mật khẩu..." />
            </div>
            <div className="mb-3">
              <label className="form-label">Nhập lại mật khẩu<span className="text-danger">*</span></label>
              <input name="confirmPassword" value={form.confirmPassword} onChange={onChange} type="password" className="form-control form-control-lg" placeholder="Nhập lại mật khẩu..." />
            </div>
            <div className="mb-3">
              <label className="form-label">Mời nhập các ký tự trong hình vào ô sau:<span className="text-danger">*</span></label>
              <div className="d-flex align-items-center gap-3">
                <div className="captcha-box">{captchaText.split('').join(' ')}</div>
                <input name="captcha" value={form.captcha} onChange={onChange} type="text" className="form-control" placeholder="Nhập ký tự..." />
                <button type="button" className="btn btn-outline-secondary" onClick={() => setCaptchaSeed(Date.now())} title="Tải lại captcha">
                  <i className="bi bi-arrow-clockwise"></i>
                </button>
              </div>
            </div>
            <div className="form-check mb-2">
              <input className="form-check-input" type="checkbox" id="agree" name="agree" checked={form.agree} onChange={onChange} />
              <label className="form-check-label" htmlFor="agree">Đồng ý với các <a href="#">điều khoản</a> của IVY</label>
            </div>
            <div className="form-check mb-4">
              <input className="form-check-input" type="checkbox" id="newsletter" name="newsletter" checked={form.newsletter} onChange={onChange} />
              <label className="form-check-label" htmlFor="newsletter">Đăng ký nhận bản tin</label>
            </div>
            <button type="submit" className="btn btn-dark btn-lg w-100 text-uppercase" disabled={submitting}>
              {submitting ? 'Đang xử lý...' : 'Đăng ký'}
            </button>
          </div>
        </div>
        </form>
      </div>
    </div>
  )
}   