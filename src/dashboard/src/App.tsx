import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Incidents from './components/Incidents';
import Alerts from './components/Alerts';
import Settings from './components/Settings';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Bell, 
  Settings as SettingsIcon,
  Moon,
  Sun,
  Menu,
  X
} from 'lucide-react';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: AlertTriangle, label: 'Incidents', path: '/incidents' },
    { icon: Bell, label: 'Alerts', path: '/alerts' },
    { icon: SettingsIcon, label: 'Settings', path: '/settings' },
  ];

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-slate-800 
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 border-r border-gray-200 dark:border-slate-700
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
            <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
              SIR Status Checker
            </h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 
                         hover:bg-primary-50 dark:hover:bg-slate-700 hover:text-primary-600 
                         dark:hover:text-primary-400 transition-colors"
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <div className="lg:ml-64">
          {/* Top bar */}
          <header className="sticky top-0 z-30 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex-1" />

              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 
                         text-gray-700 dark:text-gray-200 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
            </div>
          </header>

          {/* Page content */}
          <main className="p-4 md:p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/incidents" element={<Incidents />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
