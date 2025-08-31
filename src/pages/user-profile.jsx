import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { showToast } from '../utils/toast'

export default function UserProfile() {
  const { profile, loading, error } = useOutletContext()
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', gender: 'female', dob: '' })

  useEffect(() => {
    if (!profile) return
    const name = profile?.name || profile?.fullName || ''
    const parts = String(name).trim().split(/\s+/)
    const firstName = parts.length ? parts[parts.length - 1] : ''
    const lastName = parts.length ? parts.slice(0, -1).join(' ') : ''
    setForm({
      firstName,
      lastName,
      phone: profile?.phone || '',
      email: profile?.email || '',
      gender: profile?.gender || 'female',
      dob: profile?.dob || profile?.dateOfBirth || ''
    })
  }, [profile])

  function onChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function onUpdate(e) {
    e.preventDefault()
    showToast({ variant: 'success', title: 'Cập nhật', message: 'Thông tin đã được lưu.' })
  }

  function onChangePassword() {
    showToast({ variant: 'info', title: 'Đổi mật khẩu', message: 'Tính năng đang phát triển.' })
  }

  return (
    <>
      {loading && <div className="alert alert-info">Đang tải...</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      {!loading && !error && (
        <>
          <div className="alert alert-primary">
            "Vì chính sách an toàn thẻ, bạn không thể thay đổi SĐT, Ngày sinh, Họ tên. Vui lòng liên hệ CSKH để được hỗ trợ"
          </div>
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="mb-3">Tài khoản của tôi</h5>
                  <form className="row g-3" onSubmit={onUpdate}>
                    <div className="col-sm-6">
                      <label className="form-label">Họ</label>
                      <input type="text" className="form-control" value={form.lastName} disabled />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label">Tên</label>
                      <input type="text" className="form-control" value={form.firstName} disabled />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Số điện thoại</label>
                      <input type="number" className="form-control" value={form.phone} disabled />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={form.email}
                        onChange={(e) => onChange('email', e.target.value)}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label d-block">Giới tính</label>
                      <div className="d-flex gap-4">
                        <div className="form-check">
                          <input className="form-check-input" type="radio" name="gender" id="gender-male" checked={form.gender === 'male'} onChange={() => onChange('gender', 'male')} />
                          <label className="form-check-label" htmlFor="gender-male">Nam</label>
                        </div>
                        <div className="form-check">
                          <input className="form-check-input" type="radio" name="gender" id="gender-female" checked={form.gender === 'female'} onChange={() => onChange('gender', 'female')} />
                          <label className="form-check-label" htmlFor="gender-female">Nữ</label>
                        </div>
                        <div className="form-check">
                          <input className="form-check-input" type="radio" name="gender" id="gender-other" checked={form.gender === 'other'} onChange={() => onChange('gender', 'other')} />
                          <label className="form-check-label" htmlFor="gender-other">Khác</label>
                        </div>
                      </div>
                    </div>
                    {/* <div className="col-12">
                      <label className="form-label">Ngày sinh</label>
                      <input type="text" className="form-control" value={form.dob} disabled />
                    </div> */}
                    <div className="col-12 d-flex gap-3">
                      <button type="submit" className="btn btn-dark">Cập nhật</button>
                      <button type="button" className="btn btn-outline-dark" onClick={onChangePassword}>Đổi mật khẩu</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card h-100">
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <tbody>
                        <tr>
                          <td className="text-muted">Điểm chiết khấu</td>
                          <td className="text-end fw-semibold">0</td>
                        </tr>
                        <tr>
                          <td className="text-muted">Chiết khấu</td>
                          <td className="text-end fw-semibold">0%</td>
                        </tr>
                        <tr>
                          <td className="text-muted">Hạn thẻ</td>
                          <td className="text-end fw-semibold">24/01/2029</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}


