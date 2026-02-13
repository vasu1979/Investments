import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/reports', label: 'Reports', icon: '📈' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - match reference design */}
      <aside className="w-56 flex-shrink-0 bg-gray-100 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Menu</h2>
        </div>
        <nav className="p-2 flex-1">
          <ul className="space-y-0.5">
            {navItems.map(({ to, label, icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(to)
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-lg">{icon}</span>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 px-3 py-2 uppercase tracking-wider">Chit Fund Tracker</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
