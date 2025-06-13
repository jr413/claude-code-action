import { Link } from 'react-router-dom'
import { Film, User, LogIn, LogOut } from 'lucide-react'

const Navbar = () => {
  // TODO: Get auth state from context
  const isAuthenticated = false
  
  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Film className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold">AI Video Platform</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="flex items-center space-x-1 text-gray-700 hover:text-primary-600">
                  <User className="h-5 w-5" />
                  <span>ダッシュボード</span>
                </Link>
                <button className="flex items-center space-x-1 text-gray-700 hover:text-primary-600">
                  <LogOut className="h-5 w-5" />
                  <span>ログアウト</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="flex items-center space-x-1 text-gray-700 hover:text-primary-600">
                  <LogIn className="h-5 w-5" />
                  <span>ログイン</span>
                </Link>
                <Link to="/register" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                  無料で始める
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar