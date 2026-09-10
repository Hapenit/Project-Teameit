import { useAuth } from '../auth/AuthContext';
import { useTenant } from '../tenants/TenantContext';
import TenantSwitcher from '../components/TenantSwitcher';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/' },
  { label: 'Inbox', path: '/inbox' },
  { label: 'Contacts', path: '/crm' },
  { label: 'Pipelines', path: '/crm/pipelines' },
  { label: 'Campaigns', path: '/campaigns' },
  { label: 'Automations', path: '/automation' },
  { label: 'Social Publishing', path: '/publishing' },
  { label: 'Media Library', path: '/media' },
  { label: 'Analytics', path: '/analytics' },
  { label: 'Advertising', path: '/advertising' },
  { label: 'Integrations', path: '/integrations' },
  { label: 'Settings', path: '/settings' },
  { label: 'Notifications', path: '/notifications' },
  { label: 'Reports', path: '/reports' },
  { label: 'Audit Logs', path: '/audit-logs' },
  { label: 'Billing', path: '/billing' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { activeTenant } = useTenant();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-primary text-primary-foreground flex flex-col shadow-lg print:hidden">
        <div className="p-4 border-b border-primary-foreground/20">
          <h1 className="text-xl font-bold mb-4 tracking-tight">Teameit</h1>
          <TenantSwitcher />
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-3 py-2 rounded font-medium text-sm transition-colors ${
                isActive(item.path)
                  ? 'bg-primary-foreground/15 text-primary-foreground'
                  : 'opacity-75 hover:opacity-100 hover:bg-primary-foreground/10'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-primary-foreground/20 text-sm">
          <div className="truncate opacity-75 mb-2 text-xs">{user?.email}</div>
          <button
            onClick={signOut}
            className="w-full py-1.5 px-3 bg-red-500/80 hover:bg-red-500 rounded text-left transition-colors text-sm"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm px-8 py-4 print:hidden">
          <h2 className="text-xl font-semibold text-gray-800">
            {activeTenant ? activeTenant.name : 'Loading Workspace...'}
          </h2>
        </header>
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
