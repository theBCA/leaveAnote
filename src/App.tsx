import { Suspense, lazy } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import CreateNotePage from './pages/CreateNotePage'
import ThemeToggle from './components/ThemeToggle'
import UserMenu from './components/UserMenu'
import { useTheme } from './context/useTheme'
import LoadingSpinner from './components/LoadingSpinner'

const ViewNotePage = lazy(() => import('./pages/ViewNotePage'))
const ManageNotePage = lazy(() => import('./pages/ManageNotePage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))

function BrandStamp({ isDark }: { isDark: boolean }) {
  return (
    <img
      src="/logo.png"
      alt="LeaveANote"
      width={112}
      height={120}
      style={{
        objectFit: 'contain',
        filter: isDark ? 'invert(0.85) hue-rotate(180deg)' : 'none',
      }}
    />
  );
}

function App() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 px-5 py-3 flex items-center justify-between" style={{
        background: isDark ? 'rgba(38,22,10,0.88)' : 'rgba(92,45,14,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${isDark ? 'rgba(160,100,50,0.1)' : 'rgba(139,69,19,0.08)'}`,
        color: isDark ? 'rgba(173,127,67,1)' : 'rgba(232,214,192,1)',
      }}>
        <Link to="/" className="flex items-center gap-3 no-underline group font-medium">
          <div className="transition-transform duration-300 group-hover:rotate-[-5deg]" style={{ transform: 'rotate(3deg)' }}>
            <BrandStamp isDark={isDark} />
          </div>
          <span className="text-[42px]" style={{
            fontFamily: "'Pacifico', cursive",
            color: isDark ? 'rgba(173,127,67,1)' : 'rgba(232,214,192,1)',
          }}>
            LeaveANote
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/pricing"
            className="text-sm font-semibold px-3 py-1.5 rounded-full transition-colors"
            style={{
              background: isDark ? 'rgba(173,127,67,0.10)' : 'rgba(255,244,231,0.18)',
              color: isDark ? 'rgba(232,214,192,1)' : 'rgba(255,244,231,1)',
              border: isDark ? '1px solid rgba(173,127,67,0.18)' : '1px solid rgba(255,244,231,0.25)',
            }}
          >
            Premium
          </Link>
          <UserMenu />
          <ThemeToggle />
        </div>
      </header>

      <div className="pt-[72px]">
        <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
          <Routes>
            <Route path="/" element={<CreateNotePage />} />
            <Route path="/note/:noteId" element={<ViewNotePage />} />
            <Route path="/manage/:noteId/:token" element={<ManageNotePage />} />
            <Route path="/pricing" element={<PricingPage />} />
          </Routes>
        </Suspense>
      </div>
    </>
  )
}

export default App
