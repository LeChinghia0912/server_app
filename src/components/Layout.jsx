import Navbar from './Navbar'
import { useState, useCallback } from 'react'
import CartPanel from './CartPanel'
import Footer from './Footer'

export default function Layout({ children }) {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const openCart = useCallback(() => setIsCartOpen(true), [])
  const closeCart = useCallback(() => setIsCartOpen(false), [])
  return (
    <div className="d-flex flex-column min-vh-100 w-100 mx-auto">
      <Navbar onOpenCart={openCart} />
      <main className="flex-fill py-4">
        <div className={'container-xxl'}>{children}</div>
      </main>
      <Footer />
      <CartPanel open={isCartOpen} onClose={closeCart} />
    </div>
  )
}


