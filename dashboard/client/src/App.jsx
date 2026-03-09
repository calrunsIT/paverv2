import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import BusinessDetail from './pages/BusinessDetail';
import ScanManagement from './pages/ScanManagement';

function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors ${
        isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200'
      }`}
    >
      {children}
    </Link>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950">
        <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-14 gap-8">
              <Link to="/" className="text-lg font-bold text-white tracking-tight">
                Paver
              </Link>
              <div className="flex items-center gap-5">
                <NavLink to="/">Businesses</NavLink>
                <NavLink to="/scans">Scans</NavLink>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/business/:id" element={<BusinessDetail />} />
            <Route path="/scans" element={<ScanManagement />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
