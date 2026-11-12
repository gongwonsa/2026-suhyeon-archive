import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { PrivacyPage } from './pages/PrivacyPage'
import { UploadPage } from './pages/UploadPage'
import { WorkDetailPage } from './pages/WorkDetailPage'
import { WorksPage } from './pages/WorksPage'
import './styles/tokens.css'
import './styles/fonts.css'
import './styles/app.css'

function Layout() {
  return (
    <div className="layout">
      <Header />
      <main className="main">
        <div className="page-width">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  )
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/works" element={<WorksPage />} />
          <Route path="/works/:id" element={<WorkDetailPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="*" element={<Navigate to="/works" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
