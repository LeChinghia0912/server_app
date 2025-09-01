import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import UserSidebar from '../components/UserSidebar'
import { getCurrentUser, getUserById } from '../api/users'
import { clearAuth, getToken, decodeToken } from '../utils/auth'
import { logout as logoutApi } from '../api/auth'
import { useNavigate } from 'react-router-dom'
import { showToast } from '../utils/toast'

export default function UserLayout() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true

    async function fetchProfileRobust() {
      setLoading(true)
      setError('')

      try {
        const token = getToken()
        const payload = token ? decodeToken(token) : null
        const userId = payload?.id || payload?.userId || payload?.sub
        const numericId = Number(userId)
        let data = null
        if (Number.isFinite(numericId) && numericId > 0) {
          try {
            data = await getUserById(numericId)
          } catch (_) {}
        }

        if (!data) {
          data = await getCurrentUser()
        }

        if (mounted) setProfile(data?.data || data || null)
      } catch (err) {
        if (mounted) setError(err.message || 'Không thể tải thông tin người dùng.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchProfileRobust()
    return () => { mounted = false }
  }, [])

  async function onLogout() {
    try { await logoutApi() } catch (_) {}
    try { clearAuth() } catch (_) {}
    showToast({ variant: 'success', title: 'Đã đăng xuất', message: 'Hẹn gặp lại bạn!' })
    try { navigate('/login', { replace: true }) } catch (_) { window.location.href = '/login' }
  }

  return (
    <div className="container py-4">
      <div className="row g-4">
        <div className="col-lg-3">
          <UserSidebar profile={profile} onLogout={onLogout} />
        </div>
        <div className="col-lg-9">
          <Outlet context={{ profile, loading, error }} />
        </div>
      </div>
    </div>
  )
}


