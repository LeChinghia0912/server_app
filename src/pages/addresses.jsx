import { useOutletContext } from 'react-router-dom'
import '../styles/users.scss'

export default function AddressesPage() {
  const { profile, loading, error } = useOutletContext()

  const normalized = normalizeAddresses(profile)

  return (
    <div>
      <h3 className="mb-3">Địa chỉ giao hàng</h3>

      {loading && <div className="alert alert-info">Đang tải...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && normalized.length === 0 && (
        <div className="alert alert-secondary">Bạn chưa có địa chỉ giao hàng.</div>
      )}

      {!loading && !error && normalized.map((addr) => (
        <AddressCard key={addr.id || addr.addressLine} addressItem={addr} />
      ))}
    </div>
  )
}

function normalizeAddresses(profile) {
  if (!profile) return []

  const joinAddress = (p) => [p?.address, p?.ward, p?.district, p?.province].filter(Boolean).join(', ')

  if (Array.isArray(profile.addresses) && profile.addresses.length) {
    return profile.addresses.map((a, idx) => ({
      id: a.id || idx + 1,
      fullName: a.fullName || a.receiverName || profile.name || profile.fullName || '',
      tag: a.tag || a.label || '',
      phone: a.phone || a.phoneNumber || profile.phone || '',
      addressLine: a.addressLine || a.address || [a.street, a.ward, a.district, a.province].filter(Boolean).join(', '),
      isDefault: Boolean(a.isDefault || a.default),
    }))
  }

  const singleAddress = profile.address || profile.ward || profile.district || profile.province
  if (singleAddress) {
    return [
      {
        id: profile.id || 1,
        fullName: profile.name || profile.fullName || '',
        tag: '',
        phone: profile.phone || '',
        addressLine: joinAddress(profile),
        isDefault: true,
      },
    ]
  }

  return []
}

function AddressCard({ addressItem }) {
  return (
    <div className="address-card">
      <div className="address-card__header">
        <div className="address-card__name">
          {addressItem.fullName}
          {addressItem.tag ? ` (${addressItem.tag})` : ''}
        </div>
        <div className="address-card__actions">
          <button className="address-card__edit" type="button">Sửa</button>
          {addressItem.isDefault && (
            <span className="address-card__badge">Mặc định</span>
          )}
        </div>
      </div>

      <div className="address-card__row">
        <div className="address-card__label">Điện thoại:</div>
        <div>{addressItem.phone}</div>
      </div>
      <div className="address-card__row">
        <div className="address-card__label">Địa chỉ:</div>
        <div>{addressItem.addressLine}</div>
      </div>
    </div>
  )
}