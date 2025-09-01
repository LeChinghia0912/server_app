import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout({ children }) {
  return (
    <div className="d-flex flex-column min-vh-100 w-100 mx-auto">
      <Navbar />
      <main className="flex-fill py-4">
        <div className={'container-xxl'}>{children}</div>
      </main>
      <Footer />
    </div>
  )
}


