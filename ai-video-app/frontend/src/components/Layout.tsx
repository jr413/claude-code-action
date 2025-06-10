import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';

export const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'ダッシュボード', href: '/dashboard', icon: '🏠' },
    { name: 'キャラクター', href: '/characters', icon: '👥' },
    { name: 'プラン', href: '/payment', icon: '💎' },
    { name: 'プロフィール', href: '/profile', icon: '👤' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-dark-100">
      {/* Header */}
      <header className="bg-dark-200 border-b border-dark-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-2xl">🎬</span>
                <span className="text-xl font-bold gradient-text">AI Video App</span>
              </Link>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={clsx(
                    'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-dark-300 text-primary-400'
                      : 'text-gray-300 hover:bg-dark-300 hover:text-white'
                  )}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <div className="text-gray-400">プラン</div>
                <div className={clsx(
                  'font-semibold',
                  user?.planType === 'premium' ? 'text-yellow-400' :
                  user?.planType === 'standard' ? 'text-blue-400' :
                  'text-gray-400'
                )}>
                  {user?.planType === 'premium' ? 'プレミアム' :
                   user?.planType === 'standard' ? 'スタンダード' :
                   'フリー'}
                </div>
              </div>
              <button
                onClick={logout}
                className="btn-secondary text-sm px-4 py-2"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile navigation */}
      <nav className="md:hidden bg-dark-200 border-b border-dark-300">
        <div className="px-2 py-2 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={clsx(
                'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-dark-300 text-primary-400'
                  : 'text-gray-300 hover:bg-dark-300 hover:text-white'
              )}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-dark-200 border-t border-dark-300 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © 2024 AI Video App. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                利用規約
              </Link>
              <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                プライバシーポリシー
              </Link>
              <Link to="/commercial-law" className="text-gray-400 hover:text-white transition-colors">
                特定商取引法表記
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};