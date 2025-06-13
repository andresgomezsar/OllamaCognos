import { useAuth } from '../lib/auth-context';
import { useLocation } from 'wouter';

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className = '' }: LogoutButtonProps) {
  const { logout, loading } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      setLocation('/login');
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={`flex items-center space-x-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors ${className}`}
      aria-label="Logout"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>
      <span>Logout</span>
    </button>
  );
}
