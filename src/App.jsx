import './App.css'
import Home from './pages/Home'
import Login from './pages/login'
import Register from './pages/register'
import Layout from './components/Layout'
import { Routes, Route, Navigate } from 'react-router-dom'
import UserLayout from './pages/user-layout'
import UserProfile from './pages/user-profile'
import ProtectedRoute from './routes/ProtectedRoute'
import AddressesPage from './pages/addresses'
import OrdersPage from './pages/orders'
import ProductDetailPage from './pages/product-detail'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/user" element={
          <ProtectedRoute>
            <UserLayout />
          </ProtectedRoute>
        }>
          <Route index element={<UserProfile />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="addresses" element={<AddressesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
